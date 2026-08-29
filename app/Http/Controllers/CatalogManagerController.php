<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
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

        $serverHost = parse_url(config('app.url') ?: 'https://aliracrm.site', PHP_URL_HOST) ?: 'aliracrm.site';
        $serverIp = @gethostbyname($serverHost) ?: '185.173.111.45';

        return Inertia::render('Catalog/Manager', [
            'store' => [
                'id'                   => $store->id,
                'name'                 => $store->name,
                'slug'                 => $store->slug,
                'accent_color'         => $store->accent_color ?? '#ff007f',
                'logo_url'             => $store->logo_url,
                'custom_domain'        => $store->custom_domain,
                'custom_domain_status' => $store->custom_domain_status ?? 'pending',
                'whatsapp'             => $store->whatsapp ?? '5511999999999',
            ],
            'products'   => $products,
            'categories' => $categories,
            'live_url'   => url('/catalogo'),
            'dns_info'   => [
                'server_ip'   => $serverIp,
                'server_host' => $serverHost,
            ],
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
            $file = $request->file('image');
            $filename = 'product_' . $store->id . '_' . time() . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
            $dest = public_path('uploads/products');
            if (!file_exists($dest)) {
                @mkdir($dest, 0777, true);
            }
            $file->move($dest, $filename);
            $imageUrl = '/uploads/products/' . $filename;
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
            $file = $request->file('image');
            $filename = 'product_' . $store->id . '_' . time() . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
            $dest = public_path('uploads/products');
            if (!file_exists($dest)) {
                @mkdir($dest, 0777, true);
            }
            $file->move($dest, $filename);
            $imageUrl = '/uploads/products/' . $filename;
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

        Category::create([
            'organization_id' => $organizationId,
            'name'            => $data['name'],
            'slug'            => Str::slug($data['name']) . '-' . Str::random(4),
            'active'          => true,
        ]);

        return redirect()->route('catalog.manager.index')->with('success', "Categoria '{$data['name']}' criada com sucesso!");
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

        $logoUrl = $store->logo_url;

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $filename = 'logo_' . $store->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/logos');
            if (!file_exists($destinationPath)) {
                @mkdir($destinationPath, 0777, true);
            }
            try {
                $file->move($destinationPath, $filename);
                $logoUrl = '/uploads/logos/' . $filename;
            } catch (\Throwable $e) {
                try {
                    $path = $file->storeAs('logos', $filename, 'public');
                    $logoUrl = '/storage/' . $path;
                } catch (\Throwable $e2) {
                    \Illuminate\Support\Facades\Log::error("Erro ao fazer upload da logo: " . $e2->getMessage());
                }
            }
        } elseif ($request->filled('logo_url')) {
            $logoUrl = $request->input('logo_url');
        }

        if ($request->boolean('remove_logo')) {
            $logoUrl = null;
        }

        $store->name = $data['name'];
        $store->accent_color = $data['accent_color'];
        $store->logo_url = $logoUrl;
        $store->save();

        return redirect()->route('catalog.manager.index')->with('success', 'Logo e cores da loja atualizados com sucesso!');
    }

    public function updateCustomDomain(Request $request): RedirectResponse
    {
        $store = $request->attributes->get('store');

        $data = $request->validate([
            'custom_domain' => ['nullable', 'string', 'max:190'],
        ]);

        $domain = trim(strtolower((string) ($data['custom_domain'] ?? '')));
        $domain = preg_replace('#^https?://#', '', $domain);
        $domain = rtrim($domain, '/');

        $store->custom_domain = !empty($domain) ? $domain : null;
        $store->custom_domain_status = !empty($domain) ? 'pending' : 'none';
        $store->save();

        return redirect()->route('catalog.manager.index')
            ->with('success', 'Domínio personalizado salvo com sucesso! Configure os registros DNS conforme o tutorial abaixo.');
    }

    public function verifyCustomDomain(Request $request): JsonResponse
    {
        $store = $request->attributes->get('store');
        $domain = $store->custom_domain;

        if (empty($domain)) {
            return response()->json([
                'success' => false,
                'message' => 'Nenhum domínio configurado para verificar.',
            ]);
        }

        $records = @dns_get_record($domain, DNS_A + DNS_CNAME);
        $ip = @gethostbyname($domain);

        $serverHost = parse_url(config('app.url') ?: 'https://aliracrm.site', PHP_URL_HOST) ?: 'aliracrm.site';
        $serverIp = @gethostbyname($serverHost) ?: '185.173.111.45';

        $isPointing = ($ip === $serverIp) || ($ip !== $domain && !empty($ip));

        if ($isPointing) {
            $store->custom_domain_status = 'active';
            $store->save();
        }

        return response()->json([
            'success'     => $isPointing,
            'status'      => $isPointing ? 'active' : 'pending',
            'domain'      => $domain,
            'resolved_ip' => $ip,
            'server_ip'   => $serverIp,
            'records'     => $records ?: [],
            'message'     => $isPointing
                ? "🟢 Domínio {$domain} apontado com sucesso para o servidor!"
                : "🟡 O domínio {$domain} ainda não foi propagado ou não está apontando para o servidor.",
        ]);
    }
}
