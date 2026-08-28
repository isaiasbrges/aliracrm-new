<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;
        $search = $request->query('search');

        $query = Customer::query()
            ->withCount(['sales', 'conversations', 'deals'])
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('whatsapp', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $customers = $query->latest()->paginate(15)->withQueryString();

        $metrics = [
            'total' => Customer::where('organization_id', $organizationId)->where('store_id', $storeId)->count(),
            'with_consent' => Customer::where('organization_id', $organizationId)->where('store_id', $storeId)->where('whatsapp_consent', true)->count(),
            'total_spent' => (float) Customer::where('organization_id', $organizationId)->where('store_id', $storeId)->sum('total_spent'),
        ];

        return Inertia::render('Customers/Index', compact('customers', 'metrics', 'search'));
    }

    public function show(Request $request, Customer $customer): Response
    {
        $organizationId = $request->user()->organization_id;
        $storeId = $request->attributes->get('store')->id;

        if ($customer->organization_id !== $organizationId || $customer->store_id !== $storeId) {
            abort(403);
        }

        $customer->load([
            'sales' => function ($q) {
                $q->with('items.variant.product', 'seller')->latest();
            },
            'conversations.messages' => function ($q) {
                $q->latest()->limit(10);
            },
            'deals' => function ($q) {
                $q->latest();
            }
        ]);

        return Inertia::render('Customers/Show', compact('customer'));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'whatsapp' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:190'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'size:2'],
            'whatsapp_consent' => ['sometimes', 'boolean'],
        ]);

        $organizationId = $request->user()->organization_id;
        $whatsapp = preg_replace('/\D+/', '', $data['whatsapp']) ?? '';

        if (strlen($whatsapp) < 10 || strlen($whatsapp) > 15) {
            return back()->withErrors(['whatsapp' => 'Informe um WhatsApp válido com DDD.'])->withInput();
        }

        $exists = Customer::query()
            ->where('organization_id', $organizationId)
            ->where('whatsapp', $whatsapp)
            ->exists();

        if ($exists) {
            return back()->withErrors(['whatsapp' => 'Este WhatsApp já está cadastrado nesta organização.'])->withInput();
        }

        $customer = Customer::create([
            'organization_id' => $organizationId,
            'store_id' => $request->attributes->get('store')->id,
            'name' => $data['name'],
            'whatsapp' => $whatsapp,
            'email' => $data['email'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => isset($data['state']) ? strtoupper($data['state']) : null,
            'whatsapp_consent' => (bool) ($data['whatsapp_consent'] ?? false),
        ]);

        return redirect()->route('customers.show', $customer)->with('success', 'Cliente cadastrado com sucesso!');
    }

    /**
     * Cria um cliente diretamente do PDV (Frente de Caixa) e retorna JSON.
     */
    public function storeFromPdv(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'name'             => ['required', 'string', 'max:190'],
            'whatsapp'         => ['required', 'string', 'max:30'],
            'email'            => ['nullable', 'email', 'max:190'],
            'whatsapp_consent' => ['sometimes', 'boolean'],
        ]);

        $organizationId = $request->user()->organization_id;
        $whatsapp = preg_replace('/\D+/', '', $data['whatsapp']) ?? '';

        if (strlen($whatsapp) < 10 || strlen($whatsapp) > 15) {
            return response()->json(['errors' => ['whatsapp' => 'Informe um WhatsApp válido com DDD.']], 422);
        }

        $exists = Customer::query()
            ->where('organization_id', $organizationId)
            ->where('whatsapp', $whatsapp)
            ->first();

        if ($exists) {
            // Retorna o cliente já existente ao invés de erro, para facilitar o fluxo do PDV
            return response()->json(['customer' => $exists, 'already_exists' => true]);
        }

        $customer = Customer::create([
            'organization_id'  => $organizationId,
            'store_id'         => $request->attributes->get('store')->id,
            'name'             => $data['name'],
            'whatsapp'         => $whatsapp,
            'email'            => $data['email'] ?? null,
            'whatsapp_consent' => (bool) ($data['whatsapp_consent'] ?? false),
        ]);

        return response()->json(['customer' => $customer, 'already_exists' => false], 201);
    }
}
