@extends('layouts.app', ['title' => 'Recibo de Venda #' . $sale->number . ' · Alira CRM'])

@section('content')
<div class="receipt-container" style="max-width: 650px; margin: 0 auto;">
    <div class="page-heading" style="margin-bottom: 20px;">
        <div>
            <h1>Recibo da Venda #{{ $sale->number }}</h1>
            <p class="lede">Comprovante de pagamento e itens do pedido.</p>
        </div>
        <div style="display: flex; gap: 8px;">
            <a href="{{ route('sales.index') }}" class="button button-secondary">Voltar</a>
            <a href="{{ route('sales.create') }}" class="button">+ Nova Venda</a>
        </div>
    </div>

    <!-- Card de Recibo -->
    <div class="card" style="padding: 30px; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
        <div style="text-align: center; border-bottom: 2px dashed var(--line); padding-bottom: 20px; margin-bottom: 20px;">
            <div class="brand" style="font-size: 28px;">alira<span>crm</span></div>
            <p style="margin: 4px 0 0; color: var(--muted); font-size: 13px;">{{ $organization->name ?? 'Alira' }} · {{ $store->name ?? 'Loja Principal' }}</p>
            <div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700;">
                ✓ VENDA CONCLUÍDA
            </div>
        </div>

        <!-- Metadados do Pedido -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; font-size: 13px;">
            <div>
                <span style="color: var(--muted); display: block;">Número do Pedido:</span>
                <strong>#{{ $sale->number }}</strong>
            </div>
            <div>
                <span style="color: var(--muted); display: block;">Data e Hora:</span>
                <strong>{{ $sale->created_at->format('d/m/Y H:i') }}</strong>
            </div>
            <div>
                <span style="color: var(--muted); display: block;">Cliente:</span>
                <strong>{{ $sale->customer?->name ?? 'Cliente Balcão' }}</strong>
                @if($sale->customer?->whatsapp)
                    <small style="color: var(--muted); display: block;">📱 {{ $sale->customer->whatsapp }}</small>
                @endif
            </div>
            <div>
                <span style="color: var(--muted); display: block;">Forma de Pagamento:</span>
                <strong>{{ match($sale->payment_method) {
                    'pix' => '📱 Pix Instantâneo',
                    'credit' => '💳 Cartão de Crédito',
                    'debit' => '💳 Cartão de Débito',
                    'cash' => '💵 Dinheiro',
                    default => ucfirst($sale->payment_method)
                } }}</strong>
            </div>
        </div>

        <!-- Itens do Pedido -->
        <h4 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted);">Itens Comprados</h4>
        <div class="table-wrap" style="margin-bottom: 20px;">
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qtd</th>
                        <th>Preço Un</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($sale->items as $item)
                        <tr>
                            <td>
                                <strong>{{ $item->variant?->product?->name ?? 'Produto' }}</strong>
                                <small style="display: block; color: var(--muted);">{{ $item->variant?->size }} / {{ $item->variant?->color }}</small>
                            </td>
                            <td>{{ $item->quantity }}x</td>
                            <td>R$ {{ number_format($item->unit_price, 2, ',', '.') }}</td>
                            <td style="text-align: right;"><strong>R$ {{ number_format($item->total, 2, ',', '.') }}</strong></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Total -->
        <div style="border-top: 2px dashed var(--line); padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 18px; font-weight: 700;">VALOR TOTAL:</span>
            <strong style="color: #10b981; font-size: 26px;">R$ {{ number_format($sale->total, 2, ',', '.') }}</strong>
        </div>

        <!-- Ações do Recibo -->
        <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button type="button" class="button button-secondary" onclick="window.print()" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                🖨️ Imprimir Recibo
            </button>

            @php
                $msgWhats = "Olá, " . ($sale->customer?->name ?? 'Cliente') . "! Segue o comprovante do seu pedido #" . $sale->number . " na " . ($organization->name ?? 'Alira CRM') . ":\n\n";
                foreach($sale->items as $i) {
                    $msgWhats .= "• " . ($i->variant?->product?->name ?? 'Item') . " (" . $i->quantity . "x) - R$ " . number_format($i->total, 2, ',', '.') . "\n";
                }
                $msgWhats .= "\nTotal: R$ " . number_format($sale->total, 2, ',', '.') . " (" . strtoupper($sale->payment_method) . ")\nObrigado pela preferência!";
                $whatsPhone = $sale->customer?->whatsapp ? preg_replace('/\D+/', '', $sale->customer->whatsapp) : '';
                $whatsUrl = "https://wa.me/{$whatsPhone}?text=" . urlencode($msgWhats);
            @endphp

            @if($whatsPhone)
                <a href="{{ $whatsUrl }}" target="_blank" class="button" style="background: #25D366; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    💬 Enviar no WhatsApp
                </a>
            @else
                <button class="button" style="background: #ccc; cursor: not-allowed;" disabled title="Cliente sem WhatsApp">
                    💬 WhatsApp Indisponível
                </button>
            @endif
        </div>
    </div>
</div>
@endsection
