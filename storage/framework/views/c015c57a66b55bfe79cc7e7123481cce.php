<?php $__env->startSection('content'); ?>
<div class="deals-page">
    <div class="page-heading">
        <div>
            <h1>Funil de Vendas & Pipeline</h1>
            <p class="lede">Gerencie seus leads e oportunidades em tempo real. Valor total no funil: <strong style="color: #10b981;">R$ <?php echo e(number_format($totalPipelineValue, 2, ',', '.')); ?></strong></p>
        </div>
        <button class="button" onclick="document.getElementById('modal-new-deal').style.display='flex'">
            + Nova Oportunidade
        </button>
    </div>

    <!-- Quadro Kanban -->
    <div class="kanban-board">
        <?php $__currentLoopData = $columns; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $stageKey => $col): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <div class="kanban-column" data-stage="<?php echo e($stageKey); ?>" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '<?php echo e($stageKey); ?>')">
                <div class="kanban-column-header" style="border-top: 3px solid <?php echo e($col['info']['color']); ?>;">
                    <div class="kanban-title-group">
                        <strong class="kanban-title"><?php echo e($col['info']['label']); ?></strong>
                        <span class="kanban-count"><?php echo e($col['count']); ?></span>
                    </div>
                    <div class="kanban-sum">R$ <?php echo e(number_format($col['total'], 2, ',', '.')); ?></div>
                </div>

                <div class="kanban-cards-list" id="col-<?php echo e($stageKey); ?>">
                    <?php $__empty_1 = true; $__currentLoopData = $col['deals']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $deal): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <div class="kanban-card" id="deal-<?php echo e($deal->id); ?>" draggable="true" ondragstart="handleDragStart(event, <?php echo e($deal->id); ?>)" ondragend="handleDragEnd(event)">
                            <div class="kanban-card-header">
                                <span class="badge badge-priority-<?php echo e($deal->priority); ?>">
                                    <?php echo e(match($deal->priority) { 'high' => '🔥 Alta', 'low' => 'Baixa', default => 'Média' }); ?>

                                </span>
                                <div class="kanban-card-actions">
                                    <form method="POST" action="<?php echo e(route('deals.destroy', $deal)); ?>" onsubmit="return confirm('Deseja excluir esta oportunidade?')">
                                        <?php echo csrf_field(); ?>
                                        <?php echo method_field('DELETE'); ?>
                                        <button type="submit" class="btn-icon-danger" title="Excluir">✕</button>
                                    </form>
                                </div>
                            </div>

                            <h4 class="kanban-deal-title"><?php echo e($deal->title); ?></h4>

                            <?php if($deal->customer): ?>
                                <div class="kanban-deal-customer">
                                    <span>👤</span>
                                    <a href="<?php echo e(route('customers.show', $deal->customer)); ?>"><?php echo e($deal->customer->name); ?></a>
                                </div>
                            <?php endif; ?>

                            <?php if($deal->notes): ?>
                                <p class="kanban-deal-notes"><?php echo e(Str::limit($deal->notes, 60)); ?></p>
                            <?php endif; ?>

                            <div class="kanban-card-footer">
                                <strong class="kanban-deal-value">R$ <?php echo e(number_format($deal->value, 2, ',', '.')); ?></strong>
                                
                                <!-- Mudar estágio rápido -->
                                <form method="POST" action="<?php echo e(route('deals.updateStage', $deal)); ?>">
                                    <?php echo csrf_field(); ?>
                                    <?php echo method_field('PATCH'); ?>
                                    <select name="stage" onchange="this.form.submit()" class="kanban-stage-select">
                                        <option value="lead" <?php echo e($deal->stage === 'lead' ? 'selected' : ''); ?>>Lead</option>
                                        <option value="contacted" <?php echo e($deal->stage === 'contacted' ? 'selected' : ''); ?>>Contato</option>
                                        <option value="proposal" <?php echo e($deal->stage === 'proposal' ? 'selected' : ''); ?>>Proposta</option>
                                        <option value="negotiation" <?php echo e($deal->stage === 'negotiation' ? 'selected' : ''); ?>>Negociação</option>
                                        <option value="won" <?php echo e($deal->stage === 'won' ? 'selected' : ''); ?>>Ganho ✓</option>
                                        <option value="lost">Perdido ✕</option>
                                    </select>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <div class="kanban-empty-col">
                            Nenhum card nesta etapa
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
</div>

