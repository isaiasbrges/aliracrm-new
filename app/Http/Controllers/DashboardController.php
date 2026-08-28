<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        $completedSalesQuery = Sale::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->where('status', 'completed');

        $totalRevenue = (float) (clone $completedSalesQuery)->sum('total');
        $salesCount = (clone $completedSalesQuery)->count();
        $avgTicket = $salesCount > 0 ? round($totalRevenue / $salesCount, 2) : 0.0;

        $metrics = [
            'revenue' => $totalRevenue,
            'sales_count' => $salesCount,
            'avg_ticket' => $avgTicket,
            'customers_count' => Customer::where('organization_id', $organizationId)->where('store_id', $storeId)->count(),
            'products_count' => Product::where('organization_id', $organizationId)->where('store_id', $storeId)->where('status', 'active')->count(),
            'open_conversations' => Conversation::where('organization_id', $organizationId)->where('store_id', $storeId)->where('status', 'open')->count(),
            'pipeline_value' => Deal::where('organization_id', $organizationId)->where('store_id', $storeId)->where('stage', '!=', 'lost')->sum('value'),
        ];

        // Gráfico de vendas dos últimos 7 dias
        $chartDays = [];
        $maxChartValue = 1;
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayLabel = $date->translatedFormat('D, d/m');
            $dayRevenue = (float) Sale::query()
                ->where('organization_id', $organizationId)
                ->where('store_id', $storeId)
                ->where('status', 'completed')
                ->whereDate('created_at', $date->toDateString())
                ->sum('total');

            if ($dayRevenue > $maxChartValue) {
                $maxChartValue = $dayRevenue;
            }

            $chartDays[] = [
                'day' => $date->format('d/m'),
                'label' => $dayLabel,
                'revenue' => $dayRevenue,
            ];
        }

        // Top produtos mais vendidos
        $topProducts = SaleItem::query()
            ->join('product_variants', 'sale_items.variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->where('sale_items.organization_id', $organizationId)
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_qty'), DB::raw('SUM(sale_items.total) as total_sales'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // Vendas recentes
        $recentSales = Sale::query()
            ->with(['customer:id,name,whatsapp', 'seller:id,name'])
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->latest()
            ->limit(6)
            ->get();

        // Conversas recentes
        $recentConversations = Conversation::query()
            ->with('customer:id,name,whatsapp')
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->latest('last_message_at')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard/Index', compact(
            'metrics',
            'chartDays',
            'maxChartValue',
            'topProducts',
            'recentSales',
            'recentConversations'
        ));
    }
}
