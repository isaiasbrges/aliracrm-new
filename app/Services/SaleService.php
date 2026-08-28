<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreCounter;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    /**
     * O cliente informa somente variante e quantidade. Preço e total são
     * sempre reidratados e calculados no servidor.
     *
     * @param array<int, array{variant_id:int, quantity:int}> $items
     */
    public function create(User $user, Store $store, ?int $customerId, string $paymentMethod, array $items): Sale
    {
        if ($user->organization_id !== $store->organization_id) {
            throw ValidationException::withMessages(['store' => 'Loja inválida para este usuário.']);
        }

        if (!$store->active) {
            throw ValidationException::withMessages(['store' => 'A loja está inativa.']);
        }

        $allowedPaymentMethods = ['cash', 'pix', 'debit', 'credit', 'other'];
        if (!in_array($paymentMethod, $allowedPaymentMethods, true)) {
            throw ValidationException::withMessages(['payment_method' => 'Forma de pagamento inválida.']);
        }

        if ($items === []) {
            throw ValidationException::withMessages(['items' => 'Adicione pelo menos um item.']);
        }

        $quantities = [];
        foreach ($items as $item) {
            $variantId = (int) ($item['variant_id'] ?? 0);
            $quantity = (int) ($item['quantity'] ?? 0);

            if ($variantId < 1 || $quantity < 1) {
                throw ValidationException::withMessages(['items' => 'Item ou quantidade inválida.']);
            }

            $quantities[$variantId] = ($quantities[$variantId] ?? 0) + $quantity;
        }

        return DB::transaction(function () use ($user, $store, $customerId, $paymentMethod, $quantities): Sale {
            $customer = null;
            if ($customerId !== null) {
                $customer = Customer::query()
                    ->whereKey($customerId)
                    ->where('organization_id', $user->organization_id)
                    ->where('store_id', $store->id)
                    ->first();

                if (!$customer) {
                    throw ValidationException::withMessages(['customer_id' => 'Cliente inválido para a loja ativa.']);
                }
            }

            $variants = ProductVariant::query()
                ->with('product:id,organization_id,store_id,name,status,price')
                ->whereIn('id', array_keys($quantities))
                ->where('organization_id', $user->organization_id)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($variants->count() !== count($quantities)) {
                throw ValidationException::withMessages(['items' => 'Um ou mais produtos não pertencem à organização.']);
            }

            $subtotalCents = 0;
            $preparedItems = [];

            foreach ($quantities as $variantId => $quantity) {
                /** @var ProductVariant|null $variant */
                $variant = $variants->get($variantId);
                $product = $variant?->product;

                if (!$variant || !$product || $product->organization_id !== $user->organization_id || $product->store_id !== $store->id || $product->status !== 'active') {
                    throw ValidationException::withMessages(['items' => 'Produto inválido para a loja ativa.']);
                }

                $priceCents = $this->toCents($variant->price ?? $product->price);
                if ($priceCents < 0) {
                    throw ValidationException::withMessages(['items' => 'Produto com preço inválido.']);
                }

                $updated = ProductVariant::query()
                    ->whereKey($variant->id)
                    ->where('stock', '>=', $quantity)
                    ->decrement('stock', $quantity);

                if ($updated !== 1) {
                    throw ValidationException::withMessages(['items' => "Estoque insuficiente para {$product->name}."]);
                }

                $lineTotalCents = $priceCents * $quantity;
                $subtotalCents += $lineTotalCents;
                $preparedItems[] = [
                    'variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'unit_price' => $this->fromCents($priceCents),
                    'discount' => '0.00',
                    'total' => $this->fromCents($lineTotalCents),
                ];
            }

            $counter = $this->counterFor($store->id);
            $counter->increment('last_number');
            $counter->refresh();

            $sale = Sale::create([
                'organization_id' => $user->organization_id,
                'store_id' => $store->id,
                'customer_id' => $customer?->id,
                'seller_id' => $user->id,
                'number' => $counter->last_number,
                'status' => 'completed',
                'subtotal' => $this->fromCents($subtotalCents),
                'discount' => '0.00',
                'total' => $this->fromCents($subtotalCents),
                'payment_method' => $paymentMethod,
                'completed_at' => now(),
            ]);

            foreach ($preparedItems as $item) {
                $sale->items()->create([
                    'organization_id' => $user->organization_id,
                    ...$item,
                ]);
            }

            if ($customer) {
                $customer->increment('total_spent', $this->fromCents($subtotalCents));
                $customer->increment('total_purchases');
                $customer->forceFill(['last_purchase_at' => now()])->saveQuietly();
            }

            return $sale->load(['items.variant.product', 'customer', 'seller']);
        }, 3);
    }

    private function counterFor(int $storeId): StoreCounter
    {
        try {
            StoreCounter::query()->firstOrCreate([
                'store_id' => $storeId,
            ], [
                'last_number' => 0,
            ]);
        } catch (QueryException $exception) {
            // Outra transação pode ter criado o contador; a unique key resolve a corrida.
            if (!str_contains(strtolower($exception->getMessage()), 'duplicate')) {
                throw $exception;
            }
        }

        return StoreCounter::query()->where('store_id', $storeId)->lockForUpdate()->firstOrFail();
    }

    private function toCents(mixed $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    private function fromCents(int $value): string
    {
        return number_format($value / 100, 2, '.', '');
    }
}
