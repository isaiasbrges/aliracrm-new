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

        // 1. Tentar localizar por domínio personalizado apontado (ex: loja.dyvinusslooks.com.br)
        $host = $request->getHost();
        if ($host && !in_array($host, ['localhost', '127.0.0.1', 'aliracrm.site', 'www.aliracrm.site'], true)) {
            $store = Store::query()
                ->where('custom_domain', $host)
                ->orWhere('custom_domain', preg_replace('/^www\./', '', $host))
                ->where('active', true)
                ->first();
        }

        // 2. Tentar localizar por slug da URL (/loja/{slug}/catalogo)
        if (!$store && $storeSlug) {
            $store = Store::query()->where('slug', $storeSlug)->where('active', true)->first();
        }

        // 3. Fallback para loja padrão ativa
        if (!$store) {
            $store = Store::query()->where('slug', 'dyvinus')->where('active', true)->first()
                ?? Store::query()->where('slug', 'dyvinuss-looks')->where('active', true)->first()
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
            'vestido xadrez gola redonda' => 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
            'corset shein' => 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80',
            'macacão gringo' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
            'cropped canelado' => 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
            'saia cirrê trançada' => 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80',
            'body canelado premium' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
            'shorts saia cirrê' => 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80',
            'tricô modal luxo' => 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
        ];

        $products = $query->get()->map(function (Product $p) use ($imageMap) {
            $lower = mb_strtolower(trim($p->name));
            $img = $p->image_url;

            if (empty($img)) {
                foreach ($imageMap as $k => $url) {
                    if (str_contains($lower, $k)) {
                        $img = $url;
                        break;
                    }
                }
            }

            if (empty($img)) {
                $img = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';
            }

            $currentPrice = (float) $p->price;
            $originalPrice = $p->original_price ? (float) $p->original_price : null;

            if (!$originalPrice && in_array($p->name, ['Calça cargo', 'Vestido xadrez', 'Vestido xadrez gola redonda', 'Corset Shein', 'Macacão gringo', 'Body Canelado Premium', 'Shorts Saia Cirrê', 'Tricô Modal Luxo'])) {
                $originalPrice = match ($p->name) {
                    'Calça cargo' => 129.90,
                    'Vestido xadrez' => 119.90,
                    'Vestido xadrez gola redonda' => 119.90,
                    'Corset Shein' => 89.90,
                    'Macacão gringo' => 149.90,
                    'Body Canelado Premium' => 79.90,
                    'Shorts Saia Cirrê' => 89.90,
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
                'id'                   => $store->id,
                'name'                 => $store->name,
                'slug'                 => $store->slug,
                'accent_color'         => $store->accent_color ?: '#ff007f',
                'logo_url'             => $store->logo_url,
                'custom_domain'        => $store->custom_domain,
                'custom_domain_status' => $store->custom_domain_status ?? 'pending',
                'whatsapp'             => $store->whatsapp ?? '5511999999999',
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
