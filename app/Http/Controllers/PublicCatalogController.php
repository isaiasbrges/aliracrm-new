<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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

    /**
     * Integração Completa: Criação Automática de Pedido, Lead no Funil, Venda e Conversa no WhatsApp
     */
    public function checkoutOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id'        => ['required', 'exists:stores,id'],
            'customer_name'   => ['nullable', 'string', 'max:190'],
            'customer_phone'  => ['nullable', 'string', 'max:50'],
            'customer_city'   => ['nullable', 'string', 'max:100'],
            'items'           => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.size'       => ['nullable', 'string'],
            'items.*.qty'        => ['required', 'integer', 'min:1'],
            'items.*.price'      => ['required', 'numeric', 'min:0'],
        ]);

        $store = Store::findOrFail($data['store_id']);
        $organizationId = $store->organization_id;

        $customerName = trim($data['customer_name'] ?? '') ?: 'Cliente do Catálogo';
        $customerPhone = preg_replace('/\D/', '', $data['customer_phone'] ?? '');

        // 1. Criar ou Localizar Cliente no CRM
        $customer = null;
        if (!empty($customerPhone)) {
            $customer = Customer::query()
                ->where('organization_id', $organizationId)
                ->where('phone', 'like', "%{$customerPhone}%")
                ->first();
        }

        if (!$customer) {
            $customer = Customer::create([
                'organization_id' => $organizationId,
                'store_id'        => $store->id,
                'name'            => $customerName,
                'phone'           => $customerPhone ?: null,
                'city'            => $data['customer_city'] ?? null,
                'source'          => 'catalogo_online',
                'tags'            => ['Catálogo Online', 'Novo Lead'],
            ]);
        }

        // 2. Calcular total e montar resumo dos itens
        $total = 0;
        $orderNumber = 'CAT-' . strtoupper(Str::random(6));
        $itemDescriptions = [];

        foreach ($data['items'] as $item) {
            $subtotal = $item['price'] * $item['qty'];
            $total += $subtotal;
            $product = Product::find($item['product_id']);
            $pName = $product ? $product->name : 'Look';
            $size = $item['size'] ?? 'M';
            $itemDescriptions[] = "• {$item['qty']}x {$pName} (Tam: {$size}) - R$ " . number_format($subtotal, 2, ',', '.');
        }

        // 3. Criar Deal no Funil de Vendas (Kanban)
        $deal = Deal::create([
            'organization_id' => $organizationId,
            'store_id'        => $store->id,
            'customer_id'     => $customer->id,
            'title'           => "🛍️ Pedido Catálogo #{$orderNumber} - {$customer->name}",
            'value'           => $total,
            'stage'           => 'lead',
            'priority'        => 'high',
            'notes'           => implode("\n", $itemDescriptions),
        ]);

        // 4. Criar Venda Pendente no PDV / Vendas
        $sale = Sale::create([
            'organization_id' => $organizationId,
            'store_id'        => $store->id,
            'customer_id'     => $customer->id,
            'number'          => $orderNumber,
            'status'          => 'pending',
            'subtotal'        => $total,
            'discount'        => 0,
            'total'           => $total,
            'payment_method'  => 'whatsapp',
            'notes'           => "Pedido criado automaticamente pelo Catálogo Digital.\nItens:\n" . implode("\n", $itemDescriptions),
        ]);

        foreach ($data['items'] as $item) {
            $product = Product::find($item['product_id']);
            $variant = ProductVariant::where('product_id', $item['product_id'])
                ->where('size', $item['size'] ?? 'M')
                ->first();

            SaleItem::create([
                'organization_id' => $organizationId,
                'sale_id'         => $sale->id,
                'variant_id'      => $variant ? $variant->id : ($product->variants->first()?->id ?? 1),
                'quantity'        => $item['qty'],
                'unit_price'      => $item['price'],
                'discount'        => 0,
                'total'           => $item['price'] * $item['qty'],
            ]);
        }

        // 5. Criar ou Atualizar Conversa na Central WhatsApp
        $conversation = Conversation::query()
            ->where('store_id', $store->id)
            ->where('customer_id', $customer->id)
            ->first();

        $orderSummaryText = "🛍️ *NOVO PEDIDO DO CATÁLOGO #{$orderNumber}*\n\n" . implode("\n", $itemDescriptions) . "\n\n💰 *Total:* R$ " . number_format($total, 2, ',', '.');

        if (!$conversation) {
            $conversation = Conversation::create([
                'organization_id'      => $organizationId,
                'store_id'             => $store->id,
                'customer_id'          => $customer->id,
                'channel'              => 'whatsapp',
                'external_chat_id'     => $customerPhone ? "{$customerPhone}@s.whatsapp.net" : null,
                'status'               => 'open',
                'priority'             => 'high',
                'subject'              => "Pedido #{$orderNumber}",
                'last_message_preview' => $orderSummaryText,
                'last_message_at'      => now(),
                'unread_count'         => 1,
            ]);
        } else {
            $conversation->update([
                'status'               => 'open',
                'priority'             => 'high',
                'last_message_preview' => $orderSummaryText,
                'last_message_at'      => now(),
                'unread_count'         => $conversation->unread_count + 1,
            ]);
        }

        Message::create([
            'conversation_id' => $conversation->id,
            'direction'       => 'incoming',
            'type'            => 'text',
            'body'            => $orderSummaryText,
            'status'          => 'received',
        ]);

        return response()->json([
            'success'      => true,
            'order_number' => $orderNumber,
            'sale_id'      => $sale->id,
            'deal_id'      => $deal->id,
            'customer_id'  => $customer->id,
            'message'      => 'Pedido registrado com sucesso no CRM e pronto para envio no WhatsApp!',
        ]);
    }
}
