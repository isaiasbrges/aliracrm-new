<?php

namespace App\Services;

use App\Models\Store;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionService
{
    protected string $baseUrl;
    protected string $globalApiKey;

    public function __construct()
    {
        $url = (string) (config('services.evolution.url') ?: env('EVOLUTION_API_URL'));
        if (empty($url) || str_contains($url, 'seudominio.com')) {
            $url = 'https://evolution.aliracrm.site';
        }
        $this->baseUrl = rtrim($url, '/');

        $key = (string) (config('services.evolution.key') ?: env('EVOLUTION_API_KEY'));
        if (empty($key)) {
            $key = 'B6D711FCDE4D4FD59365441E08497C40';
        }
        $this->globalApiKey = $key;
    }

    /**
     * Obter a URL base da Evolution API
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Verificar se as credenciais da Evolution API estão configuradas
     */
    public function isConfigured(): bool
    {
        return !empty($this->baseUrl) && !empty($this->globalApiKey);
    }

    /**
     * Enviar mensagem de texto via WhatsApp (Evolution API)
     */
    public function sendMessage(string $instanceName, string $phoneNumber, string $text): array
    {
        if (!$this->isConfigured()) {
            Log::warning("Evolution API não configurada no .env (EVOLUTION_API_URL / EVOLUTION_API_KEY)");
            return ['success' => false, 'error' => 'Evolution API não configurada no .env'];
        }

        // Limpar número (remover caracteres não numéricos)
        $cleanNumber = preg_replace('/\D/', '', $phoneNumber);

        // Se começar com 55 e tiver 11 dígitos no formato antigo ou novo, garantir padrão
        if (!str_starts_with($cleanNumber, '55') && strlen($cleanNumber) >= 10) {
            $cleanNumber = '55' . $cleanNumber;
        }

        try {
            $url = "{$this->baseUrl}/message/sendText/{$instanceName}";
            $response = Http::withoutVerifying()->withHeaders([
                'apikey' => $this->globalApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($url, [
                'number' => $cleanNumber,
                'text' => $text,
            ]);

            // Se falhar e for dyvinuss-looks ou dyvinus, tenta com o nome alternativo
            if ($response->failed() && in_array($instanceName, ['dyvinuss-looks', 'dyvinus'], true)) {
                $altInstance = $instanceName === 'dyvinuss-looks' ? 'dyvinus' : 'dyvinuss-looks';
                $altUrl = "{$this->baseUrl}/message/sendText/{$altInstance}";
                $altResponse = Http::withoutVerifying()->withHeaders([
                    'apikey' => $this->globalApiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(15)->post($altUrl, [
                    'number' => $cleanNumber,
                    'text' => $text,
                ]);

                if ($altResponse->successful()) {
                    return ['success' => true, 'data' => $altResponse->json()];
                }
            }

            if ($response->successful()) {
                Log::info("WhatsApp enviado com sucesso para {$cleanNumber} via instância {$instanceName}");
                return ['success' => true, 'data' => $response->json()];
            }

            Log::error("Erro Evolution API ({$response->status()}): " . $response->body());
            return [
                'success' => false,
                'status' => $response->status(),
                'error' => $response->body(),
            ];
        } catch (\Throwable $e) {
            Log::error("Exceção ao enviar WhatsApp via Evolution API: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Enviar Imagem / Foto via WhatsApp (Evolution API)
     */
    public function sendMedia(string $instanceName, string $phoneNumber, string $mediaUrl, ?string $caption = null, string $mediaType = 'image'): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Evolution API não configurada'];
        }

        $cleanNumber = preg_replace('/\D/', '', $phoneNumber);
        if (!str_starts_with($cleanNumber, '55') && strlen($cleanNumber) >= 10) {
            $cleanNumber = '55' . $cleanNumber;
        }

        try {
            $url = "{$this->baseUrl}/message/sendMedia/{$instanceName}";
            $payload = [
                'number' => $cleanNumber,
                'media' => $mediaUrl,
                'mediatype' => $mediaType,
                'caption' => $caption ?: '',
            ];

            $response = Http::withoutVerifying()->withHeaders([
                'apikey' => $this->globalApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(20)->post($url, $payload);

            if ($response->failed() && in_array($instanceName, ['dyvinuss-looks', 'dyvinus'], true)) {
                $altInstance = $instanceName === 'dyvinuss-looks' ? 'dyvinus' : 'dyvinuss-looks';
                $altUrl = "{$this->baseUrl}/message/sendMedia/{$altInstance}";
                $response = Http::withoutVerifying()->withHeaders([
                    'apikey' => $this->globalApiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(20)->post($altUrl, $payload);
            }

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }

            return ['success' => false, 'error' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Enviar Enquete / Opções Selecionáveis nativas do WhatsApp (Poll)
     */
    public function sendPoll(string $instanceName, string $phoneNumber, string $title, array $options, int $selectableCount = 1): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Evolution API não configurada'];
        }

        $cleanNumber = preg_replace('/\D/', '', $phoneNumber);
        if (!str_starts_with($cleanNumber, '55') && strlen($cleanNumber) >= 10) {
            $cleanNumber = '55' . $cleanNumber;
        }

        try {
            $url = "{$this->baseUrl}/message/sendPoll/{$instanceName}";
            $payload = [
                'number' => $cleanNumber,
                'name' => $title,
                'selectableCount' => $selectableCount,
                'values' => $options,
            ];

            $response = Http::withoutVerifying()->withHeaders([
                'apikey' => $this->globalApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($url, $payload);

            if ($response->failed() && in_array($instanceName, ['dyvinuss-looks', 'dyvinus'], true)) {
                $altInstance = $instanceName === 'dyvinuss-looks' ? 'dyvinus' : 'dyvinuss-looks';
                $altUrl = "{$this->baseUrl}/message/sendPoll/{$altInstance}";
                $response = Http::withoutVerifying()->withHeaders([
                    'apikey' => $this->globalApiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(15)->post($altUrl, $payload);
            }

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }

            return ['success' => false, 'error' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Enviar Mensagem Interativa com Lista de Opções Selecionáveis (List Menu)
     */
    public function sendListMenu(string $instanceName, string $phoneNumber, string $title, string $description, string $buttonText, array $rows, ?string $footerText = null): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Evolution API não configurada'];
        }

        $cleanNumber = preg_replace('/\D/', '', $phoneNumber);
        if (!str_starts_with($cleanNumber, '55') && strlen($cleanNumber) >= 10) {
            $cleanNumber = '55' . $cleanNumber;
        }

        try {
            $url = "{$this->baseUrl}/message/sendList/{$instanceName}";
            $payload = [
                'number' => $cleanNumber,
                'title' => $title,
                'description' => $description,
                'buttonText' => $buttonText ?: 'Ver Opções',
                'footerText' => $footerText ?: 'Dyvinuss Looks',
                'values' => $rows,
            ];

            $response = Http::withoutVerifying()->withHeaders([
                'apikey' => $this->globalApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($url, $payload);

            if ($response->failed() && in_array($instanceName, ['dyvinuss-looks', 'dyvinus'], true)) {
                $altInstance = $instanceName === 'dyvinuss-looks' ? 'dyvinus' : 'dyvinuss-looks';
                $altUrl = "{$this->baseUrl}/message/sendList/{$altInstance}";
                $response = Http::withoutVerifying()->withHeaders([
                    'apikey' => $this->globalApiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(15)->post($altUrl, $payload);
            }

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }

            return ['success' => false, 'error' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Obter status da conexão da instância (open, connecting, close)
     */
    public function getConnectionStatus(string $instanceName): array
    {
        if (!$this->isConfigured()) {
            return ['state' => 'unconfigured', 'connected' => false];
        }

        try {
            $url = "{$this->baseUrl}/instance/connectionState/{$instanceName}";
            $response = Http::withoutVerifying()->withHeaders([
                'apikey' => $this->globalApiKey,
            ])->timeout(8)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                $state = data_get($data, 'instance.state') ?? data_get($data, 'state', 'close');
                return [
                    'state' => $state,
                    'connected' => in_array($state, ['open', 'connected'], true),
                    'raw' => $data,
                ];
            }

            // Tenta instância alternativa se falhar
            if (in_array($instanceName, ['dyvinuss-looks', 'dyvinus'], true)) {
                $altInstance = $instanceName === 'dyvinuss-looks' ? 'dyvinus' : 'dyvinuss-looks';
                $altUrl = "{$this->baseUrl}/instance/connectionState/{$altInstance}";
                $altResponse = Http::withoutVerifying()->withHeaders([
                    'apikey' => $this->globalApiKey,
                ])->timeout(8)->get($altUrl);

                if ($altResponse->successful()) {
                    $altData = $altResponse->json();
                    $altState = data_get($altData, 'instance.state') ?? data_get($altData, 'state', 'close');
                    return [
                        'state' => $altState,
                        'connected' => in_array($altState, ['open', 'connected'], true),
                        'instance' => $altInstance,
                        'raw' => $altData,
                    ];
                }
            }

            return ['state' => 'not_found', 'connected' => false];
        } catch (\Throwable $e) {
            return ['state' => 'error', 'error' => $e->getMessage(), 'connected' => false];
        }
    }

    /**
     * Obter QR Code de conexão da instância
     */
    public function getConnectQrCode(string $instanceName): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Evolution API não configurada'];
        }

        try {
            $url = "{$this->baseUrl}/instance/connect/{$instanceName}";
            $response = Http::withoutVerifying()->withHeaders([
                'apikey' => $this->globalApiKey,
            ])->timeout(10)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'pairingCode' => data_get($data, 'pairingCode'),
                    'code' => data_get($data, 'code'),
                    'base64' => data_get($data, 'base64'),
                ];
            }

            return ['success' => false, 'error' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
