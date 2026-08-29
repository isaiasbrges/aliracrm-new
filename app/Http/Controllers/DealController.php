<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Message;
use App\Services\EvolutionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    public function __construct(
        protected EvolutionService $evolutionService
    ) {}

    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');
        $storeId = $store->id;

        $stages = [
            'lead'        => ['label' => 'Novos Leads',       'color' => '#3b82f6'],
            'contacted'   => ['label' => 'Contato Feito',     'color' => '#8b5cf6'],
            'proposal'    => ['label' => 'Proposta Enviada',  'color' => '#f59e0b'],
            'negotiation' => ['label' => 'Em Negociação',     'color' => '#ec4899'],
            'won'         => ['label' => 'Ganhos / Fechados', 'color' => '#10b981'],
        ];

        $deals = Deal::query()
            ->with(['customer', 'user'])
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->where('stage', '!=', 'lost')
            ->latest()
            ->get();

        // Attach recency_days to each deal that has a linked customer
        $deals->each(function (Deal $deal) {
            if ($deal->customer && $deal->customer->last_purchase_at) {
                $deal->customer->recency_days = (int) now()
                    ->diffInDays($deal->customer->last_purchase_at);
            } else {
                $deal->customer?->setRelation('recency_days', null);
                if ($deal->customer) {
                    $deal->customer->recency_days = null;
                }
            }
        });

        $columns = [];
        $totalPipelineValue = 0;

        foreach ($stages as $key => $info) {
            $stageDeals = $deals->where('stage', $key)->values();
            $stageTotal = (float) $stageDeals->sum('value');
            $totalPipelineValue += $stageTotal;

            $columns[$key] = [
                'info'  => $info,
                'deals' => $stageDeals,
                'total' => $stageTotal,
                'count' => $stageDeals->count(),
            ];
        }

        // ── Recency Segments ──────────────────────────────────────────
        $customersWithPurchase = Customer::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->whereNotNull('last_purchase_at')
            ->where('total_purchases', '>', 0)
            ->orderByDesc('last_purchase_at')
            ->get(['id', 'name', 'whatsapp', 'total_spent', 'total_purchases', 'last_purchase_at']);

        $recencySegments = [
            'fresh'    => [], // ≤ 30 days
            'at_risk'  => [], // 31 – 90 days
            'inactive' => [], // 91 – 120 days
            'lost'     => [], // > 120 days
        ];

        foreach ($customersWithPurchase as $customer) {
            $days = (int) now()->diffInDays($customer->last_purchase_at);
            $customer->recency_days = $days;

            if ($days <= 30) {
                $recencySegments['fresh'][] = $customer;
            } elseif ($days <= 90) {
                $recencySegments['at_risk'][] = $customer;
            } elseif ($days <= 120) {
                $recencySegments['inactive'][] = $customer;
            } else {
                $recencySegments['lost'][] = $customer;
            }
        }

        $customers = Customer::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->orderBy('name')
            ->get(['id', 'name', 'whatsapp']);

        // ── Inteligência Anti-Ban & Saúde do Chip ──────────────────────
        $dispatchesToday = Message::query()
            ->where('organization_id', $organizationId)
            ->where('direction', 'outbound')
            ->whereDate('created_at', today())
            ->count();

        $dailyLimit = 200; // Limite padrão seguro de proteção diária
        $hour = (int) now()->format('H');
        $isCommercialHour = ($hour >= 8 && $hour < 21);

        $chipHealth = [
            'dispatches_today'   => $dispatchesToday,
            'daily_limit'        => $dailyLimit,
            'remaining'          => max(0, $dailyLimit - $dispatchesToday),
            'percentage'         => min(100, (int) round(($dispatchesToday / $dailyLimit) * 100)),
            'status'             => $dispatchesToday < ($dailyLimit * 0.7) ? 'safe' : ($dispatchesToday < $dailyLimit ? 'warning' : 'limit_reached'),
            'is_commercial_hour' => $isCommercialHour,
            'current_hour'       => now()->format('H:i'),
        ];

        return Inertia::render('Deals/Index', compact(
            'columns',
            'totalPipelineValue',
            'customers',
            'recencySegments',
            'chipHealth'
        ));
    }

    public function store(Request $request): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'value' => ['required', 'numeric', 'min:0'],
            'stage' => ['required', 'in:lead,contacted,proposal,negotiation,won,lost'],
            'priority' => ['required', 'in:low,medium,high'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'expected_close_date' => ['nullable', 'date'],
        ]);

        Deal::create([
            'organization_id' => $organizationId,
            'store_id' => $storeId,
            'user_id' => $request->user()->id,
            ...$data,
            'won_at' => $data['stage'] === 'won' ? now() : null,
            'lost_at' => $data['stage'] === 'lost' ? now() : null,
        ]);

        return redirect()->route('deals.index')->with('success', 'Oportunidade adicionada ao funil!');
    }

    public function updateStage(Request $request, Deal $deal): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        if ($deal->organization_id !== $organizationId || $deal->store_id !== $storeId) {
            abort(403);
        }

        $data = $request->validate([
            'stage' => ['required', 'in:lead,contacted,proposal,negotiation,won,lost'],
        ]);

        $updateData = ['stage' => $data['stage']];
        if ($data['stage'] === 'won' && !$deal->won_at) {
            $updateData['won_at'] = now();
        } elseif ($data['stage'] === 'lost' && !$deal->lost_at) {
            $updateData['lost_at'] = now();
        }

        $deal->update($updateData);

        return redirect()->route('deals.index')->with('success', "Oportunidade movida para '{$deal->stage_label}'!");
    }

    public function destroy(Request $request, Deal $deal): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        if ($deal->organization_id !== $organizationId || $deal->store_id !== $storeId) {
            abort(403);
        }

        $deal->delete();

        return redirect()->route('deals.index')->with('success', 'Oportunidade removida com sucesso.');
    }

    /**
     * Disparo individual de WhatsApp direto do Card do Funil
     */
    public function sendWhatsApp(Request $request, Deal $deal): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');
        $storeId = $store->id;

        if ($deal->organization_id !== $organizationId || $deal->store_id !== $storeId) {
            abort(403);
        }

        // Verificação de Limite Diário de Segurança
        $todayCount = Message::where('organization_id', $organizationId)->where('direction', 'outbound')->whereDate('created_at', today())->count();
        if ($todayCount >= 200) {
            return back()->withErrors(['message' => 'Limite diário de segurança atingido (200 disparos/dia) para proteger a saúde do seu chip WhatsApp. O limite reinicia à meia-noite.']);
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'advance_stage' => ['nullable', 'string', 'in:contacted,proposal,negotiation,won,lost'],
        ]);

        $customer = $deal->customer;
        if (!$customer || empty($customer->whatsapp)) {
            return back()->withErrors(['message' => 'Esta oportunidade não possui cliente ou WhatsApp vinculado.']);
        }

        // Processar Spintax inteligente
        $finalMessage = $this->parseSpintax($data['message']);

        // Criar ou localizar conversa no CRM
        $conversation = Conversation::firstOrCreate(
            [
                'organization_id'  => $organizationId,
                'store_id'         => $storeId,
                'external_chat_id' => $customer->whatsapp,
            ],
            [
                'customer_id'          => $customer->id,
                'channel'              => 'whatsapp',
                'status'               => 'open',
                'priority'             => 'normal',
                'subject'              => 'Atendimento · ' . $deal->title,
                'last_message_preview' => $finalMessage,
                'last_message_at'      => now(),
            ]
        );

        // Gravar mensagem
        Message::create([
            'organization_id' => $organizationId,
            'conversation_id' => $conversation->id,
            'direction'       => 'outbound',
            'type'            => 'text',
            'body'            => $finalMessage,
            'status'          => 'sent',
            'from_phone'      => 'store',
            'to_phone'        => $customer->whatsapp,
            'sent_at'         => now(),
        ]);

        $conversation->update([
            'last_message_preview' => $finalMessage,
            'last_message_at'      => now(),
            'status'               => 'open',
        ]);

        // Avançar estágio se solicitado
        if (!empty($data['advance_stage'])) {
            $deal->update(['stage' => $data['advance_stage']]);
        }

        // Disparo real via Evolution API
        $instanceName = $store->slug ?? 'dyvinus';
        $this->evolutionService->sendMessage($instanceName, $customer->whatsapp, $finalMessage);

        return redirect()->route('deals.index')
            ->with('success', "WhatsApp disparado com sucesso para {$customer->name}!");
    }

    /**
     * Disparo em massa para múltiplos cards de uma coluna do Funil (com Spintax e Throttling)
     */
    public function bulkSendWhatsApp(Request $request): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');
        $storeId = $store->id;

        $todayCount = Message::where('organization_id', $organizationId)->where('direction', 'outbound')->whereDate('created_at', today())->count();
        if ($todayCount >= 200) {
            return back()->withErrors(['message' => 'Limite diário de segurança atingido (200 disparos/dia) para proteger a saúde do seu chip WhatsApp.']);
        }

        $data = $request->validate([
            'deal_ids' => ['required', 'array', 'min:1'],
            'deal_ids.*' => ['integer', 'exists:deals,id'],
            'message_template' => ['required', 'string', 'max:5000'],
            'advance_stage' => ['nullable', 'string', 'in:contacted,proposal,negotiation,won,lost'],
        ]);

        $deals = Deal::query()
            ->with('customer')
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->whereIn('id', $data['deal_ids'])
            ->get();

        $instanceName = $store->slug ?? 'dyvinus';
        $sentCount = 0;

        foreach ($deals as $deal) {
            if (($todayCount + $sentCount) >= 200) {
                break; // Interrompe para proteger chip
            }

            $customer = $deal->customer;
            if (!$customer || empty($customer->whatsapp)) {
                continue;
            }

            $firstName = explode(' ', trim($customer->name))[0] ?: 'Cliente';
            $formattedValue = 'R$ ' . number_format($deal->value, 2, ',', '.');

            // 1. Substituir variáveis
            $personalizedMessage = str_replace(
                ['{cliente}', '{nome}', '{primeiro_nome}', '{valor}', '{titulo}', '{loja}'],
                [$firstName, $firstName, $firstName, $formattedValue, $deal->title, $store->name],
                $data['message_template']
            );

            // 2. Processar Spintax (ex: {Olá|Oi|Oie} -> varia aleatoriamente para cada cliente)
            $personalizedMessage = $this->parseSpintax($personalizedMessage);

            // 3. Criar ou atualizar conversa
            $conversation = Conversation::firstOrCreate(
                [
                    'organization_id'  => $organizationId,
                    'store_id'         => $storeId,
                    'external_chat_id' => $customer->whatsapp,
                ],
                [
                    'customer_id'          => $customer->id,
                    'channel'              => 'whatsapp',
                    'status'               => 'open',
                    'priority'             => 'normal',
                    'subject'              => 'Disparo Funil · ' . $deal->title,
                    'last_message_preview' => $personalizedMessage,
                    'last_message_at'      => now(),
                ]
            );

            Message::create([
                'organization_id' => $organizationId,
                'conversation_id' => $conversation->id,
                'direction'       => 'outbound',
                'type'            => 'text',
                'body'            => $personalizedMessage,
                'status'          => 'sent',
                'from_phone'      => 'store',
                'to_phone'        => $customer->whatsapp,
                'sent_at'         => now(),
            ]);

            $conversation->update([
                'last_message_preview' => $personalizedMessage,
                'last_message_at'      => now(),
                'status'               => 'open',
            ]);

            if (!empty($data['advance_stage'])) {
                $deal->update(['stage' => $data['advance_stage']]);
            }

            $this->evolutionService->sendMessage($instanceName, $customer->whatsapp, $personalizedMessage);
            $sentCount++;
        }

        return redirect()->route('deals.index')
            ->with('success', "Disparo inteligente concluído com sucesso para {$sentCount} oportunidades!");
    }

    /**
     * Disparo de Reativação para cliente no Radar
     */
    public function sendReactivationWhatsApp(Request $request, Customer $customer): RedirectResponse
    {
        $organizationId = $request->user()->organization_id;
        $store = $request->attributes->get('store');
        $storeId = $store->id;

        if ($customer->organization_id !== $organizationId || $customer->store_id !== $storeId) {
            abort(403);
        }

        $todayCount = Message::where('organization_id', $organizationId)->where('direction', 'outbound')->whereDate('created_at', today())->count();
        if ($todayCount >= 200) {
            return back()->withErrors(['message' => 'Limite diário de segurança atingido (200 disparos/dia) para proteger seu chip.']);
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        if (empty($customer->whatsapp)) {
            return back()->withErrors(['message' => 'Cliente sem WhatsApp cadastrado.']);
        }

        $finalMessage = $this->parseSpintax($data['message']);

        $conversation = Conversation::firstOrCreate(
            [
                'organization_id'  => $organizationId,
                'store_id'         => $storeId,
                'external_chat_id' => $customer->whatsapp,
            ],
            [
                'customer_id'          => $customer->id,
                'channel'              => 'whatsapp',
                'status'               => 'open',
                'priority'             => 'normal',
                'subject'              => 'Reativação · ' . $customer->name,
                'last_message_preview' => $finalMessage,
                'last_message_at'      => now(),
            ]
        );

        Message::create([
            'organization_id' => $organizationId,
            'conversation_id' => $conversation->id,
            'direction'       => 'outbound',
            'type'            => 'text',
            'body'            => $finalMessage,
            'status'          => 'sent',
            'from_phone'      => 'store',
            'to_phone'        => $customer->whatsapp,
            'sent_at'         => now(),
        ]);

        $conversation->update([
            'last_message_preview' => $finalMessage,
            'last_message_at'      => now(),
            'status'               => 'open',
        ]);

        $instanceName = $store->slug ?? 'dyvinus';
        $this->evolutionService->sendMessage($instanceName, $customer->whatsapp, $finalMessage);

        return redirect()->route('deals.index')
            ->with('success', "Mensagem de reativação enviada para {$customer->name}!");
    }

    /**
     * Parser Spintax: Transforma {Olá|Oi|Oie} em uma das opções aleatoriamente
     */
    protected function parseSpintax(string $text): string
    {
        return (string) preg_replace_callback('/\{([^{}]+)\}/', function ($matches) {
            $options = explode('|', $matches[1]);
            if (count($options) <= 1) {
                // Se for tag normal sem pipe, mantém como está
                return $matches[0];
            }
            return $options[array_rand($options)];
        }, $text);
    }
}
