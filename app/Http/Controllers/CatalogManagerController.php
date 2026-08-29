<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CatalogManagerController extends Controller
{
    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');

        $products = Product::query()
            ->with(['variants', 'category'])
            ->where('organization_id', $organizationId)
            ->where('store_id', $store->id)
            ->latest('id')
            ->get()
            ->map(fn ($p) => [
                'id'             => $p->id,
                'name'           => $p->name,
                'sku'            => $p->sku,
                'category_id'    => $p->category_id,
                'category_name'  => $p->category?->name,
                'price'          => (float) $p->price,
                'original_price' => $p->original_price ? (float) $p->original_price : null,
                'image_url'      => $p->image_url,
                'status'         => $p->status,
                'variants'       => $p->variants->map(fn ($v) => [
                    'id'    => $v->id,
                    'size'  => $v->size,
                    'color' => $v->color,
                    'price' => (float) ($v->price ?: $p->price),
                    'stock' => (int) $v->stock,
                ]),
            ]);

        $categories = Category::query()
            ->where('organization_id', $organizationId)
            ->withCount(['products' => function ($q) use ($store) {
                $q->where('store_id', $store->id);
            }])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Catalog/Manager', [
            'store' => [
                'id'           => $store->id,
                'name'         => $store->name,
                'slug'         => $store->slug,
                'accent_color' => $store->accent_color ?? '#ff007f',
                'logo_url'     => $store->logo_url,
                'whatsapp'     => $store->whatsapp ?? '5511999999999',
            ],
            'products'   => $products,
            'categories' => $categories,
            'live_url'   => url('/catalogo'),
        ]);
    }

    public function storeProduct(Request $request): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');

        $data = $request->validate([
            'name'           => ['required', 'string', 'max:190'],
            'category_id'    => ['nullable', 'exists:categories,id'],
            'price'          => ['required', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'image_url'      => ['nullable', 'string', 'max:1000'],
            'image'          => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:3072'],
            'sizes'          => ['nullable', 'array'],
            'stock'          => ['nullable', 'integer', 'min:0'],
        ]);

        $imageUrl = $data['image_url'] ?? null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store("products/{$store->id}", 'public');
            $imageUrl = Storage::disk('public')->url($path);
        }

        $sku = 'LOOK-' . Str::upper(Str::random(6));

        $product = Product::create([
            'organization_id' => $organizationId,
            'store_id'        => $store->id,
            'category_id'     => $data['category_id'] ?? null,
            'name'            => $data['name'],
            'sku'             => $sku,
            'price'           => $data['price'],
            'original_price'  => $data['original_price'] ?? null,
            'image_url'       => $imageUrl,
            'status'          => 'active',
        ]);

        $sizes = $data['sizes'] ?? ['P', 'M', 'G', 'GG'];
        $initialStock = (int) ($data['stock'] ?? 10);

        foreach ($sizes as $size) {
            ProductVariant::create([
                'organization_id' => $organizationId,
                'product_id'      => $product->id,
                'sku'             => "{$sku}-{$size}",
                'size'            => $size,
                'color'           => 'Única',
                'price'           => $data['price'],
                'stock'           => $initialStock,
            ]);
        }

        return redirect()->route('catalog.manager.index')->with('success', "Look '{$product->name}' adicionado ao catálogo com sucesso!");
    }

    public function updateProduct(Request $request, Product $product): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');

        if ($product->organization_id !== $organizationId || $product->store_id !== $store->id) {
            abort(403);
        }

        $data = $request->validate([
            'name'           => ['required', 'string', 'max:190'],
            'category_id'    => ['nullable', 'exists:categories,id'],
            'price'          => ['required', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'image_url'      => ['nullable', 'string', 'max:1000'],
            'image'          => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:3072'],
            'status'         => ['required', 'in:active,inactive'],
        ]);

        $imageUrl = $data['image_url'] ?? $product->image_url;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store("products/{$store->id}", 'public');
            $imageUrl = Storage::disk('public')->url($path);
        }

        $product->update([
            'name'           => $data['name'],
            'category_id'    => $data['category_id'] ?? null,
            'price'          => $data['price'],
            'original_price' => $data['original_price'] ?? null,
            'image_url'      => $imageUrl,
            'status'         => $data['status'],
        ]);

        return redirect()->route('catalog.manager.index')->with('success', "Look '{$product->name}' atualizado com sucesso!");
    }

    public function destroyProduct(Request $request, Product $product): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');

        if ($product->organization_id !== $organizationId || $product->store_id !== $store->id) {
            abort(403);
        }

        $name = $product->name;
        $product->delete();

        return redirect()->route('catalog.manager.index')->with('success', "Look '{$name}' removido do catálogo.");
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $slug = Str::slug($data['name']);

        Category::firstOrCreate(
            ['organization_id' => $organizationId, 'slug' => $slug],
            ['name' => $data['name']]
        );

        return redirect()->route('catalog.manager.index')->with('success', "Categoria '{$data['name']}' adicionada!");
    }

    public function destroyCategory(Request $request, Category $category): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;

        if ($category->organization_id !== $organizationId) {
            abort(403);
        }

        $name = $category->name;
        $category->delete();

        return redirect()->route('catalog.manager.index')->with('success', "Categoria '{$name}' removida.");
    }

    public function updateBranding(Request $request): RedirectResponse
    {
        $store = $request->attributes->get('store');

        $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'accent_color' => ['nullable', 'string', 'max:30'],
            'logo'         => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'logo_url'     => ['nullable', 'string', 'max:1000'],
        ]);

        $rawColor = trim((string) $request->input('accent_color', '#ff007f'));
        if (!empty($rawColor) && !str_starts_with($rawColor, '#')) {
            $rawColor = '#' . $rawColor;
        }
        if (!preg_match('/^#[0-9a-fA-F]{3,8}$/', $rawColor)) {
            $rawColor = '#ff007f';
        }

        $data = [
            'name'         => $request->input('name', $store->name),
            'accent_color' => $rawColor,
        ];

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store("logos/{$store->id}", 'public');
            $data['logo_url'] = Storage::disk('public')->url($path);
        } elseif ($request->filled('logo_url')) {
            $data['logo_url'] = $request->input('logo_url');
        }

        if ($request->boolean('remove_logo')) {
            $data['logo_url'] = null;
        }

        $store->update($data);

        return redirect()->route('catalog.manager.index')->with('success', 'Logo e cores da loja atualizados com sucesso!');
    }
}
