@extends('layouts.app', ['title' => 'PDV · Nova Venda · Alira CRM'])

@section('content')
<div class="pos-container">
    <div class="page-heading" style="margin-bottom: 20px;">
        <div>
            <h1>Frente de Caixa · PDV</h1>
            <p class="lede">Adicione produtos ao carrinho, selecione o cliente e conclua a venda.</p>
        </div>
        <a href="{{ route('sales.index') }}" class="button button-secondary">
            📋 Histórico de Vendas
        </a>
    </div>

    <form method="POST" action="{{ route('sales.store') }}" id="posForm">
        @csrf
        <div class="pos-layout-grid">
            <!-- Catálogo de Produtos e Busca -->
            <div class="pos-catalog-panel">
                <div class="pos-search-header">
                    <div class="field" style="margin-bottom: 0;">
                        <input type="text" id="productSearch" placeholder="🔍 Buscar por nome ou SKU do produto..." onkeyup="filterProducts()" style="background:#fff; border-radius:12px; font-size:14px;">
                    </div>
                </div>

                <div class="pos-products-grid" id="productsGrid">
                    @forelse ($products as $product)
                        @foreach ($product->variants as $variant)
                            <div class="pos-product-card" data-name="{{ strtolower($product->name) }}" data-sku="{{ strtolower($variant->sku) }}">
                                <div class="pos-card-badge">Estoque: {{ $variant->stock }}</div>
                                <div class="pos-product-icon">👗</div>
                                <strong class="pos-product-name">{{ $product->name }}</strong>
                                <div class="pos-variant-details">
                                    <span>Tam: <b>{{ $variant->size }}</b></span>
                                    <span>Cor: <b>{{ $variant->color }}</b></span>
                                </div>
                                <div class="pos-price-row">
                                    <span class="pos-price">R$ {{ number_format($variant->price ?? $product->price, 2, ',', '.') }}</span>
                                    <button type="button" class="btn-add-cart" 
                                            onclick="addToCart({{ $variant->id }}, '{{ addslashes($product->name) }} ({{ $variant->size }}/{{ $variant->color }})', {{ $variant->price ?? $product->price }}, {{ $variant->stock }})">
                                        + Adicionar
                                    </button>
                                </div>
                            </div>
                        @endforeach
                    @empty
                        <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--muted);">
                            Nenhum produto cadastrado com estoque. <a href="{{ route('products.index') }}" style="color: #2563eb;">Cadastrar Produtos</a>
                        </div>
                    @endforelse
                </div>
            </div>

            <!-- Painel do Carrinho e Finalização -->
            <div class="pos-cart-panel">
                <div class="card" style="padding: 20px; position: sticky; top: 20px;">
                    <h3 style="margin-bottom: 16px; font-size: 18px; display: flex; align-items: center; justify-content: space-between;">
                        <span>🛒 Carrinho de Compras</span>
                        <span id="cartCountBadge" class="badge badge-info">0 itens</span>
                    </h3>

                    <!-- Seleção de Cliente -->
                    <div class="field" style="margin-bottom: 16px;">
                        <label for="customer_id">Cliente (Opcional)</label>
                        <select name="customer_id" id="customer_id">
                            <option value="">-- Cliente não identificado (Balcão) --</option>
                            @foreach ($customers as $c)
                                <option value="{{ $c->id }}" {{ request('customer_id') == $c->id ? 'selected' : '' }}>
                                    {{ $c->name }} ({{ $c->whatsapp }})
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Lista de Itens do Carrinho -->
                    <div class="cart-items-list" id="cartItemsList">
                        <div class="cart-empty-message" id="cartEmptyMessage">
                            Seu carrinho está vazio.<br>Clique em <b>+ Adicionar</b> em um produto.
                        </div>
                    </div>

                    <!-- Forma de Pagamento -->
                    <div class="field" style="margin-top: 16px; margin-bottom: 16px;">
                        <label for="payment_method">Forma de Pagamento</label>
                        <select name="payment_method" id="payment_method" required onchange="handlePaymentChange()">
                            <option value="pix">📱 Pix (Instantâneo)</option>
                            <option value="credit">💳 Cartão de Crédito</option>
                            <option value="debit">💳 Cartão de Débito</option>
                            <option value="cash">💵 Dinheiro</option>
                            <option value="other">Outros</option>
                        </select>
                    </div>

                    <!-- Resumo Financeiro -->
                    <div class="cart-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span id="subtotalDisplay">R$ 0,00</span>
                        </div>
                        <div class="summary-row total-row">
                            <strong>Total a Pagar:</strong>
                            <strong id="totalDisplay" style="color: #10b981; font-size: 22px;">R$ 0,00</strong>
                        </div>
                    </div>

                    <!-- Botão Finalizar -->
                    <button type="submit" id="btnFinishSale" class="button" style="width: 100%; margin-top: 16px; padding: 14px; font-size: 16px;" disabled>
                        ✓ Finalizar Venda
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>

