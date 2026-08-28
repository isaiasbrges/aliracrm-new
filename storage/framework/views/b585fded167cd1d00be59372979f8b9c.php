<?php $__env->startSection('content'); ?>
    <div class="page-heading">
        <div><h1>Nova venda</h1><p class="lede">Os preços e o estoque serão confirmados no servidor ao finalizar.</p></div>
    </div>

    <form method="POST" action="<?php echo e(route('sales.store')); ?>" id="sale-form">
        <?php echo csrf_field(); ?>
        <section class="grid grid-2">
            <div class="card">
                <div class="section-header"><h2>Itens do pedido</h2><button class="button button-secondary" type="button" id="add-item">Adicionar item</button></div>
                <div id="items" class="pdv-items" aria-live="polite"></div>
                <p id="empty-items" class="lede">Adicione um produto para começar.</p>
            </div>
            <div class="card">
                <div class="section-header"><h2>Fechamento</h2></div>
                <div class="field" style="margin-bottom:14px;"><label for="customer_id">Cliente (opcional)</label><select id="customer_id" name="customer_id"><option value="">Consumidor não identificado</option><?php $__currentLoopData = $customers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $customer): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($customer->id); ?>"><?php echo e($customer->name); ?> · <?php echo e($customer->whatsapp); ?></option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?></select></div>
                <div class="field" style="margin-bottom:20px;"><label for="payment_method">Forma de pagamento</label><select id="payment_method" name="payment_method" required><option value="pix">PIX</option><option value="cash">Dinheiro</option><option value="debit">Débito</option><option value="credit">Crédito</option><option value="other">Outro</option></select></div>
                <div style="border-top:1px solid var(--line); padding-top:18px;"><div style="align-items:center; display:flex; justify-content:space-between;"><span class="metric-label">Total informado</span><strong id="preview-total" style="font-family:'Space Grotesk'; font-size:28px;">R$ 0,00</strong></div><p class="metric-note">O valor final é recalculado com o preço oficial da variante no backend.</p></div>
                <button class="button" style="margin-top:22px; width:100%;" type="submit">Finalizar venda</button>
            </div>
        </section>
    </form>

    <template id="item-template">
        <div class="pdv-item">
            <div><label class="field"><span>Produto / variante</span><select class="variant-select" name="items[INDEX][variant_id]" required><option value="">Selecione</option><?php $__currentLoopData = $products; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $product): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php $__currentLoopData = $product->variants; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $variant): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($variant->id); ?>" data-price="<?php echo e($variant->price ?? $product->price); ?>"><?php echo e($product->name); ?> · <?php echo e($variant->size); ?> / <?php echo e($variant->color); ?> · R$ <?php echo e(number_format((float) ($variant->price ?? $product->price), 2, ',', '.')); ?> (<?php echo e($variant->stock); ?> un.)</option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?> <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?></select></label></div>
            <div><label class="field"><span>Quantidade</span><input class="quantity-input" name="items[INDEX][quantity]" type="number" min="1" max="9999" value="1" required></label><button class="button button-ghost remove-item" type="button">Remover</button></div>
        </div>
    </template>

    <?php $__env->startPush('scripts'); ?>
    <script>
        (() => {
            const list = document.getElementById('items');
            const template = document.getElementById('item-template');
            const empty = document.getElementById('empty-items');
            const total = document.getElementById('preview-total');
            let index = 0;
            const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
            const update = () => {
                let value = 0;
                list.querySelectorAll('.pdv-item').forEach(row => {
                    const option = row.querySelector('.variant-select option:checked');
                    const quantity = Number(row.querySelector('.quantity-input').value || 0);
                    value += Number(option?.dataset.price || 0) * quantity;
                });
                empty.hidden = list.children.length > 0;
                total.textContent = money(value);
            };
            document.getElementById('add-item').addEventListener('click', () => {
                const fragment = template.content.cloneNode(true);
                const row = fragment.querySelector('.pdv-item');
                row.innerHTML = row.innerHTML.replaceAll('INDEX', String(index++));
                row.querySelector('.remove-item').addEventListener('click', () => { row.remove(); update(); });
                row.querySelector('.variant-select').addEventListener('change', update);
                row.querySelector('.quantity-input').addEventListener('input', update);
                list.appendChild(row);
                update();
            });
        })();
    </script>
    <?php $__env->stopPush(); ?>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', ['title' => 'PDV · Alira CRM'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\Isaias\Downloads\alira-crm-laravel-mvp\resources\views/sales/create.blade.php ENDPATH**/ ?>