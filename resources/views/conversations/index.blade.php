@extends('layouts.app', ['title' => 'Central WhatsApp · Alira CRM'])

@section('content')
<div class="chat-module-container">
    <div class="page-heading" style="margin-bottom: 20px;">
        <div>
            <h1>Central de Atendimento WhatsApp</h1>
            <p class="lede">Converse com seus clientes, envie propostas e feche vendas diretamente pelo chat.</p>
        </div>
        <button class="button" onclick="document.getElementById('modal-new-chat').style.display='flex'">
            + Nova Conversa
        </button>
    </div>

    <div class="chat-app-grid">
        <!-- Coluna Lateral de Conversas -->
        <div class="chat-sidebar-card">
            <div class="chat-search-bar">
                <form method="GET" action="{{ route('conversations.index') }}">
                    <input type="hidden" name="status" value="{{ $status }}">
                    <input type="text" name="search" placeholder="🔍 Buscar contato..." value="{{ $search }}" class="chat-input-search">
                </form>
            </div>

            <div class="chat-status-tabs">
                <a href="{{ route('conversations.index', ['status' => 'all', 'search' => $search]) }}" class="chat-tab {{ $status === 'all' ? 'active' : '' }}">Todas</a>
                <a href="{{ route('conversations.index', ['status' => 'open', 'search' => $search]) }}" class="chat-tab {{ $status === 'open' ? 'active' : '' }}">Abertas</a>
                <a href="{{ route('conversations.index', ['status' => 'closed', 'search' => $search]) }}" class="chat-tab {{ $status === 'closed' ? 'active' : '' }}">Finalizadas</a>
            </div>

            <div class="conversation-list">
                @forelse ($conversations as $conv)
                    <a href="{{ route('conversations.index', ['chat' => $conv->id, 'status' => $status]) }}" 
                       class="conversation-item {{ $activeConversation && $activeConversation->id === $conv->id ? 'active' : '' }}">
                        <div class="conv-avatar">
                            {{ strtoupper(substr($conv->customer?->name ?? $conv->external_chat_id, 0, 2)) }}
                        </div>
                        <div class="conv-body">
                            <div class="conv-top">
                                <strong class="conv-name">{{ $conv->customer?->name ?? 'WhatsApp ' . $conv->external_chat_id }}</strong>
                                <span class="conv-time">{{ $conv->last_message_at ? $conv->last_message_at->format('H:i') : '' }}</span>
                            </div>
                            <p class="conv-preview">{{ $conv->last_message_preview ?? 'Sem mensagens recentes' }}</p>
                        </div>
                        @if ($conv->unread_count > 0)
                            <span class="conv-badge">{{ $conv->unread_count }}</span>
                        @endif
                    </a>
                @empty
                    <div style="padding: 30px 15px; text-align: center; color: var(--muted); font-size: 13px;">
                        Nenhuma conversa encontrada.
                    </div>
                @endforelse
            </div>
        </div>

        <!-- Painel Principal de Chat -->
        <div class="chat-main-card">
            @if ($activeConversation)
                <!-- Header do Chat Ativo -->
                <div class="chat-active-header">
                    <div class="chat-contact-info">
                        <div class="conv-avatar" style="width: 42px; height: 42px; font-size: 15px;">
                            {{ strtoupper(substr($activeConversation->customer?->name ?? $activeConversation->external_chat_id, 0, 2)) }}
                        </div>
                        <div>
                            <strong style="font-size: 16px; display: block;">{{ $activeConversation->customer?->name ?? 'WhatsApp ' . $activeConversation->external_chat_id }}</strong>
                            <small style="color: var(--muted);">
                                📱 {{ $activeConversation->external_chat_id }}
                                @if($activeConversation->customer)
                                    • <a href="{{ route('customers.show', $activeConversation->customer) }}" style="color: #2563eb; text-decoration: underline;">Ver Perfil 360°</a>
                                @endif
                            </small>
                        </div>
                    </div>

                    <div class="chat-header-actions">
                        <form method="POST" action="{{ route('conversations.status.update', $activeConversation) }}" style="display: flex; gap: 8px;">
                            @csrf
                            @method('PATCH')
                            <select name="status" onchange="this.form.submit()" class="status-select">
                                <option value="open" {{ $activeConversation->status === 'open' ? 'selected' : '' }}>🟢 Aberta</option>
                                <option value="in_progress" {{ $activeConversation->status === 'in_progress' ? 'selected' : '' }}>🟡 Em Atendimento</option>
                                <option value="closed" {{ $activeConversation->status === 'closed' ? 'selected' : '' }}>⚪ Finalizada</option>
                            </select>
                        </form>
                        <a href="{{ route('sales.create', ['customer_id' => $activeConversation->customer_id]) }}" class="button" style="padding: 8px 12px; font-size: 13px;">
                            🛍️ Nova Venda
                        </a>
                    </div>
                </div>

                <!-- Lista de Mensagens / Balões -->
                <div class="chat-messages-area" id="chatMessages">
                    @forelse ($messages as $msg)
                        <div class="message-row {{ $msg->direction === 'outbound' ? 'outbound' : 'inbound' }}">
                            <div class="message-bubble">
                                <p class="message-text">{{ $msg->body }}</p>
                                <div class="message-meta">
                                    <span>{{ $msg->created_at ? $msg->created_at->format('H:i') : '' }}</span>
                                    @if($msg->direction === 'outbound')
                                        <span class="message-check">✓✓</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @empty
                        <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
                            <p>💬 Nenhuma mensagem ainda nesta conversa.</p>
                            <p style="font-size: 13px;">Envie uma mensagem abaixo para iniciar o diálogo.</p>
                        </div>
                    @endforelse
                </div>

                <!-- Input de Envio de Mensagem -->
                <div class="chat-input-footer">
                    <form method="POST" action="{{ route('conversations.messages.store', $activeConversation) }}" class="chat-send-form">
                        @csrf
                        <input type="text" name="body" placeholder="Digite uma mensagem para o cliente..." autocomplete="off" required autofocus class="chat-input-text">
                        <button type="submit" class="button" style="border-radius: 10px; padding: 11px 20px;">
                            Enviar ➤
                        </button>
                    </form>
                </div>
            @else
                <div class="chat-empty-state">
                    <div style="font-size: 48px; margin-bottom: 12px;">💬</div>
                    <h3>Selecione uma conversa</h3>
                    <p style="color: var(--muted); max-width: 320px; margin: 8px auto 20px;">Escolha um contato na lista ao lado ou inicie um novo atendimento de WhatsApp.</p>
                    <button class="button" onclick="document.getElementById('modal-new-chat').style.display='flex'">+ Nova Conversa</button>
                </div>
            @endif
        </div>
    </div>
</div>

<!-- Modal Novo Atendimento -->
<div id="modal-new-chat" class="modal-overlay" style="display: none;">
    <div class="modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h3 style="margin: 0;">Iniciar Atendimento WhatsApp</h3>
            <button type="button" class="button-ghost" onclick="document.getElementById('modal-new-chat').style.display='none'" style="font-size: 20px; cursor: pointer;">✕</button>
        </div>
        <form method="POST" action="{{ route('conversations.start') }}">
            @csrf
            <div class="field" style="margin-bottom: 16px;">
                <label for="modal_customer_id">Selecione o Cliente</label>
                <select id="modal_customer_id" name="customer_id" required>
                    <option value="">-- Escolha um cliente cadastrado --</option>
                    @foreach ($customers as $c)
                        <option value="{{ $c->id }}">{{ $c->name }} ({{ $c->whatsapp }})</option>
                    @endforeach
                </select>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="button button-secondary" onclick="document.getElementById('modal-new-chat').style.display='none'">Cancelar</button>
                <button type="submit" class="button">Abrir Conversa</button>
            </div>
        </form>
    </div>
</div>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        var chatArea = document.getElementById('chatMessages');
        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    });
</script>
@endsection
