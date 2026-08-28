

<?php $__env->startSection('content'); ?>
<div class="customer-360-container">
    <div class="page-heading">
        <div style="display: flex; align-items: center; gap: 16px;">
            <div class="customer-360-avatar">
                <?php echo e(strtoupper(substr($customer->name, 0, 2))); ?>

            </div>
            <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <h1 style="font-size: 28px;"><?php echo e($customer->name); ?></h1>
                    <span class="badge <?php echo e($customer->segment['badge']); ?>">
                        <?php echo e($customer->segment['icon']); ?> <?php echo e($customer->segment['label']); ?>

                    </span>
                </div>
                <p class="lede">
                    📱 <?php echo e($customer->whatsapp); ?>

                    <?php if($customer->email): ?> • ✉️ <?php echo e($customer->email); ?> <?php endif; ?>
                    <?php if($customer->city): ?> • 📍 <?php echo e($customer->city); ?>/<?php echo e($customer->state); ?> <?php endif; ?>
                </p>
            </div>
        </div>

        <div style="display: flex; gap: 10px;">
            <form method="POST" action="<?php echo e(route('conversations.start')); ?>">
                <?php echo csrf_field(); ?>
                <input type="hidden" name="customer_id" value="<?php echo e($customer->id); ?>">
                <button type="submit" class="button" style="background: #25D366;">
                    💬 Abrir WhatsApp
                </button>
            </form>
            <a href="<?php echo e(route('sales.create', ['customer_id' => $customer->id])); ?>" class="button">
                🛍️ Nova Venda
            </a>
        </div>
    </div>

    <!-- Cards de Métricas RFM do Cliente -->
    <div class="grid grid-4" style="margin-bottom: 24px;">
        <div class="card">
            <span class="metric-label">Total Gasto (LTV)</span>
            <div class="metric-value" style="color: #10b981;">R$ <?php echo e(number_format($customer->total_spent, 2, ',', '.')); ?></div>
            <div class="metric-note">Valor total investido na loja</div>
        </div>
        <div class="card">
            <span class="metric-label">Total de Compras</span>
            <div class="metric-value"><?php echo e($customer->total_purchases); ?> pedidos</div>
            <div class="metric-note">Frequência acumulada</div>
        </div>
        <div class="card">
            <span class="metric-label">Ticket Médio</span>
            <div class="metric-value">R$ <?php echo e(number_format($customer->average_ticket, 2, ',', '.')); ?></div>
            <div class="metric-note">Média por pedido</div>
        </div>
        <div class="card">
            <span class="metric-label">Última Compra</span>
            <div class="metric-value" style="font-size: 22px;">
                <?php echo e($customer->last_purchase_at ? $customer->last_purchase_at->diffForHumans() : 'Sem compras'); ?>

            </div>
            <div class="metric-note"><?php echo e($customer->last_purchase_at ? $customer->last_purchase_at->format('d/m/Y') : '-'); ?></div>
        </div>
    </div>

    <!-- Abas e Histórico Unificado -->
    <div class="grid grid-2" style="gap: 20px;">
        <!-- Coluna da Esquerda: Histórico de Compras -->
        <div class="card">
            <h3 style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                <span>🛍️ Histórico de Compras</span>
                <span class="badge badge-info"><?php echo e($customer->sales->count()); ?> pedidos</span>
            </h3>

            <?php $__empty_1 = true; $__currentLoopData = $customer->sales; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sale): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <div style="border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 12px; background: #faf8fb;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>Pedido #<?php echo e($sale->number); ?></strong>
                        <span style="color: var(--muted); font-size: 12px;"><?php echo e($sale->created_at->format('d/m/Y H:i')); ?></span>
                    </div>
                    <div style="font-size: 13px; color: var(--muted); margin-bottom: 10px;">
                        <?php $__currentLoopData = $sale->items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $it): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <div>• <?php echo e($it->quantity); ?>x <?php echo e($it->variant?->product?->name); ?> (<?php echo e($it->variant?->size); ?>/<?php echo e($it->variant?->color); ?>)</div>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line); padding-top: 8px;">
                        <span class="badge"><?php echo e(ucfirst($sale->payment_method)); ?></span>
                        <strong style="color: #10b981;">R$ <?php echo e(number_format($sale->total, 2, ',', '.')); ?></strong>
                    </div>
                </div>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <p style="text-align: center; color: var(--muted); padding: 30px;">Nenhuma compra registrada para este cliente.</p>
            <?php endif; ?>
        </div>

        <!-- Coluna da Direita: Conversas & Oportunidades -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Oportunidades no Funil -->
            <div class="card">
                <h3 style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                    <span>📊 Oportunidades no Funil</span>
                    <span class="badge badge-info"><?php echo e($customer->deals->count()); ?> deals</span>
                </h3>

                <?php $__empty_1 = true; $__currentLoopData = $customer->deals; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $deal): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <div style="border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong><?php echo e($deal->title); ?></strong>
                            <div style="font-size: 12px; color: var(--muted);">Estágio: <b><?php echo e($deal->stage_label); ?></b></div>
                        </div>
                        <strong style="color: #2563eb;">R$ <?php echo e(number_format($deal->value, 2, ',', '.')); ?></strong>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                    <p style="color: var(--muted); font-size: 13px; margin: 0;">Nenhuma oportunidade aberta no momento.</p>
                <?php endif; ?>
            </div>

            <!-- Interações no WhatsApp -->
            <div class="card">
                <h3 style="margin-bottom: 16px;">💬 Atendimentos no WhatsApp</h3>
                <?php $__empty_1 = true; $__currentLoopData = $customer->conversations; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $conv): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <div style="border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span class="badge badge-<?php echo e($conv->status === 'open' ? 'success' : 'secondary'); ?>">
                                <?php echo e($conv->status === 'open' ? '🟢 Aberto' : '⚪ Finalizado'); ?>

                            </span>
                            <span style="font-size: 12px; color: var(--muted);"><?php echo e($conv->last_message_at ? $conv->last_message_at->diffForHumans() : ''); ?></span>
                        </div>
                        <p style="font-size: 13px; color: var(--ink); margin: 0;"><?php echo e($conv->last_message_preview ?? 'Sem mensagens'); ?></p>
                        <div style="margin-top: 8px; text-align: right;">
                            <a href="<?php echo e(route('conversations.index', ['chat' => $conv->id])); ?>" style="font-size: 12px; color: #2563eb; font-weight: 600;">
                                Abrir Conversa Completa ➤
                            </a>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                    <p style="color: var(--muted); font-size: 13px; margin: 0;">Nenhum atendimento registrado.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', ['title' => $customer->name . ' · Visão 360° · Alira CRM'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\Isaias\Downloads\alira-crm-laravel-mvp\resources\views/customers/show.blade.php ENDPATH**/ ?>