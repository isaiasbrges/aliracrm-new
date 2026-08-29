<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicCatalogController extends Controller
{
    public function index(Request $request, ?string $storeSlug = null): Response
    {
        $store = null;
        if ($storeSlug) {
            $store = Store::query()->where('slug', $storeSlug)->where('active', true)->first();
        }
        if (!$store) {
            $store = Store::query()->where('slug', 'dyvinus')->first()
                ?? Store::query()->where('slug', 'dyvinuss-looks')->first()
                ?? Store::query()->where('active', true)->first();
        }

        if (!$store) {
            abort(404, 'Loja não encontrada.');
        }

        $query = Product::query()
            ->with(['variants', 'category'])
            ->where('store_id', $store->id)
            ->where('status', 'active');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where('name', 'ilike', "%{$search}%");
        }

        if ($request->filled('category')) {
            $catId = $request->input('category');
            if (is_numeric($catId)) {
                $query->where('category_id', $catId);
            } else {
                $query->whereHas('category', function ($cq) use ($catId) {
                    $cq->where('name', 'ilike', $catId)->orWhere('slug', $catId);
                });
            }
        }

        // Ordenação
        $sort = $request->input('sort', 'default');
        match ($sort) {
            'lowest_price' => $query->orderBy('price', 'asc'),
            'highest_price' => $query->orderBy('price', 'desc'),
            'newest' => $query->latest('id'),
            default => $query->orderBy('id', 'asc'),
        };

        // Imagens de alta fidelidade para o catálogo de moda
        $imageMap = [
            'vestido musse' => 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
            'calça cargo' => 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
            'conjunto xadrez rosa' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
            'vestido xadrez' => 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
            'vestido xadrez gola redonda' => 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&auto=format&fit=crop&q=80',
            'corset shein' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
            'jaqueta couro fake' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
            'macacão gringo' => 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&auto=format&fit=crop&q=80',
            'body' => 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80',
            'saia' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
            'shorts' => 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80',
            'tricô' => 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
        ];

        $products = $query->get()->map(function ($p) use ($imageMap) {
            $nameLower = mb_strtolower($p->name);
            $img = null;
            foreach ($imageMap as $key => $url) {
                if (str_contains($nameLower, $key)) {
                    $img = $url;
                    break;
                }
            }
            if (!$img) {
                $img = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';
            }

            $currentPrice = (float) $p->price;
            // Preço anterior riscado se for produto em promoção
            $originalPrice = null;
            if (in_array($p->name, ['Calça cargo', 'Vestido xadrez', 'Vestido xadrez gola redonda', 'Corset Shein', 'Macacão gringo', 'Body Canelado Premium', 'Shorts Saia Cirrê', 'Tricô Modal Luxo'])) {
                $originalPrice = match ($p->name) {
                    'Calça cargo' => 150.00,
                    'Vestido xadrez', 'Vestido xadrez gola redonda' => 65.00,
                    'Corset Shein' => 95.00,
                    'Macacão gringo' => 140.00,
                    'Body Canelado Premium' => 79.90,
                    'Shorts Saia Cirrê' => 85.00,
                    'Tricô Modal Luxo' => 120.00,
                    default => round($currentPrice * 1.25, 2),
                };
            }

            return [
                'id'             => $p->id,
                'name'           => $p->name,
                'sku'            => $p->sku,
                'category_id'    => $p->category_id,
                'category_name'  => $p->category?->name,
                'price'          => $currentPrice,
                'original_price' => $originalPrice,
                'image_url'      => $img,
                'variants'       => $p->variants->map(fn($v) => [
                    'id'    => $v->id,
                    'size'  => $v->size,
                    'color' => $v->color,
                    'price' => (float) ($v->price ?: $p->price),
                    'stock' => (int) $v->stock,
                ]),
            ];
        });

        $categories = Category::query()
            ->where('organization_id', $store->organization_id)
            ->withCount(['products' => function ($q) use ($store) {
                $q->where('store_id', $store->id)->where('status', 'active');
            }])
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Catalog/Public', [
            'store' => [
                'id'           => $store->id,
                'name'         => $store->name,
                'slug'         => $store->slug,
                'accent_color' => '#ff007f', // Pink vibrante conforme a referência
                'logo_url'     => $store->logo_url,
                'whatsapp'     => $store->whatsapp ?? '5511999999999',
            ],
            'products'   => $products,
            'categories' => $categories,
            'filters'    => [
                'search'   => $request->input('search', ''),
                'category' => $request->input('category', ''),
                'sort'     => $sort,
            ],
        ]);
    }
}
