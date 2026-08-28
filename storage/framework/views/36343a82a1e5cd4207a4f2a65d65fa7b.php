<?php $__env->startSection('content'); ?>
    <div class="page-heading">
        <div><h1>Clientes</h1><p class="lede">Conheça e atenda melhor a sua base.</p></div>
    </div>

    <section class="grid grid-2">
        <div class="card">
            <div class="section-header"><h2>Novo cliente</h2></div>
            <form method="POST" action="<?php echo e(route('customers.store')); ?>" class="form-grid">
                <?php echo csrf_field(); ?>
                <div class="field full"><label for="name">Nome completo</label><input id="name" name="name" value="<?php echo e(old('name')); ?>" required></div>
                <div class="field"><label for="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" value="<?php echo e(old('whatsapp')); ?>" placeholder="5511999999999" required></div>
                <div class="field"><label for="email">E-mail</label><input id="email" name="email" type="email" value="<?php echo e(old('email')); ?>"></div>
                <div class="field"><label for="city">Cidade</label><input id="city" name="city" value="<?php echo e(old('city')); ?>"></div>
                <div class="field"><label for="state">UF</label><input id="state" name="state" value="<?php echo e(old('state')); ?>" maxlength="2"></div>
                <label class="field full" style="align-items:flex-start; flex-direction:row; gap:8px;"><input name="whatsapp_consent" type="checkbox" value="1"> <span>Cliente autorizou contato por WhatsApp</span></label>
                <button class="button" type="submit">Cadastrar cliente</button>
            </form>
        </div>

        <div class="card">
            <div class="section-header"><h2>Base ativa</h2><span class="badge"><?php echo e($customers->total()); ?> clientes</span></div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Cliente</th><th>WhatsApp</th><th>Status</th></tr></thead>
                    <tbody>
                        <?php $__empty_1 = true; $__currentLoopData = $customers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $customer): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                            <tr><td><strong><?php echo e($customer->name); ?></strong><br><small><?php echo e($customer->email ?? 'Sem e-mail'); ?></small></td><td><?php echo e($customer->whatsapp); ?></td><td><span class="badge badge-success">Ativo</span></td></tr>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                            <tr><td colspan="3">Nenhum cliente cadastrado.</td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            <div style="margin-top:16px;"><?php echo e($customers->links()); ?></div>
        </div>
    </section>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', ['title' => 'Clientes · Alira CRM'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\Isaias\Downloads\alira-crm-laravel-mvp\resources\views/customers/index.blade.php ENDPATH**/ ?>