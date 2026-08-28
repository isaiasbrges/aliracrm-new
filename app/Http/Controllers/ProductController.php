<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;
        $search = $request->query('search');

        $query = Product::query()
            ->with('variants:id,product_id,size,color,price,stock')
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->paginate(15)->withQueryString();

        $allVariants = ProductVariant::query()
            ->where('organization_id', $organizationId)
            ->get(['price', 'stock']);

        $totalStockUnits = (int) $allVariants->sum('stock');
        $totalStockValue = (float) $allVariants->sum(fn ($v) => (float) $v->price * $v->stock);
        $lowStockCount = (int) $allVariants->where('stock', '<=', 5)->count();

        $metrics = [
            'total_products' => Product::where('organization_id', $organizationId)->where('store_id', $storeId)->count(),
            'total_units' => $totalStockUnits,
            'total_value' => $totalStockValue,
            'low_stock' => $lowStockCount,
        ];

        return Inertia::render('Products/Index', compact('products', 'metrics', 'search'));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'sku' => ['required', 'string', 'max:80'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'size' => ['required', 'string', 'max:40'],
            'color' => ['required', 'string', 'max:80'],
            'stock' => ['required', 'integer', 'min:0', 'max:2147483647'],
        ]);

        $organizationId = $request->user()->organization_id;
        $sku = Str::upper(trim($data['sku']));

        if (Product::query()->where('organization_id', $organizationId)->where('sku', $sku)->exists()) {
            return back()->withErrors(['sku' => 'Este SKU já está cadastrado nesta organização.'])->withInput();
        }

        $product = Product::create([
            'organization_id' => $organizationId,
            'store_id' => $request->attributes->get('store')->id,
            'name' => $data['name'],
            'sku' => $sku,
            'price' => $data['price'],
            'status' => 'active',
        ]);

        ProductVariant::create([
            'organization_id' => $organizationId,
            'product_id' => $product->id,
            'sku' => $sku,
            'size' => $data['size'],
            'color' => $data['color'],
            'price' => $data['price'],
            'stock' => $data['stock'],
        ]);

        return redirect()->route('products.index')->with('success', 'Produto cadastrado com sucesso!');
    }
}
