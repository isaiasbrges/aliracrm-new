@extends('layouts.app', ['title' => 'Produtos & Estoque · Alira CRM'])

@section('content')
<div class="page-heading">
    <div>
        <h1>Catálogo de Produtos & Controle de Estoque</h1>
        <p class="lede">Gerencie variações, tamanhos, cores e valores de estoque em tempo real.</p>
    </div>
    <button class="button" onclick="document.getElementById('modal-new-product').style.display='flex'">
        + Novo Produto
    </button>
</div>

<!-- Cards de Indicadores de Estoque -->
<div class="grid grid-4" style="margin-bottom: 24px;">
    <div class="card">
        <span class="metric-label">Total de Produtos</span>
        <div class="metric-value">{{ $metrics['total_products'] }}</div>
        <div class="metric-note">Modelos cadastrados</div>
    </div>
    <div class="card">
        <span class="metric-label">Unidades em Estoque</span>
        <div class="metric-value" style="color: #2563eb;">{{ $metrics['total_units'] }} un</div>
        <div class="metric-note">Volume físico total</div>
    </div>
    <div class="card">
        <span class="metric-label">Valor Patrimonial</span>
        <div class="metric-value" style="color: #059669;">R$ {{ number_format($metrics['total_value'], 2, ',', '.') }}</div>
        <div class="metric-note">Preço de venda total</div>
    </div>
    <div class="card">
        <span class="metric-label">Alerta de Estoque Baixo</span>
        <div class="metric-value" style="color: {{ $metrics['low_stock'] > 0 ? '#d97706' : '#64748b' }};">
            {{ $metrics['low_stock'] }}
        </div>
        <div class="metric-note">Itens com ≤ 5 unidades</div>
    </div>
</div>

<!-- Tabela de Produtos -->
<div class="card">
    <div class="section-header">
        <h3>Lista de Produtos</h3>
        <form method="GET" action="{{ route('products.index') }}">
            <input type="text" name="search" placeholder="🔍 Buscar por nome ou SKU..." value="{{ $search }}" style="border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 8px 14px; font-size: 13px; min-width: 260px;">
        </form>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Produto & SKU</th>
                    <th>Variantes / Cores</th>
                    <th>Preço de Venda</th>
                    <th>Estoque Disponível</th>
                    <th style="text-align: right;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($products as $product)
                    @php($stock = $product->variants->sum('stock'))
                    <tr>
                        <td>
                            <strong>{{ $product->name }}</strong>
                            <small style="display: block; color: var(--color-muted);">SKU: {{ $product->sku }}</small>
                        </td>
                        <td>
                            @foreach ($product->variants as $variant)
                                <span class="badge" style="margin-right: 4px; margin-bottom: 4px; font-size: 11px;">
                                    {{ $variant->size }} / {{ $variant->color }} ({{ $variant->stock }} un)
                                </span>
                            @endforeach
                        </td>
                        <td>
                            <strong style="color: var(--color-accent); font-size: 14.5px;">
                                R$ {{ number_format((float) $product->price, 2, ',', '.') }}
                            </strong>
                        </td>
                        <td>
                            @if ($stock <= 0)
                                <span class="badge badge-priority-high">Esgotado (0)</span>
                            @elseif ($stock <= 5)
                                <span class="badge badge-warning">⚠️ Baixo ({{ $stock }})</span>
                            @else
                                <span class="badge badge-success">{{ $stock }} un.</span>
                            @endif
                        </td>
                        <td style="text-align: right;">
                            <span class="badge badge-info">Ativo</span>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--color-muted); padding: 36px;">
                            Nenhum produto cadastrado no momento.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div style="margin-top: 18px;">
        {{ $products->links() }}
    </div>
</div>

<!-- Modal Novo Produto -->
<div id="modal-new-product" class="modal-overlay" style="display: none;">
    <div class="modal-card" style="max-width: 520px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h3 style="margin: 0;">Cadastrar Novo Produto</h3>
            <button type="button" class="button-ghost" onclick="document.getElementById('modal-new-product').style.display='none'" style="font-size: 20px; cursor: pointer;">✕</button>
        </div>
        <form method="POST" action="{{ route('products.store') }}">
            @csrf
            <div class="field" style="margin-bottom: 14px;">
                <label for="name">Nome do Produto</label>
                <input id="name" name="name" type="text" value="{{ old('name') }}" placeholder="Ex: Vestido Festa Seda" required>
            </div>

            <div class="form-grid" style="margin-bottom: 14px;">
                <div class="field">
                    <label for="sku">Código SKU</label>
                    <input id="sku" name="sku" type="text" value="{{ old('sku') }}" placeholder="Ex: VST-001" required style="text-transform: uppercase;">
                </div>
                <div class="field">
                    <label for="price">Preço de Venda (R$)</label>
                    <input id="price" name="price" type="number" step="0.01" min="0" value="{{ old('price') }}" placeholder="0,00" required>
                </div>
            </div>

            <div class="form-grid" style="margin-bottom: 14px;">
                <div class="field">
                    <label for="size">Tamanho</label>
                    <input id="size" name="size" type="text" value="{{ old('size', 'M') }}" placeholder="Ex: P, M, G, 38..." required>
                </div>
                <div class="field">
                    <label for="color">Cor</label>
                    <input id="color" name="color" type="text" value="{{ old('color', 'Preto') }}" placeholder="Ex: Preto, Azul..." required>
                </div>
            </div>

            <div class="field" style="margin-bottom: 20px;">
                <label for="stock">Estoque Inicial (Unidades)</label>
                <input id="stock" name="stock" type="number" min="0" value="{{ old('stock', 10) }}" required>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="button button-secondary" onclick="document.getElementById('modal-new-product').style.display='none'">Cancelar</button>
                <button type="submit" class="button">Salvar Produto</button>
            </div>
        </form>
    </div>
</div>
@endsection
