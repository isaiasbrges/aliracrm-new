<?php $__env->startSection('content'); ?>
<div class="sales-page">
    <div class="page-heading">
        <div>
            <h1>Histórico de Vendas & Pedidos</h1>
            <p class="lede">Acompanhe todas as vendas realizadas, emita recibos e compartilhe no WhatsApp.</p>
        </div>
        <div style="display: flex; gap: 10px;">
            <a href="<?php echo e(route('sales.export')); ?>" class="button button-secondary">
                📥 Exportar Excel (CSV)
            </a>
            <a href="<?php echo e(route('sales.create')); ?>" class="button">
                + Nova Venda (PDV)
            </a>
        </div>
    </div>

    <!-- Cards de Métricas de Vendas -->
    <div class="grid grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        <div class="card">
            <span class="metric-label">Faturamento Total</span>
            <div class="metric-value" style="color: #10b981;">R$ <?php echo e(number_format($metrics['total_revenue'], 2, ',', '.')); ?></div>
            <div class="metric-note">Vendas concluídas</div>
        </div>
        <div class="card">
            <span class="metric-label">Total de Pedidos</span>
            <div class="metric-value"><?php echo e($metrics['total_sales']); ?></div>
            <div class="metric-note">Transações registradas</div>
        </div>
        <div class="card">
            <span class="metric-label">Ticket Médio</span>
            <div class="metric-value">R$ <?php echo e(number_format($metrics['avg_ticket'], 2, ',', '.')); ?></div>
            <div class="metric-note">Média por pedido</div>
        </div>
    </div>

    <!-- Tabela de Vendas -->
    <div class="card">
        <div class="section-header">
            <h3>Lista de Pedidos</h3>
            <form method="GET" action="<?php echo e(route('sales.index')); ?>" style="display: flex; gap: 10px;">
                <input type="text" name="search" placeholder="🔍 Buscar pedido ou cliente..." value="<?php echo e($search); ?>" style="border: 1px solid var(--line); border-radius: 9px; padding: 6px 12px; font-size: 13px;">
                <select name="payment_method" onchange="this.form.submit()" style="border: 1px solid var(--line); border-radius: 9px; padding: 6px 10px; font-size: 13px;">
                    <option value="">Todas as formas</option>
                    <option value="pix" <?php echo e($paymentMethod === 'pix' ? 'selected' : ''); ?>>Pix</option>
                    <option value="credit" <?php echo e($paymentMethod === 'credit' ? 'selected' : ''); ?>>Cartão Crédito</option>
                    <option value="debit" <?php echo e($paymentMethod === 'debit' ? 'selected' : ''); ?>>Cartão Débito</option>
                    <option value="cash" <?php echo e($paymentMethod === 'cash' ? 'selected' : ''); ?>>Dinheiro</option>
                </select>
            </form>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Nº Pedido</th>
                        <th>Data / Hora</th>
                        <th>Cliente</th>
                        <th>Vendedor</th>
                        <th>Forma Pagto</th>
                        <th>Total</th>
                        <th style="text-align: right;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $__empty_1 = true; $__currentLoopData = $sales; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sale): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <tr>
                            <td><strong>#<?php echo e($sale->number); ?></strong></td>
                            <td><?php echo e($sale->created_at->format('d/m/Y H:i')); ?></td>
                            <td>
                                <?php if($sale->customer): ?>
                                    <a href="<?php echo e(route('customers.show', $sale->customer)); ?>" style="color: #2563eb; font-weight: 600;">
                                        <?php echo e($sale->customer->name); ?>

                                    </a>
                                <?php else: ?>
                                    <span style="color: var(--muted);">Balcão</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo e($sale->seller?->name ?? 'Sistema'); ?></td>
                            <td>
                                <span class="badge">
                                    <?php echo e(match($sale->payment_method) {
                                        'pix' => '📱 Pix',
                                        'credit' => '💳 Cartão Crédito',
                                        'debit' => '💳 Cartão Débito',
                                        'cash' => '💵 Dinheiro',
                                        default => ucfirst($sale->payment_method)
                                    }); ?>

                                </span>
                            </td>
                            <td><strong style="color: #10b981; font-size: 15px;">R$ <?php echo e(number_format($sale->total, 2, ',', '.')); ?></strong></td>
                            <td style="text-align: right;">
                                <a href="<?php echo e(route('sales.show', $sale)); ?>" class="button button-secondary" style="padding: 6px 12px; font-size: 12px;">
                                    🧾 Ver Recibo
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <tr>
                            <td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">
                                Nenhuma venda encontrada.
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div style="margin-top: 18px;">
            <?php echo e($sales->links()); ?>

        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', ['title' => 'Histórico de Vendas · Alira CRM'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\Isaias\Downloads\alira-crm-laravel-mvp\resources\views/sales/index.blade.php ENDPATH**/ ?>