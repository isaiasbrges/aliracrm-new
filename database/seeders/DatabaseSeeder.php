<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Organization;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StoreCounter;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $organization = Organization::query()->updateOrCreate(
            ['slug' => 'dyvinus-org'],
            ['name' => 'Dyvinuss Looks', 'status' => 'active'],
        );

        // Loja Principal & Instância WhatsApp Evolution API (dyvinus)
        $storeDyvinus = Store::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'slug' => 'dyvinus'],
            [
                'name' => 'Dyvinuss Looks',
                'active' => true,
                'accent_color' => '#ff007f',
            ],
        );
        StoreCounter::query()->firstOrCreate(['store_id' => $storeDyvinus->id], ['last_number' => 100]);

        // Remover outras lojas anteriores
        Store::query()->where('id', '!=', $storeDyvinus->id)->delete();

        User::query()->updateOrCreate(
            ['email' => 'demo@alira.local'],
            [
                'organization_id' => $organization->id,
                'name' => 'Isaias Dyvinuss',
                'password' => 'demo12345',
                'role' => 'owner',
                'active' => true,
                'last_store_id' => $storeDyvinus->id,
            ],
        );

        // Categorias de Moda da Loja
        $categoryNames = [
            'Body', 'Saia', 'Cropped', 'Macacão', 'Calça', 'Vestido',
            'Conjunto', 'Body | Maiô', 'Biquíni', 'Shorts', 'Shorts saia',
            'Blusinha', 'T-shirt', 'Teddy', 'Tricô', 'Blusa moletom',
            'Camisa', 'Macaquinho', 'Tênis', 'Jaqueta',
        ];

        $categories = [];
        foreach ($categoryNames as $cName) {
            $categories[$cName] = Category::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'slug' => \Illuminate\Support\Str::slug($cName)],
                ['name' => $cName],
            );
        }

        // Looks do Catálogo no formato da referência
        $catalogProducts = [
            [
                'name' => 'Vestido musse',
                'sku' => 'VEST-MUSSE-01',
                'price' => 135.00,
                'category' => 'Vestido',
                'image' => 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Calça cargo',
                'sku' => 'CALCA-CARGO-02',
                'price' => 130.00,
                'category' => 'Calça',
                'image' => 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Conjunto xadrez rosa',
                'sku' => 'CONJ-XADREZ-03',
                'price' => 140.00,
                'category' => 'Conjunto',
                'image' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Vestido xadrez',
                'sku' => 'VEST-XADREZ-04',
                'price' => 45.00,
                'category' => 'Vestido',
                'image' => 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Vestido xadrez gola redonda',
                'sku' => 'VEST-XAD-GOLA-05',
                'price' => 45.00,
                'category' => 'Vestido',
                'image' => 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Corset Shein',
                'sku' => 'CORSET-SHEIN-06',
                'price' => 80.00,
                'category' => 'Cropped',
                'image' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Jaqueta couro fake',
                'sku' => 'JAQ-COURO-07',
                'price' => 80.00,
                'category' => 'Jaqueta',
                'image' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Macacão gringo',
                'sku' => 'MACA-GRINGO-08',
                'price' => 80.00,
                'category' => 'Macacão',
                'image' => 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Body Canelado Premium',
                'sku' => 'BODY-CANEL-09',
                'price' => 59.90,
                'category' => 'Body',
                'image' => 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Saia Alfaiataria Fenda',
                'sku' => 'SAIA-ALFA-10',
                'price' => 89.90,
                'category' => 'Saia',
                'image' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Shorts Saia Cirrê',
                'sku' => 'SHORTS-SAIA-11',
                'price' => 69.90,
                'category' => 'Shorts saia',
                'image' => 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Tricô Modal Luxo',
                'sku' => 'TRICO-MODAL-12',
                'price' => 99.90,
                'category' => 'Tricô',
                'image' => 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
            ],
        ];

        foreach ($catalogProducts as $prodData) {
            $cat = $categories[$prodData['category']] ?? null;

            $product = Product::query()->updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'sku' => $prodData['sku'],
                ],
                [
                    'store_id' => $storeDyvinus->id,
                    'category_id' => $cat?->id,
                    'name' => $prodData['name'],
                    'price' => $prodData['price'],
                    'status' => 'active',
                ],
            );

            // Variantes de Tamanho P, M, G, GG
            foreach (['P', 'M', 'G', 'GG'] as $size) {
                ProductVariant::query()->updateOrCreate(
                    [
                        'organization_id' => $organization->id,
                        'product_id' => $product->id,
                        'size' => $size,
                        'color' => 'Única',
                    ],
                    [
                        'sku' => "{$prodData['sku']}-{$size}",
                        'price' => $prodData['price'],
                        'stock' => 10,
                    ],
                );
            }
        }
    }
}
