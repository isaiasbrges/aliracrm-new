<?php $__env->startSection('content'); ?>
<div class="page-heading">
    <div>
        <h1>Visão da operação · <?php echo e($store->name ?? 'Loja Principal'); ?></h1>
        <p class="lede">Acompanhe vendas em tempo real, pipeline de oportunidades e métricas de atendimento.</p>
    </div>
    <div style="display: flex; gap: 10px;">
        <a href="<?php echo e(route('conversations.index')); ?>" class="button button-secondary">
            💬 Atendimentos (<?php echo e($metrics['open_conversations']); ?>)
        </a>
        <a href="<?php echo e(route('sales.create')); ?>" class="button">
            ⚡ Abrir Caixa / PDV
        </a>
    </div>
</div>

<!-- Grid de KPIs Executivos -->
<div class="grid grid-4" style="margin-bottom: 24px;">
    <div class="card">
        <span class="metric-label">Faturamento Total</span>
        <div class="metric-value" style="color: #10b981;">R$ <?php echo e(number_format($metrics['revenue'], 2, ',', '.')); ?></div>
        <div class="metric-note">Vendas concluídas</div>
    </div>
    <div class="card">
        <span class="metric-label">Ticket Médio</span>
        <div class="metric-value">R$ <?php echo e(number_format($metrics['avg_ticket'], 2, ',', '.')); ?></div>
        <div class="metric-note">Média por pedido</div>
    </div>
    <div class="card">
        <span class="metric-label">Funil de Vendas (Pipeline)</span>
        <div class="metric-value" style="color: #2563eb;">R$ <?php echo e(number_format($metrics['pipeline_value'], 2, ',', '.')); ?></div>
        <div class="metric-note"><a href="<?php echo e(route('deals.index')); ?>" style="color: #2563eb; text-decoration: underline;">Ver oportunidades</a></div>
    </div>
    <div class="card">
        <span class="metric-label">Clientes & Catálogo</span>
        <div class="metric-value"><?php echo e($metrics['customers_count']); ?> <small style="font-size: 14px; font-weight: normal; color: var(--muted);">/ <?php echo e($metrics['products_count']); ?> produtos</small></div>
        <div class="metric-note">Base ativa da loja</div>
    </div>
</div>

<!-- Gráficos e Analytics -->
<div class="grid grid-2" style="margin-bottom: 24px; gap: 20px;">
    <!-- Gráfico de Evolução dos Últimos 7 Dias -->
    <div class="card">
        <div class="section-header">
            <h3>📈 Faturamento dos Últimos 7 Dias</h3>
            <span class="badge badge-info">Semanal</span>
        </div>

        <div class="chart-bars-wrapper">
            <?php $__currentLoopData = $chartDays; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $bar): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <?php
                    $percentage = $maxChartValue > 0 ? max(8, round(($bar['revenue'] / $maxChartValue) * 100)) : 8;
                ?>
                <div class="chart-bar-column">
                    <div class="chart-bar-tooltip">R$ <?php echo e(number_format($bar['revenue'], 2, ',', '.')); ?></div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="height: <?php echo e($percentage); ?>%;"></div>
                    </div>
                    <span class="chart-bar-label"><?php echo e($bar['day']); ?></span>
                </div>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </div>
    </div>

    <!-- Top Produtos Mais Vendidos -->
    <div class="card">
        <div class="section-header">
            <h3>🏆 Top Produtos Mais Vendidos</h3>
            <a href="<?php echo e(route('products.index')); ?>" style="font-size: 12px; color: #2563eb;">Ver Catálogo</a>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Qtd Vendida</th>
                        <th style="text-align: right;">Total Faturado</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $__empty_1 = true; $__currentLoopData = $topProducts; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $prod): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <tr>
                            <td><strong><?php echo e($prod->name); ?></strong></td>
                            <td><span class="badge badge-success"><?php echo e($prod->total_qty); ?> un</span></td>
                            <td style="text-align: right;"><strong>R$ <?php echo e(number_format($prod->total_sales, 2, ',', '.')); ?></strong></td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <tr>
                            <td colspan="3" style="text-align: center; color: var(--muted); padding: 20px;">
                                Nenhuma venda computada ainda.
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Linha de Atividades Recentes e Conversas -->
<div class="grid grid-2" style="gap: 20px;">
    <!-- Últimas Vendas -->
    <div class="card">
        <div class="section-header">
            <h3>🛍️ Vendas Recentes</h3>
            <a href="<?php echo e(route('sales.index')); ?>" style="font-size: 12px; color: #2563eb;">Ver Todas</a>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Pagto</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $__empty_1 = true; $__currentLoopData = $recentSales; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sale): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <tr>
                            <td>
                                <a href="<?php echo e(route('sales.show', $sale)); ?>" style="color: var(--ink); font-weight: 700;">
                                    #<?php echo e($sale->number); ?>

                                </a>
                            </td>
                            <td><?php echo e($sale->customer?->name ?? 'Balcão'); ?></td>
                            <td><span class="badge"><?php echo e(ucfirst($sale->payment_method)); ?></span></td>
                            <td style="text-align: right;"><strong style="color: #10b981;">R$ <?php echo e(number_format($sale->total, 2, ',', '.')); ?></strong></td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <tr>
                            <td colspan="4" style="text-align: center; color: var(--muted); padding: 20px;">
                                Nenhuma venda recente.
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Atendimentos WhatsApp Recentes -->
    <div class="card">
        <div class="section-header">
            <h3>💬 Conversas de WhatsApp</h3>
            <a href="<?php echo e(route('conversations.index')); ?>" style="font-size: 12px; color: #2563eb;">Abrir Inbox</a>
        </div>

        <div class="conversation-feed-list">
            <?php $__empty_1 = true; $__currentLoopData = $recentConversations; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $conv): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <a href="<?php echo e(route('conversations.index', ['chat' => $conv->id])); ?>" class="conversation-feed-item">
                    <div class="conv-avatar" style="width: 36px; height: 36px; font-size: 12px;">
                        <?php echo e(strtoupper(substr($conv->customer?->name ?? $conv->external_chat_id, 0, 2))); ?>

                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between;">
                            <strong style="font-size: 13px;"><?php echo e($conv->customer?->name ?? $conv->external_chat_id); ?></strong>
                            <span style="font-size: 11px; color: var(--muted);"><?php echo e($conv->last_message_at ? $conv->last_message_at->diffForHumans() : ''); ?></span>
                        </div>
                        <p style="margin: 3px 0 0; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <?php echo e($conv->last_message_preview ?? 'Sem mensagens'); ?>

                        </p>
                    </div>
                </a>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <p style="text-align: center; color: var(--muted); padding: 20px; font-size: 13px;">Nenhuma conversa recente.</p>
            <?php endif; ?>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', ['title' => 'Dashboard · Alira CRM'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\Isaias\Downloads\alira-crm-laravel-mvp\resources\views/dashboard/index.blade.php ENDPATH**/ ?>