@extends('layouts.app', ['title' => $customer->name . ' · Visão 360° · Alira CRM'])

@section('content')
<div class="customer-360-container">
    <div class="page-heading">
        <div style="display: flex; align-items: center; gap: 16px;">
            <div class="customer-360-avatar">
                {{ strtoupper(substr($customer->name, 0, 2)) }}
            </div>
            <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <h1 style="font-size: 28px;">{{ $customer->name }}</h1>
                    <span class="badge {{ $customer->segment['badge'] }}">
                        {{ $customer->segment['icon'] }} {{ $customer->segment['label'] }}
                    </span>
                </div>
                <p class="lede">
                    📱 {{ $customer->whatsapp }}
                    @if($customer->email) • ✉️ {{ $customer->email }} @endif
                    @if($customer->city) • 📍 {{ $customer->city }}/{{ $customer->state }} @endif
                </p>
            </div>
        </div>

        <div style="display: flex; gap: 10px;">
            <form method="POST" action="{{ route('conversations.start') }}">
                @csrf
                <input type="hidden" name="customer_id" value="{{ $customer->id }}">
                <button type="submit" class="button" style="background: #25D366;">
                    💬 Abrir WhatsApp
                </button>
            </form>
            <a href="{{ route('sales.create', ['customer_id' => $customer->id]) }}" class="button">
                🛍️ Nova Venda
            </a>
        </div>
    </div>

    <!-- Cards de Métricas RFM do Cliente -->
    <div class="grid grid-4" style="margin-bottom: 24px;">
        <div class="card">
            <span class="metric-label">Total Gasto (LTV)</span>
            <div class="metric-value" style="color: #10b981;">R$ {{ number_format($customer->total_spent, 2, ',', '.') }}</div>
            <div class="metric-note">Valor total investido na loja</div>
        </div>
        <div class="card">
            <span class="metric-label">Total de Compras</span>
            <div class="metric-value">{{ $customer->total_purchases }} pedidos</div>
            <div class="metric-note">Frequência acumulada</div>
        </div>
        <div class="card">
            <span class="metric-label">Ticket Médio</span>
            <div class="metric-value">R$ {{ number_format($customer->average_ticket, 2, ',', '.') }}</div>
            <div class="metric-note">Média por pedido</div>
        </div>
        <div class="card">
            <span class="metric-label">Última Compra</span>
            <div class="metric-value" style="font-size: 22px;">
                {{ $customer->last_purchase_at ? $customer->last_purchase_at->diffForHumans() : 'Sem compras' }}
            </div>
            <div class="metric-note">{{ $customer->last_purchase_at ? $customer->last_purchase_at->format('d/m/Y') : '-' }}</div>
        </div>
    </div>

    <!-- Abas e Histórico Unificado -->
    <div class="grid grid-2" style="gap: 20px;">
        <!-- Coluna da Esquerda: Histórico de Compras -->
        <div class="card">
            <h3 style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                <span>🛍️ Histórico de Compras</span>
                <span class="badge badge-info">{{ $customer->sales->count() }} pedidos</span>
            </h3>

            @forelse ($customer->sales as $sale)
                <div style="border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 12px; background: #faf8fb;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>Pedido #{{ $sale->number }}</strong>
                        <span style="color: var(--muted); font-size: 12px;">{{ $sale->created_at->format('d/m/Y H:i') }}</span>
                    </div>
                    <div style="font-size: 13px; color: var(--muted); margin-bottom: 10px;">
                        @foreach ($sale->items as $it)
                            <div>• {{ $it->quantity }}x {{ $it->variant?->product?->name }} ({{ $it->variant?->size }}/{{ $it->variant?->color }})</div>
                        @endforeach
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line); padding-top: 8px;">
                        <span class="badge">{{ ucfirst($sale->payment_method) }}</span>
                        <strong style="color: #10b981;">R$ {{ number_format($sale->total, 2, ',', '.') }}</strong>
                    </div>
                </div>
            @empty
                <p style="text-align: center; color: var(--muted); padding: 30px;">Nenhuma compra registrada para este cliente.</p>
            @endforelse
        </div>

        <!-- Coluna da Direita: Conversas & Oportunidades -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Oportunidades no Funil -->
            <div class="card">
                <h3 style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                    <span>📊 Oportunidades no Funil</span>
                    <span class="badge badge-info">{{ $customer->deals->count() }} deals</span>
                </h3>

                @forelse ($customer->deals as $deal)
                    <div style="border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>{{ $deal->title }}</strong>
                            <div style="font-size: 12px; color: var(--muted);">Estágio: <b>{{ $deal->stage_label }}</b></div>
                        </div>
                        <strong style="color: #2563eb;">R$ {{ number_format($deal->value, 2, ',', '.') }}</strong>
                    </div>
                @empty
                    <p style="color: var(--muted); font-size: 13px; margin: 0;">Nenhuma oportunidade aberta no momento.</p>
                @endforelse
            </div>

            <!-- Interações no WhatsApp -->
            <div class="card">
                <h3 style="margin-bottom: 16px;">💬 Atendimentos no WhatsApp</h3>
                @forelse ($customer->conversations as $conv)
                    <div style="border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span class="badge badge-{{ $conv->status === 'open' ? 'success' : 'secondary' }}">
                                {{ $conv->status === 'open' ? '🟢 Aberto' : '⚪ Finalizado' }}
                            </span>
                            <span style="font-size: 12px; color: var(--muted);">{{ $conv->last_message_at ? $conv->last_message_at->diffForHumans() : '' }}</span>
                        </div>
                        <p style="font-size: 13px; color: var(--ink); margin: 0;">{{ $conv->last_message_preview ?? 'Sem mensagens' }}</p>
                        <div style="margin-top: 8px; text-align: right;">
                            <a href="{{ route('conversations.index', ['chat' => $conv->id]) }}" style="font-size: 12px; color: #2563eb; font-weight: 600;">
                                Abrir Conversa Completa ➤
                            </a>
                        </div>
                    </div>
                @empty
                    <p style="color: var(--muted); font-size: 13px; margin: 0;">Nenhum atendimento registrado.</p>
                @endforelse
            </div>
        </div>
    </div>
</div>
@endsection
