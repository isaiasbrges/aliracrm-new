<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Deal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

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
        // Customers that have bought at least once, segmented by days since last purchase
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

        return Inertia::render('Deals/Index', compact(
            'columns',
            'totalPipelineValue',
            'customers',
            'recencySegments'
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
}
