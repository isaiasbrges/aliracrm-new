<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StoreCounter;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_uses_official_price_and_decrements_stock(): void
    {
        [$user, $store] = $this->makeTenant();
        $product = Product::create([
            'organization_id' => $user->organization_id,
            'store_id' => $store->id,
            'name' => 'Produto Teste',
            'sku' => 'TEST-001',
            'price' => 199.90,
            'status' => 'active',
        ]);
        $variant = ProductVariant::create([
            'organization_id' => $user->organization_id,
            'product_id' => $product->id,
            'sku' => 'TEST-001',
            'size' => 'M',
            'color' => 'Preto',
            'price' => 219.90,
            'stock' => 3,
        ]);

        $sale = app(SaleService::class)->create(
            user: $user,
            store: $store,
            customerId: null,
            paymentMethod: 'pix',
            items: [['variant_id' => $variant->id, 'quantity' => 2]],
        );

        $this->assertSame(1, $sale->number);
        $this->assertSame('219.90', (string) $sale->items->first()->unit_price);
        $this->assertSame('439.80', (string) $sale->total);
        $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'stock' => 1]);
        $this->assertDatabaseHas('store_counters', ['store_id' => $store->id, 'last_number' => 1]);
    }

    public function test_sale_rejects_insufficient_stock_without_creating_sale(): void
    {
        [$user, $store] = $this->makeTenant();
        $product = Product::create([
            'organization_id' => $user->organization_id,
            'store_id' => $store->id,
            'name' => 'Produto Escasso',
            'sku' => 'SC-001',
            'price' => 100,
            'status' => 'active',
        ]);
        $variant = ProductVariant::create([
            'organization_id' => $user->organization_id,
            'product_id' => $product->id,
            'sku' => 'SC-001',
            'size' => 'Único',
            'color' => 'Azul',
            'price' => 100,
            'stock' => 1,
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        try {
            app(SaleService::class)->create(
                user: $user,
                store: $store,
                customerId: null,
                paymentMethod: 'pix',
                items: [['variant_id' => $variant->id, 'quantity' => 2]],
            );
        } finally {
            $this->assertDatabaseCount('sales', 0);
            $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'stock' => 1]);
        }
    }

    /** @return array{0: User, 1: Store} */
    private function makeTenant(): array
    {
        $organization = Organization::create([
            'name' => 'Organização Teste',
            'slug' => 'org-'.uniqid(),
            'status' => 'active',
        ]);
        $store = Store::create([
            'organization_id' => $organization->id,
            'name' => 'Loja Teste',
            'slug' => 'loja-'.uniqid(),
            'active' => true,
            'accent_color' => '#d946ef',
        ]);
        StoreCounter::create(['store_id' => $store->id]);
        $user = User::factory()->create([
            'organization_id' => $organization->id,
            'role' => 'owner',
            'active' => true,
            'last_store_id' => $store->id,
        ]);

        return [$user, $store];
    }
}