<!-- Modal Nova Oportunidade -->
<div id="modal-new-deal" class="modal-overlay" style="display: none;">
    <div class="modal-card" style="max-width: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h3 style="margin: 0;">Nova Oportunidade de Venda</h3>
            <button type="button" class="button-ghost" onclick="document.getElementById('modal-new-deal').style.display='none'" style="font-size: 20px; cursor: pointer;">✕</button>
        </div>
        <form method="POST" action="<?php echo e(route('deals.store')); ?>">
            <?php echo csrf_field(); ?>
            <div class="field" style="margin-bottom: 14px;">
                <label for="deal_title">Título da Oportunidade</label>
                <input id="deal_title" name="title" type="text" placeholder="Ex: Vestido Festa + Acessórios" required>
            </div>

            <div class="form-grid" style="margin-bottom: 14px;">
                <div class="field">
                    <label for="deal_value">Valor Estimado (R$)</label>
                    <input id="deal_value" name="value" type="number" step="0.01" min="0" placeholder="0,00" required>
                </div>
                <div class="field">
                    <label for="deal_priority">Prioridade</label>
                    <select id="deal_priority" name="priority" required>
                        <option value="medium">Média</option>
                        <option value="high">Alta 🔥</option>
                        <option value="low">Baixa</option>
                    </select>
                </div>
            </div>

            <div class="form-grid" style="margin-bottom: 14px;">
                <div class="field">
                    <label for="deal_stage">Estágio Inicial</label>
                    <select id="deal_stage" name="stage" required>
                        <option value="lead">Novo Lead</option>
                        <option value="contacted">Contato Feito</option>
                        <option value="proposal">Proposta Enviada</option>
                        <option value="negotiation">Em Negociação</option>
                        <option value="won">Ganho / Fechado</option>
                    </select>
                </div>
                <div class="field">
                    <label for="deal_customer_id">Cliente Vinculado</label>
                    <select id="deal_customer_id" name="customer_id">
                        <option value="">-- Sem cliente vinculado --</option>
                        <?php $__currentLoopData = $customers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $c): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <option value="<?php echo e($c->id); ?>"><?php echo e($c->name); ?></option>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </select>
                </div>
            </div>

            <div class="field" style="margin-bottom: 18px;">
                <label for="deal_notes">Observações / Detalhes</label>
                <textarea id="deal_notes" name="notes" rows="3" placeholder="Informações de negociação, preferências do cliente..." style="width: 100%; border: 1px solid var(--line); border-radius: 9px; padding: 8px; font-family: inherit;"></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="button button-secondary" onclick="document.getElementById('modal-new-deal').style.display='none'">Cancelar</button>
                <button type="submit" class="button">Adicionar ao Funil</button>
            </div>
        </form>
    </div>
</div>

<script>
    let draggedDealId = null;

    function handleDragStart(e, dealId) {
        draggedDealId = dealId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dealId);
        setTimeout(() => {
            const el = document.getElementById('deal-' + dealId);
            if (el) el.style.opacity = '0.4';
        }, 0);
    }

    function handleDragEnd(e) {
        if (draggedDealId) {
            const el = document.getElementById('deal-' + draggedDealId);
            if (el) el.style.opacity = '1';
        }
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.style.background = '#f1f5f9';
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.style.background = '#e2e8f0';
    }

    function handleDragLeave(e) {
        e.currentTarget.style.background = '#f1f5f9';
    }

    function handleDrop(e, targetStage) {
        e.preventDefault();
        e.currentTarget.style.background = '#f1f5f9';
        const dealId = draggedDealId || e.dataTransfer.getData('text/plain');
        if (!dealId) return;

        // Submeter atualização via formulário invisível
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/funil/${dealId}/stage`;

        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = '_token';
        csrf.value = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        const method = document.createElement('input');
        method.type = 'hidden';
        method.name = '_method';
        method.value = 'PATCH';

        const stageInput = document.createElement('input');
        stageInput.type = 'hidden';
        stageInput.name = 'stage';
        stageInput.value = targetStage;

        form.appendChild(csrf);
        form.appendChild(method);
        form.appendChild(stageInput);
        document.body.appendChild(form);
        form.submit();
    }
</script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', ['title' => 'Funil de Vendas (Kanban) · Alira CRM'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\Isaias\Downloads\alira-crm-laravel-mvp\resources\views/deals/index.blade.php ENDPATH**/ ?>