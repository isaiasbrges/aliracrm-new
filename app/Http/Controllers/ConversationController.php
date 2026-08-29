<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Services\EvolutionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function __construct(
        protected EvolutionService $evolutionService
    ) {}

    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;
        $status = $request->query('status', 'all');
        $search = $request->query('search');

        $query = Conversation::query()
            ->with(['customer', 'assignee'])
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->latest('last_message_at');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('external_chat_id', 'like', "%{$search}%")
                  ->orWhere('last_message_preview', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('whatsapp', 'like', "%{$search}%");
                  });
            });
        }

        $conversations = $query->get();

        $selectedConversationId = $request->query('chat') ?? $conversations->first()?->id;
        $activeConversation = null;
        $messages = collect();

        if ($selectedConversationId) {
            $activeConversation = Conversation::query()
                ->with(['customer.sales.items.variant.product', 'assignee'])
                ->where('organization_id', $organizationId)
                ->where('store_id', $storeId)
                ->find($selectedConversationId);

            if ($activeConversation) {
                // Marcar como lida
                if ($activeConversation->unread_count > 0) {
                    $activeConversation->update(['unread_count' => 0]);
                }

                $messages = $activeConversation->messages()
                    ->orderBy('created_at', 'asc')
                    ->get();
            }
        }

        $customers = Customer::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->orderBy('name')
            ->get();

        return Inertia::render('Conversations/Index', compact(
            'conversations',
            'activeConversation',
            'messages',
            'status',
            'search',
            'customers'
        ));
    }

    public function storeMessage(Request $request, Conversation $conversation): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');
        $storeId = $store->id;

        if ($conversation->organization_id !== $organizationId || $conversation->store_id !== $storeId) {
            abort(403);
        }

        $data = $request->validate([
            'body'      => ['nullable', 'string', 'max:5000'],
            'image'     => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,gif', 'max:5120'],
            'image_url' => ['nullable', 'string', 'max:1000'],
        ]);

        if (empty($data['body']) && !$request->hasFile('image') && empty($data['image_url'])) {
            return back()->withErrors(['body' => 'Digite uma mensagem ou anexe uma imagem.']);
        }

        $toPhone = $conversation->customer?->whatsapp ?? $conversation->external_chat_id;

        $mediaUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store("chat_media/{$storeId}", 'public');
            $mediaUrl = \Illuminate\Support\Facades\Storage::disk('public')->url($path);
        } elseif (!empty($data['image_url'])) {
            $mediaUrl = $data['image_url'];
        }

        $msgType = $mediaUrl ? 'image' : 'text';
        $msgBody = $data['body'] ?: ($mediaUrl ? '📷 Foto enviada' : '');

        $message = Message::create([
            'organization_id' => $organizationId,
            'conversation_id' => $conversation->id,
            'direction'       => 'outbound',
            'type'            => $msgType,
            'body'            => $msgBody,
            'status'          => 'sent',
            'from_phone'      => 'store',
            'to_phone'        => $toPhone,
            'metadata'        => $mediaUrl ? ['media_url' => $mediaUrl] : null,
            'sent_at'         => now(),
        ]);

        $conversation->update([
            'last_message_preview' => $msgBody,
            'last_message_at'      => now(),
            'status'               => $conversation->status === 'closed' ? 'open' : $conversation->status,
        ]);

        // Disparar envio real via Evolution API se configurado
        $instanceName = $store->slug ?? 'dyvinus';
        if ($mediaUrl) {
            $evoResult = $this->evolutionService->sendMedia($instanceName, $toPhone, $mediaUrl, $data['body'] ?? '');
        } else {
            $evoResult = $this->evolutionService->sendMessage($instanceName, $toPhone, $data['body']);
        }

        if ($evoResult['success'] ?? false) {
            $message->update(['status' => 'delivered']);
        }

        return redirect()->route('conversations.index', ['chat' => $conversation->id])
            ->with('success', 'Mensagem enviada com sucesso!');
    }

    public function sendInteractive(Request $request, Conversation $conversation): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');
        $storeId = $store->id;

        if ($conversation->organization_id !== $organizationId || $conversation->store_id !== $storeId) {
            abort(403);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'options' => ['required', 'array', 'min:2', 'max:10'],
            'options.*' => ['required', 'string', 'max:100'],
        ]);

        $toPhone = $conversation->customer?->whatsapp ?? $conversation->external_chat_id;
        $instanceName = $store->slug ?? 'dyvinus';

        $evoResult = $this->evolutionService->sendPoll(
            instanceName: $instanceName,
            phoneNumber: $toPhone,
            title: $data['title'],
            options: $data['options'],
        );

        $previewText = "📊 [Opções]: {$data['title']} (" . implode(' | ', $data['options']) . ")";

        Message::create([
            'organization_id' => $organizationId,
            'conversation_id' => $conversation->id,
            'direction' => 'outbound',
            'type' => 'interactive',
            'body' => $previewText,
            'status' => ($evoResult['success'] ?? false) ? 'delivered' : 'sent',
            'from_phone' => 'store',
            'to_phone' => $toPhone,
            'sent_at' => now(),
        ]);

        $conversation->update([
            'last_message_preview' => $previewText,
            'last_message_at' => now(),
            'status' => $conversation->status === 'closed' ? 'open' : $conversation->status,
        ]);

        return redirect()->route('conversations.index', ['chat' => $conversation->id])
            ->with('success', 'Mensagem interativa com opções enviada com sucesso no WhatsApp!');
    }

    public function updateStatus(Request $request, Conversation $conversation): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        if ($conversation->organization_id !== $organizationId || $conversation->store_id !== $storeId) {
            abort(403);
        }

        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,closed'],
        ]);

        $conversation->update(['status' => $data['status']]);

        return redirect()->route('conversations.index', ['chat' => $conversation->id])
            ->with('success', 'Status da conversa atualizado.');
    }

    public function startWithCustomer(Request $request): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
        ]);

        $customer = Customer::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->findOrFail($data['customer_id']);

        $conversation = Conversation::firstOrCreate(
            [
                'organization_id' => $organizationId,
                'store_id' => $storeId,
                'channel' => 'whatsapp',
                'external_chat_id' => $customer->whatsapp,
            ],
            [
                'customer_id' => $customer->id,
                'status' => 'open',
                'priority' => 'normal',
                'subject' => 'Atendimento com ' . $customer->name,
                'last_message_preview' => 'Conversa iniciada',
                'last_message_at' => now(),
            ]
        );

        if ($conversation->customer_id === null) {
            $conversation->update(['customer_id' => $customer->id]);
        }

        return redirect()->route('conversations.index', ['chat' => $conversation->id]);
    }
}
