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
            $store = Store::query()->where('slug', 'dyvinuss-looks')->first()
                ?? Store::query()->where('active', true)->first();
        }

        if (!$store) {
            abort(404, 'Loja não encontrada.');
        }

        $query = Product::query()
            ->with(['variants'])
            ->where('store_id', $store->id)
            ->where('status', 'active');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->input('category'));
        }

        $products = $query->orderBy('name')->get()->map(function ($p) {
            return [
                'id'       => $p->id,
                'name'     => $p->name,
                'sku'      => $p->sku,
                'price'    => (float) $p->price,
                'variants' => $p->variants->map(fn($v) => [
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
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Catalog/Public', [
            'store' => [
                'id'           => $store->id,
                'name'         => $store->name,
                'slug'         => $store->slug,
                'accent_color' => $store->accent_color ?? '#db2777',
                'logo_url'     => $store->logo_url,
                'whatsapp'     => $store->whatsapp ?? '5511999999999',
            ],
            'products'   => $products,
            'categories' => $categories,
            'filters'    => $request->only(['search', 'category']),
        ]);
    }
}
