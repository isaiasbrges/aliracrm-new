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

// Catálogo Digital Público (Aberto para Clientes no WhatsApp / Instagram)
Route::get('/catalogo', [\App\Http\Controllers\PublicCatalogController::class, 'index'])->name('catalog.public.default');
Route::get('/loja/{slug}/catalogo', [\App\Http\Controllers\PublicCatalogController::class, 'index'])->name('catalog.public');
Route::post('/catalogo/pedido', [\App\Http\Controllers\PublicCatalogController::class, 'checkoutOrder'])->name('catalog.public.checkout');

Route::get('/loja/{slug}', function (Request $request, string $slug) {
    $store = Store::query()->where('slug', $slug)->where('active', true)->first()
        ?? Store::query()->where('active', true)->firstOrFail();

    if ($request->user()) {
        if ($store->organization_id === $request->user()->organization_id) {
            if ($request->user()->role === 'seller' && $request->user()->last_store_id && $request->user()->last_store_id !== $store->id) {
                abort(403, "Seu usuário está vinculado exclusivamente à filial designada.");
            }
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

// Rota Raiz Inteligente (Domínio Próprio da Loja → Catálogo Digital; Visitante → Login; Logado → Dashboard)
Route::get('/', function (Request $request) {
    $host = $request->getHost();
    $isCustomDomain = $host && !in_array($host, ['localhost', '127.0.0.1', 'aliracrm.site', 'www.aliracrm.site'], true);

    if ($isCustomDomain) {
        return app(\App\Http\Controllers\PublicCatalogController::class)->index($request);
    }

    if ($request->user()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('root');

// Workspace Autenticado Multi-Tenant
Route::middleware(['auth', 'tenant'])->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/painel', fn () => redirect()->route('dashboard'));

    // Funil de Vendas (Kanban)
    Route::get('/funil', [DealController::class, 'index'])->name('deals.index');
    Route::post('/funil', [DealController::class, 'store'])->name('deals.store');
    Route::patch('/funil/{deal}/stage', [DealController::class, 'updateStage'])->name('deals.updateStage');
    Route::delete('/funil/{deal}', [DealController::class, 'destroy'])->name('deals.destroy');
    Route::post('/funil/{deal}/disparar', [DealController::class, 'sendWhatsApp'])->name('deals.sendWhatsApp');
    Route::post('/funil/disparo-massa', [DealController::class, 'bulkSendWhatsApp'])->name('deals.bulkSendWhatsApp');
    Route::post('/funil/disparo-reativacao/{customer}', [DealController::class, 'sendReactivationWhatsApp'])->name('deals.sendReactivationWhatsApp');

    // Central de Atendimento WhatsApp (Omnichannel Inbox)
    Route::get('/atendimentos', [ConversationController::class, 'index'])->name('conversations.index');
    Route::post('/atendimentos/iniciar', [ConversationController::class, 'startWithCustomer'])->name('conversations.start');
    Route::post('/atendimentos/{conversation}/mensagens', [ConversationController::class, 'storeMessage'])->name('conversations.messages.store');
    Route::post('/atendimentos/{conversation}/interativo', [ConversationController::class, 'sendInteractive'])->name('conversations.interactive.store');
    Route::patch('/atendimentos/{conversation}/status', [ConversationController::class, 'updateStatus'])->name('conversations.status.update');
    Route::get('/api/whatsapp/status', [WhatsAppStatusController::class, 'getStatus'])->name('whatsapp.status');
    Route::get('/api/whatsapp/qrcode', [WhatsAppStatusController::class, 'getQrCode'])->name('whatsapp.qrcode');

    // Clientes & Visão 360°
    Route::get('/clientes', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('/clientes', [CustomerController::class, 'store'])->name('customers.store');
    Route::post('/clientes/pdv', [CustomerController::class, 'storeFromPdv'])->name('customers.storeFromPdv');
    Route::get('/clientes/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::post('/clientes/{customer}/aniversario', [CustomerController::class, 'sendBirthdayGift'])->name('customers.sendBirthdayGift');

    // Gestor do Catálogo Online & Personalização Visual (Logo e Cores)
    Route::get('/catalogo/gerenciar', [\App\Http\Controllers\CatalogManagerController::class, 'index'])->name('catalog.manager.index');
    Route::post('/catalogo/produtos', [\App\Http\Controllers\CatalogManagerController::class, 'storeProduct'])->name('catalog.manager.products.store');
    Route::put('/catalogo/produtos/{product}', [\App\Http\Controllers\CatalogManagerController::class, 'updateProduct'])->name('catalog.manager.products.update');
    Route::delete('/catalogo/produtos/{product}', [\App\Http\Controllers\CatalogManagerController::class, 'destroyProduct'])->name('catalog.manager.products.destroy');
    Route::post('/catalogo/categorias', [\App\Http\Controllers\CatalogManagerController::class, 'storeCategory'])->name('catalog.manager.categories.store');
    Route::delete('/catalogo/categorias/{category}', [\App\Http\Controllers\CatalogManagerController::class, 'destroyCategory'])->name('catalog.manager.categories.destroy');
    Route::post('/catalogo/branding', [\App\Http\Controllers\CatalogManagerController::class, 'updateBranding'])->name('catalog.manager.branding.update');
    Route::post('/catalogo/dominio', [\App\Http\Controllers\CatalogManagerController::class, 'updateCustomDomain'])->name('catalog.manager.domain.update');
    Route::post('/catalogo/dominio/verificar', [\App\Http\Controllers\CatalogManagerController::class, 'verifyCustomDomain'])->name('catalog.manager.domain.verify');

    // Produtos & Estoque
    Route::get('/produtos', [ProductController::class, 'index'])->name('products.index');
    Route::post('/produtos', [ProductController::class, 'store'])->name('products.store');

    // Vendas / PDV
    Route::get('/vendas', [SaleController::class, 'index'])->name('sales.index');
    Route::get('/vendas/exportar', [SaleController::class, 'exportCsv'])->name('sales.export');
    Route::get('/vendas/nova', [SaleController::class, 'create'])->name('sales.create');
    Route::post('/vendas', [SaleController::class, 'store'])->name('sales.store');
    Route::get('/vendas/{sale}', [SaleController::class, 'show'])->name('sales.show');
    Route::post('/vendas/{sale}/comprovante', [SaleController::class, 'sendReceipt'])->name('sales.sendReceipt');
    Route::post('/vendas/{sale}/rastreio', [SaleController::class, 'sendTracking'])->name('sales.sendTracking');

    // Configurações & Gestão Multi-Lojas
    Route::get('/configuracoes/loja', [StoreSettingsController::class, 'edit'])->name('settings.store');
    Route::post('/configuracoes/loja', [StoreSettingsController::class, 'update'])->name('settings.store.update');
    Route::post('/configuracoes/loja/test-webhook', [StoreSettingsController::class, 'testWebhook'])->name('settings.store.testWebhook');
    Route::post('/lojas/nova', [StoreSettingsController::class, 'store'])->name('stores.store');
    Route::post('/lojas/{store}/alternar', [StoreSettingsController::class, 'switchStore'])->name('stores.switch');
});
