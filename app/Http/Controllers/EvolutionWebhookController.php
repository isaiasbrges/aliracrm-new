<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Models\Store;
use App\Models\WebhookEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EvolutionWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $expectedSecret = (string) config('services.evolution.webhook_secret', env('EVOLUTION_WEBHOOK_SECRET', 'alira-evo-secret-2026'));
        $globalApiKey = (string) config('services.evolution.key', env('EVOLUTION_API_KEY', 'B6D711FCDE4D4FD59365441E08497C40'));
        $providedToken = (string) ($request->bearerToken() ?? $request->header('apikey') ?? $request->header('x-api-key') ?? '');

        // Aceita se corresponder ao segredo do webhook ou à chave global da Evolution
        $isAuthorized = empty($expectedSecret)
            || hash_equals($expectedSecret, $providedToken)
            || ($globalApiKey !== '' && hash_equals($globalApiKey, $providedToken));

        if (!$isAuthorized) {
            Log::warning('Tentativa de acesso não autorizado ao Webhook Evolution API', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $eventName = strtoupper((string) ($payload['event'] ?? 'UNKNOWN'));
        $instance = (string) ($payload['instance'] ?? '');
        $externalId = data_get($payload, 'data.key.id')
            ?? data_get($payload, 'data.messageId')
            ?? hash('sha256', $request->getContent());

        $event = WebhookEvent::firstOrCreate(
            [
                'provider' => 'evolution_api',
                'instance' => $instance,
                'event_name' => $eventName,
                'external_id' => (string) $externalId,
            ],
            ['payload' => $payload],
        );

        if ($event->wasRecentlyCreated) {
            Log::info("Evolution Webhook: [{$eventName}] na instância [{$instance}]");

            // Processar mensagens recebidas (MESSAGES_UPSERT)
            if (str_contains($eventName, 'MESSAGES') || str_contains($eventName, 'UPSERT')) {
                $this->processMessageUpsert($instance, $payload);
            }
        }

        return response()->json([
            'accepted' => true,
            'event_id' => $event->id,
            'duplicate' => !$event->wasRecentlyCreated,
        ], 202);
    }

    /**
     * Processar mensagem do WhatsApp e sincronizar no CRM
     */
    protected function processMessageUpsert(string $instance, array $payload): void
    {
        try {
            $data = $payload['data'] ?? [];
            $key = $data['key'] ?? [];
            $remoteJid = (string) ($key['remoteJid'] ?? '');

            // Ignorar mensagens de grupos e status de stories
            if (str_ends_with($remoteJid, '@g.us') || str_contains($remoteJid, 'status@broadcast')) {
                return;
            }

            // Extrair número limpo
            $phone = preg_replace('/@.*$/', '', $remoteJid);
            $phone = preg_replace('/\D/', '', $phone);
            if (empty($phone)) {
                return;
            }

            $fromMe = (bool) ($key['fromMe'] ?? false);
            $pushName = (string) ($data['pushName'] ?? 'Cliente WhatsApp');

            // Extrair o texto da mensagem ou transcrição de áudio via IA
            $messageContent = $data['message'] ?? [];
            $transcription = data_get($payload, 'transcription')
                ?? data_get($payload, 'data.transcription')
                ?? data_get($payload, 'body.transcription');

            $body = $transcription
                ? "🎙️ [Áudio Transcrito]: " . $transcription
                : (data_get($messageContent, 'conversation')
                    ?? data_get($messageContent, 'extendedTextMessage.text')
                    ?? data_get($messageContent, 'imageMessage.caption')
                    ?? data_get($messageContent, 'documentMessage.caption')
                    ?? data_get($messageContent, 'videoMessage.caption')
                    ?? (isset($messageContent['imageMessage']) ? '📷 [Foto recebida]' : null)
                    ?? (isset($messageContent['audioMessage']) ? '🎵 [Áudio recebido]' : null)
                    ?? (isset($messageContent['documentMessage']) ? '📄 [Documento recebido]' : null)
                    ?? (isset($messageContent['stickerMessage']) ? '🏷️ [Figurinha]' : null)
                    ?? '[Mensagem recebida]');

            // 1. Localizar a loja pela instância (ex: dyvinus -> Loja Dyvinus)
            $store = Store::query()->where('slug', $instance)->where('active', true)->first();
            if (!$store) {
                // Tenta pelo nome ou pega a primeira loja ativa
                $store = Store::query()->where('name', 'like', "%{$instance}%")->first()
                    ?? Store::query()->where('active', true)->first();
            }

            if (!$store) {
                Log::warning("Nenhuma loja ativa encontrada para vincular webhook da instância {$instance}");
                return;
            }

            $organizationId = $store->organization_id;
            $storeId = $store->id;

            // 2. Localizar ou cadastrar o Cliente
            $customer = Customer::query()
                ->where('organization_id', $organizationId)
                ->where('whatsapp', $phone)
                ->first();

            if (!$customer) {
                $customer = Customer::create([
                    'organization_id'   => $organizationId,
                    'store_id'          => $storeId,
                    'name'              => $pushName ?: "WhatsApp {$phone}",
                    'whatsapp'          => $phone,
                    'whatsapp_consent'  => true,
                    'total_spent'       => 0,
                    'total_purchases'   => 0,
                ]);
            } elseif (empty($customer->name) || $customer->name === "WhatsApp {$phone}") {
                if (!empty($pushName)) {
                    $customer->update(['name' => $pushName]);
                }
            }

            // 3. Localizar ou criar a Conversa na Central de Atendimento
            $conversation = Conversation::query()
                ->where('organization_id', $organizationId)
                ->where('store_id', $storeId)
                ->where('external_chat_id', $phone)
                ->first();

            if (!$conversation) {
                $conversation = Conversation::create([
                    'organization_id'      => $organizationId,
                    'store_id'             => $storeId,
                    'customer_id'          => $customer->id,
                    'channel'              => 'whatsapp',
                    'external_chat_id'     => $phone,
                    'status'               => 'open',
                    'priority'             => 'normal',
                    'subject'              => 'Atendimento via WhatsApp',
                    'last_message_preview' => $body,
                    'last_message_at'      => now(),
                    'unread_count'         => $fromMe ? 0 : 1,
                ]);
            } else {
                $conversation->update([
                    'customer_id'          => $customer->id,
                    'last_message_preview' => $body,
                    'last_message_at'      => now(),
                    'status'               => $conversation->status === 'closed' ? 'open' : $conversation->status,
                    'unread_count'         => $fromMe ? $conversation->unread_count : $conversation->unread_count + 1,
                ]);
            }

            // 4. Gravar a Mensagem na tabela messages
            Message::create([
                'organization_id' => $organizationId,
                'conversation_id' => $conversation->id,
                'direction'       => $fromMe ? 'outbound' : 'inbound',
                'type'            => 'text',
                'body'            => $body,
                'status'          => 'delivered',
                'from_phone'      => $fromMe ? 'store' : $phone,
                'to_phone'        => $fromMe ? $phone : 'store',
                'sent_at'         => now(),
                'external_id'     => (string) ($key['id'] ?? null),
            ]);

            Log::info("Mensagem WhatsApp gravada no CRM para {$customer->name} ({$phone}) na loja {$store->name}");
        } catch (\Throwable $e) {
            Log::error("Erro ao processar mensagem Evolution Webhook: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
