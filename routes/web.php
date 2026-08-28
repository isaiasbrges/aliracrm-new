<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StoreSettingsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->middleware('throttle:login')->name('login.store');
});

Route::post('/logout', [AuthController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::get('/init-db', function () {
    Artisan::call('migrate --seed --force');
    return response('<h1>Banco de dados configurado com sucesso!</h1><p>Todas as tabelas e dados iniciais foram criados no PostgreSQL.</p><p><a href="/login">Clique aqui para ir para a tela de Login</a></p><p><strong>Login:</strong> demo@alira.local<br><strong>Senha:</strong> demo12345</p>', 200)->header('Content-Type', 'text/html; charset=utf-8');
});

Route::get('/clear-cache', function () {
    Artisan::call('optimize:clear');
    return 'Cache cleared! Refresh the main page now.';
});

Route::middleware(['auth', 'tenant'])->group(function (): void {
    Route::get('/', DashboardController::class)->name('dashboard');

    // Funil de Vendas (Kanban)
    Route::get('/funil', [DealController::class, 'index'])->name('deals.index');
    Route::post('/funil', [DealController::class, 'store'])->name('deals.store');
    Route::patch('/funil/{deal}/stage', [DealController::class, 'updateStage'])->name('deals.updateStage');
    Route::delete('/funil/{deal}', [DealController::class, 'destroy'])->name('deals.destroy');

    // Central de Atendimento WhatsApp (Omnichannel Inbox)
    Route::get('/atendimentos', [ConversationController::class, 'index'])->name('conversations.index');
    Route::post('/atendimentos/iniciar', [ConversationController::class, 'startWithCustomer'])->name('conversations.start');
    Route::post('/atendimentos/{conversation}/mensagens', [ConversationController::class, 'storeMessage'])->name('conversations.messages.store');
    Route::patch('/atendimentos/{conversation}/status', [ConversationController::class, 'updateStatus'])->name('conversations.status.update');

    // Clientes & Visão 360°
    Route::get('/clientes', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('/clientes', [CustomerController::class, 'store'])->name('customers.store');
    Route::post('/clientes/pdv', [CustomerController::class, 'storeFromPdv'])->name('customers.storeFromPdv');
    Route::get('/clientes/{customer}', [CustomerController::class, 'show'])->name('customers.show');

    // Produtos
    Route::get('/produtos', [ProductController::class, 'index'])->name('products.index');
    Route::post('/produtos', [ProductController::class, 'store'])->name('products.store');

    // Vendas / PDV
    Route::get('/vendas', [SaleController::class, 'index'])->name('sales.index');
    Route::get('/vendas/exportar', [SaleController::class, 'exportCsv'])->name('sales.export');
    Route::get('/vendas/nova', [SaleController::class, 'create'])->name('sales.create');
    Route::post('/vendas', [SaleController::class, 'store'])->name('sales.store');
    Route::get('/vendas/{sale}', [SaleController::class, 'show'])->name('sales.show');

    // Configurações da Loja
    Route::get('/configuracoes/loja', [StoreSettingsController::class, 'edit'])->name('settings.store');
    Route::post('/configuracoes/loja', [StoreSettingsController::class, 'update'])->name('settings.store.update');
});

Route::get('/debug-log', function () {
    $path = storage_path('logs/laravel.log');
    if (file_exists($path)) {
        return response(file_get_contents($path), 200)->header('Content-Type', 'text/plain');
    }
    return 'Log file not found.';
});
