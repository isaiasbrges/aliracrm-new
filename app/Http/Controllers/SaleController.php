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

    public function store(Request $request, SaleService $saleService, \App\Services\EvolutionService $evolutionService): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'integer'],
            'payment_method' => ['required', 'in:cash,pix,debit,credit,other'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:9999'],
        ]);

        $store = $request->attributes->get('store');
        $organizationId = $request->user()->organization_id;

        $sale = $saleService->create(
            user: $request->user(),
            store: $store,
            customerId: isset($data['customer_id']) ? (int) $data['customer_id'] : null,
            paymentMethod: $data['payment_method'],
            items: $data['items'],
        );

        // Disparo Automático de Comprovante de Venda no WhatsApp
        if ($sale->customer && $sale->customer->whatsapp) {
            try {
                $paymentLabels = [
                    'pix' => 'PIX',
                    'credit' => 'Cartão de Crédito',
                    'debit' => 'Cartão de Débito',
                    'cash' => 'Dinheiro',
                    'other' => 'Outro',
                ];

                $firstName = explode(' ', trim($sale->customer->name))[0];
                $methodLabel = $paymentLabels[$sale->payment_method] ?? strtoupper($sale->payment_method);
                $formattedTotal = 'R$ ' . number_format((float) $sale->total, 2, ',', '.');

                $itemsText = '';
                foreach ($sale->items as $item) {
                    $prodName = $item->variant?->product?->name ?? 'Look';
                    $variantInfo = "({$item->variant?->size}/{$item->variant?->color})";
                    $itemTotal = 'R$ ' . number_format((float) $item->total, 2, ',', '.');
                    $itemsText .= "• {$item->quantity}x {$prodName} {$variantInfo} - {$itemTotal}\n";
                }

                $messageText = "✨ *Pedido Confirmado - {$store->name}* ✨\n\n"
                    . "Olá, {$firstName}! Muito obrigado pela sua compra! 💖\n\n"
                    . "🧾 *Pedido #{$sale->number}*\n"
                    . "🛍️ *Peças Selecionadas:*\n{$itemsText}\n"
                    . "💰 *Valor Total:* {$formattedTotal}\n"
                    . "💳 *Forma de Pagamento:* {$methodLabel}\n\n"
                    . "Já estamos preparando seu pacote com muito carinho! Qualquer dúvida, basta nos responder por aqui! ✨";

                $instanceName = $store->slug ?? 'dyvinus';
                $evoResult = $evolutionService->sendMessage($instanceName, $sale->customer->whatsapp, $messageText);

                // Gravar na conversa do CRM
                $conversation = \App\Models\Conversation::firstOrCreate(
                    [
                        'organization_id' => $organizationId,
                        'store_id' => $store->id,
                        'channel' => 'whatsapp',
                        'external_chat_id' => $sale->customer->whatsapp,
                    ],
                    [
                        'customer_id' => $sale->customer->id,
                        'status' => 'open',
                        'priority' => 'normal',
                        'subject' => 'Atendimento com ' . $sale->customer->name,
                        'last_message_preview' => "Comprovante Pedido #{$sale->number}",
                        'last_message_at' => now(),
                    ]
                );

                \App\Models\Message::create([
                    'organization_id' => $organizationId,
                    'conversation_id' => $conversation->id,
                    'direction' => 'outbound',
                    'type' => 'text',
                    'body' => $messageText,
                    'status' => ($evoResult['success'] ?? false) ? 'delivered' : 'sent',
                    'from_phone' => 'store',
                    'to_phone' => $sale->customer->whatsapp,
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Erro ao disparar WhatsApp pós-venda: " . $e->getMessage());
            }
        }

        // Disparo Opcional para Webhook de PDV Externo se configurado e habilitado
        if ($store->external_pos_webhook_enabled && $store->external_pos_webhook_url) {
            try {
                $posPayload = [
                    'event' => 'pos.sale.created',
                    'timestamp' => now()->toISOString(),
                    'store' => [
                        'id' => $store->id,
                        'name' => $store->name,
                        'slug' => $store->slug,
                    ],
                    'sale' => [
                        'id' => $sale->id,
                        'number' => $sale->number,
                        'total' => (float) $sale->total,
                        'payment_method' => $sale->payment_method,
                        'customer' => $sale->customer ? [
                            'name' => $sale->customer->name,
                            'whatsapp' => $sale->customer->whatsapp,
                        ] : null,
                        'items' => $sale->items->map(fn($it) => [
                            'sku' => $it->variant?->sku,
                            'name' => $it->variant?->product?->name,
                            'size' => $it->variant?->size,
                            'color' => $it->variant?->color,
                            'quantity' => (int) $it->quantity,
                            'unit_price' => (float) $it->unit_price,
                            'total' => (float) $it->total,
                        ]),
                        'created_at' => $sale->created_at->toISOString(),
                    ],
                ];

                $req = \Illuminate\Support\Facades\Http::timeout(5);
                if ($store->external_pos_webhook_secret) {
                    $req->withHeaders([
                        'Authorization' => 'Bearer ' . $store->external_pos_webhook_secret,
                        'X-Webhook-Secret' => $store->external_pos_webhook_secret,
                        'X-Alira-Event' => 'pos.sale.created',
                    ]);
                }
                $req->post($store->external_pos_webhook_url, $posPayload);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Erro ao sincronizar venda com PDV externo: " . $e->getMessage());
            }
        }

        return redirect()->route('sales.show', $sale)->with('success', "Venda #{$sale->number} registrada com sucesso!");
    }

    public function sendReceipt(Request $request, Sale $sale, \App\Services\EvolutionService $evolutionService): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');

        if ($sale->organization_id !== $organizationId || $sale->store_id !== $store->id) {
            abort(403);
        }

        if (!$sale->customer || !$sale->customer->whatsapp) {
            return back()->with('error', 'Esta venda não possui cliente com WhatsApp vinculado.');
        }

        $sale->load(['items.variant.product', 'customer']);
        $firstName = explode(' ', trim($sale->customer->name))[0];
        $formattedTotal = 'R$ ' . number_format((float) $sale->total, 2, ',', '.');

        $itemsText = '';
        foreach ($sale->items as $item) {
            $prodName = $item->variant?->product?->name ?? 'Look';
            $variantInfo = "({$item->variant?->size}/{$item->variant?->color})";
            $itemTotal = 'R$ ' . number_format((float) $item->total, 2, ',', '.');
            $itemsText .= "• {$item->quantity}x {$prodName} {$variantInfo} - {$itemTotal}\n";
        }

        $messageText = "✨ *Comprovante de Compra - {$store->name}* ✨\n\n"
            . "Olá, {$firstName}! Segue o comprovante do seu pedido na Dyvinuss Looks:\n\n"
            . "🧾 *Pedido #{$sale->number}*\n"
            . "🛍️ *Itens:*\n{$itemsText}\n"
            . "💰 *Total:* {$formattedTotal}\n\n"
            . "Obrigado pela preferência e carinho! 💖";

        $instanceName = $store->slug ?? 'dyvinus';
        $evolutionService->sendMessage($instanceName, $sale->customer->whatsapp, $messageText);

        return back()->with('success', "Comprovante enviado com sucesso no WhatsApp de {$sale->customer->name}!");
    }

    public function sendTracking(Request $request, Sale $sale, \App\Services\EvolutionService $evolutionService): RedirectResponse
    {
        $data = $request->validate([
            'tracking_code' => ['required', 'string', 'max:100'],
            'carrier' => ['nullable', 'string', 'max:100'],
        ]);

        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');

        if ($sale->organization_id !== $organizationId || $sale->store_id !== $store->id) {
            abort(403);
        }

        if (!$sale->customer || !$sale->customer->whatsapp) {
            return back()->with('error', 'Esta venda não possui cliente com WhatsApp vinculado.');
        }

        $firstName = explode(' ', trim($sale->customer->name))[0];
        $carrierName = $data['carrier'] ?: 'Correios';
        $trackingUrl = "https://rastreamento.correios.com.br/app/index.php?codigo={$data['tracking_code']}";

        $messageText = "📦 *Seu Pedido Está a Caminho! - {$store->name}* 🚚\n\n"
            . "Olá, {$firstName}! Seu pedido #{$sale->number} foi postado e já está a caminho do seu endereço! 💖\n\n"
            . "🔍 *Transportadora:* {$carrierName}\n"
            . "🏷️ *Código de Rastreio:* `{$data['tracking_code']}`\n"
            . "🔗 *Acompanhe seu pacote:* {$trackingUrl}\n\n"
            . "Assim que suas peças chegarem, nos avise o que achou dos looks! ✨";

        $instanceName = $store->slug ?? 'dyvinus';
        $evolutionService->sendMessage($instanceName, $sale->customer->whatsapp, $messageText);

        return back()->with('success', "Código de rastreamento enviado no WhatsApp com sucesso!");
    }
}
