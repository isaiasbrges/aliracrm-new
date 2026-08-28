<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;
        $search = $request->query('search');
        $paymentMethod = $request->query('payment_method');

        $query = Sale::query()
            ->with(['customer', 'seller', 'items.variant.product'])
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId);

        if ($paymentMethod) {
            $query->where('payment_method', $paymentMethod);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('whatsapp', 'like', "%{$search}%");
                  });
            });
        }

        $sales = $query->latest()->paginate(15)->withQueryString();

        $metrics = [
            'total_revenue' => (float) Sale::where('organization_id', $organizationId)->where('store_id', $storeId)->where('status', 'completed')->sum('total'),
            'total_sales' => (int) Sale::where('organization_id', $organizationId)->where('store_id', $storeId)->where('status', 'completed')->count(),
            'avg_ticket' => (float) (Sale::where('organization_id', $organizationId)->where('store_id', $storeId)->where('status', 'completed')->avg('total') ?? 0.0),
        ];

        return Inertia::render('Sales/Index', compact('sales', 'metrics', 'search', 'paymentMethod'));
    }

    public function exportCsv(Request $request)
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        $sales = Sale::query()
            ->with(['customer', 'seller', 'items.variant.product'])
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->latest()
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="vendas_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($sales) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF"); // BOM para compatibilidade com Excel
            fputcsv($file, ['Pedido', 'Data', 'Cliente', 'WhatsApp', 'Forma de Pagamento', 'Total (R$)', 'Status'], ';');

            foreach ($sales as $sale) {
                fputcsv($file, [
                    '#' . $sale->number,
                    $sale->created_at->format('d/m/Y H:i'),
                    $sale->customer?->name ?? 'Balcão',
                    $sale->customer?->whatsapp ?? '-',
                    strtoupper($sale->payment_method),
                    number_format((float) $sale->total, 2, ',', '.'),
                    $sale->status,
                ], ';');
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function create(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        $products = Product::query()
            ->with(['variants' => fn ($query) => $query->where('stock', '>', 0)])
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $customers = Customer::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->orderBy('name')
            ->get(['id', 'name', 'whatsapp']);

        $selectedCustomerId = $request->query('customer_id');

        return Inertia::render('Sales/Create', compact('products', 'customers', 'selectedCustomerId'));
    }

    public function show(Request $request, Sale $sale): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        if ($sale->organization_id !== $organizationId || $sale->store_id !== $storeId) {
            abort(403);
        }

        $sale->load(['customer', 'seller', 'items.variant.product']);

        return Inertia::render('Sales/Show', compact('sale'));
    }

    public function store(Request $request, SaleService $saleService): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'integer'],
            'payment_method' => ['required', 'in:cash,pix,debit,credit,other'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:9999'],
        ]);

        $sale = $saleService->create(
            user: $request->user(),
            store: $request->attributes->get('store'),
            customerId: isset($data['customer_id']) ? (int) $data['customer_id'] : null,
            paymentMethod: $data['payment_method'],
            items: $data['items'],
        );

        return redirect()->route('sales.show', $sale)->with('success', "Venda #{$sale->number} registrada com sucesso!");
    }
}