<script>
    let cart = {};

    function filterProducts() {
        const query = document.getElementById('productSearch').value.toLowerCase();
        const cards = document.querySelectorAll('.pos-product-card');
        cards.forEach(card => {
            const name = card.getAttribute('data-name');
            const sku = card.getAttribute('data-sku');
            if (name.includes(query) || sku.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function addToCart(variantId, name, price, maxStock) {
        if (cart[variantId]) {
            if (cart[variantId].quantity < maxStock) {
                cart[variantId].quantity++;
            } else {
                alert('Quantidade máxima em estoque atingida (' + maxStock + ' un).');
                return;
            }
        } else {
            cart[variantId] = {
                variantId: variantId,
                name: name,
                price: price,
                quantity: 1,
                maxStock: maxStock
            };
        }
        renderCart();
    }

    function removeFromCart(variantId) {
        delete cart[variantId];
        renderCart();
    }

    function updateQty(variantId, delta) {
        if (!cart[variantId]) return;
        const newQty = cart[variantId].quantity + delta;
        if (newQty <= 0) {
            removeFromCart(variantId);
        } else if (newQty > cart[variantId].maxStock) {
            alert('Estoque disponível: ' + cart[variantId].maxStock);
        } else {
            cart[variantId].quantity = newQty;
            renderCart();
        }
    }

    function renderCart() {
        const container = document.getElementById('cartItemsList');
        const emptyMsg = document.getElementById('cartEmptyMessage');
        const countBadge = document.getElementById('cartCountBadge');
        const subtotalDisp = document.getElementById('subtotalDisplay');
        const totalDisp = document.getElementById('totalDisplay');
        const btnFinish = document.getElementById('btnFinishSale');

        const keys = Object.keys(cart);
        let totalItems = 0;
        let grandTotal = 0;

        container.innerHTML = '';

        if (keys.length === 0) {
            container.appendChild(emptyMsg);
            emptyMsg.style.display = 'block';
            countBadge.innerText = '0 itens';
            subtotalDisp.innerText = 'R$ 0,00';
            totalDisp.innerText = 'R$ 0,00';
            btnFinish.disabled = true;
            return;
        }

        keys.forEach((key, index) => {
            const item = cart[key];
            totalItems += item.quantity;
            const lineTotal = item.price * item.quantity;
            grandTotal += lineTotal;

            const div = document.createElement('div');
            div.className = 'cart-item-row';
            div.innerHTML = `
                <div class="cart-item-info">
                    <strong class="cart-item-title">${item.name}</strong>
                    <span class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')} un</span>
                </div>
                <div class="cart-item-controls">
                    <button type="button" class="btn-qty" onclick="updateQty(${item.variantId}, -1)">−</button>
                    <span class="cart-item-qty">${item.quantity}</span>
                    <button type="button" class="btn-qty" onclick="updateQty(${item.variantId}, 1)">+</button>
                    <button type="button" class="btn-cart-remove" onclick="removeFromCart(${item.variantId})">✕</button>
                </div>
                <input type="hidden" name="items[${index}][variant_id]" value="${item.variantId}">
                <input type="hidden" name="items[${index}][quantity]" value="${item.quantity}">
            `;
            container.appendChild(div);
        });

        countBadge.innerText = totalItems + (totalItems === 1 ? ' item' : ' itens');
        const formatted = 'R$ ' + grandTotal.toFixed(2).replace('.', ',');
        subtotalDisp.innerText = formatted;
        totalDisp.innerText = formatted;
        btnFinish.disabled = false;
    }
</script>
@endsection
