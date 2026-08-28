<?php $__env->startSection('content'); ?>
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
        <div class="metric-value"><?php echo e($metrics['total_products']); ?></div>
        <div class="metric-note">Modelos cadastrados</div>
    </div>
    <div class="card">
        <span class="metric-label">Unidades em Estoque</span>
        <div class="metric-value" style="color: #2563eb;"><?php echo e($metrics['total_units']); ?> un</div>
        <div class="metric-note">Volume físico total</div>
    </div>
    <div class="card">
        <span class="metric-label">Valor Patrimonial</span>
        <div class="metric-value" style="color: #059669;">R$ <?php echo e(number_format($metrics['total_value'], 2, ',', '.')); ?></div>
        <div class="metric-note">Preço de venda total</div>
    </div>
    <div class="card">
        <span class="metric-label">Alerta de Estoque Baixo</span>
        <div class="metric-value" style="color: <?php echo e($metrics['low_stock'] > 0 ? '#d97706' : '#64748b'); ?>;">
            <?php echo e($metrics['low_stock']); ?>

        </div>
        <div class="metric-note">Itens com ≤ 5 unidades</div>
    </div>
</div>

<!-- Tabela de Produtos -->
<div class="card">
    <div class="section-header">
        <h3>Lista de Produtos</h3>
        <form method="GET" action="<?php echo e(route('products.index')); ?>">
            <input type="text" name="search" placeholder="🔍 Buscar por nome ou SKU..." value="<?php echo e($search); ?>" style="border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 8px 14px; font-size: 13px; min-width: 260px;">
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
                <?php $__empty_1 = true; $__currentLoopData = $products; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $product): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <?php ($stock = $product->variants->sum('stock')); ?>
                    <tr>
                        <td>
                            <strong><?php echo e($product->name); ?></strong>
                            <small style="display: block; color: var(--color-muted);">SKU: <?php echo e($product->sku); ?></small>
                        </td>
                        <td>
                            <?php $__currentLoopData = $product->variants; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $variant): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <span class="badge" style="margin-right: 4px; margin-bottom: 4px; font-size: 11px;">
                                    <?php echo e($variant->size); ?> / <?php echo e($variant->color); ?> (<?php echo e($variant->stock); ?> un)
                                </span>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </td>
                        <td>
                            <strong style="color: var(--color-accent); font-size: 14.5px;">
                                R$ <?php echo e(number_format((float) $product->price, 2, ',', '.')); ?>

                            </strong>
                        </td>
                        <td>
                            <?php if($stock <= 0): ?>
                                <span class="badge badge-priority-high">Esgotado (0)</span>
                            <?php elseif($stock <= 5): ?>
                                <span class="badge badge-warning">⚠️ Baixo (<?php echo e($stock); ?>)</span>
                            <?php else: ?>
                                <span class="badge badge-success"><?php echo e($stock); ?> un.</span>
                            <?php endif; ?>
                        </td>
                        <td style="text-align: right;">
                            <span class="badge badge-info">Ativo</span>
                        </td>
                    </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--color-muted); padding: 36px;">
                            Nenhum produto cadastrado no momento.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <div style="margin-top: 18px;">
        <?php echo e($products->links()); ?>

    </div>
</div>

<!-- Modal Novo Produto -->
<div id="modal-new-product" class="modal-overlay" style="display: none;">
    <div class="modal-card" style="max-width: 520px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h3 style="margin: 0;">Cadastrar Novo Produto</h3>
            <button type="button" class="button-ghost" onclick="document.getElementById('modal-new-product').style.display='none'" style="font-size: 20px; cursor: pointer;">✕</button>
        </div>
        <form method="POST" action="<?php echo e(route('products.store')); ?>">
            <?php echo csrf_field(); ?>
            <div class="field" style="margin-bottom: 14px;">
                <label for="name">Nome do Produto</label>
                <input id="name" name="name" type="text" value="<?php echo e(old('name')); ?>" placeholder="Ex: Vestido Festa Seda" required>
            </div>

            <div class="form-grid" style="margin-bottom: 14px;">
                <div class="field">
                    <label for="sku">Código SKU</label>
                    <input id="sku" name="sku" type="text" value="<?php echo e(old('sku')); ?>" placeholder="Ex: VST-001" required style="text-transform: uppercase;">
                </div>
                <div class="field">
                    <label for="price">Preço de Venda (R$)</label>
                    <input id="price" name="price" type="number" step="0.01" min="0" value="<?php echo e(old('price')); ?>" placeholder="0,00" required>
                </div>
            </div>

            <div class="form-grid" style="margin-bottom: 14px;">
                <div class="field">
                    <label for="size">Tamanho</label>
                    <input id="size" name="size" type="text" value="<?php echo e(old('size', 'M')); ?>" placeholder="Ex: P, M, G, 38..." required>
                </div>
                <div class="field">
                    <label for="color">Cor</label>
                    <input id="color" name="color" type="text" value="<?php echo e(old('color', 'Preto')); ?>" placeholder="Ex: Preto, Azul..." required>
                </div>
            </div>

            <div class="field" style="margin-bottom: 20px;">
                <label for="stock">Estoque Inicial (Unidades)</label>
                <input id="stock" name="stock" type="number" min="0" value="<?php echo e(old('stock', 10)); ?>" required>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="button button-secondary" onclick="document.getElementById('modal-new-product').style.display='none'">Cancelar</button>
                <button type="submit" class="button">Salvar Produto</button>
            </div>
        </form>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', ['title' => 'Produtos & Estoque · Alira CRM'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\Isaias\Downloads\alira-crm-laravel-mvp\resources\views/products/index.blade.php ENDPATH**/ ?>