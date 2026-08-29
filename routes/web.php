<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StoreSettingsController;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rotas de Autenticação Global & por Loja Específica
Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->middleware('throttle:login')->name('login.store');

    // Login Exclusivo de Filial / Loja com Identidade Visual Própria
    Route::get('/loja/{slug}/login', [AuthController::class, 'create'])->name('store.login');
    Route::post('/loja/{slug}/login', [AuthController::class, 'store'])->middleware('throttle:login')->name('store.login.store');
});

// Acesso Direto à Loja pelo Link: /loja/{slug}
Route::get('/loja/{slug}', function (Request $request, string $slug) {
    $store = Store::query()->where('slug', $slug)->where('active', true)->firstOrFail();

    if ($request->user()) {
        if ($store->organization_id === $request->user()->organization_id) {
            $request->user()->forceFill(['last_store_id' => $store->id])->saveQuietly();
            return redirect()->route('dashboard')->with('success', "Acessando a filial '{$store->name}'");
        }
    }

    return redirect()->route('store.login', ['slug' => $slug]);
})->name('store.direct');

Route::post('/logout', [AuthController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// Atalhos Master Multi-Store
Route::middleware(['auth', 'tenant'])->group(function (): void {
    Route::get('/admin', fn () => redirect()->route('settings.store'));
    Route::get('/multi-store', fn () => redirect()->route('settings.store'));
});

// Workspace Autenticado Multi-Tenant
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

    // Configurações & Gestão Multi-Lojas
    Route::get('/configuracoes/loja', [StoreSettingsController::class, 'edit'])->name('settings.store');
    Route::post('/configuracoes/loja', [StoreSettingsController::class, 'update'])->name('settings.store.update');
    Route::post('/lojas/nova', [StoreSettingsController::class, 'store'])->name('stores.store');
    Route::post('/lojas/{store}/alternar', [StoreSettingsController::class, 'switchStore'])->name('stores.switch');
});
