<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\StoreCounter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $currentStore = $request->attributes->get('store');
        $organization = $request->attributes->get('organization');

        $stores = $organization->stores()
            ->withCount(['sales', 'products', 'customers'])
            ->orderBy('id')
            ->get()
            ->map(function ($s) use ($currentStore) {
                return [
                    'id'              => $s->id,
                    'name'            => $s->name,
                    'slug'            => $s->slug,
                    'accent_color'    => $s->accent_color ?? '#ff007f',
                    'logo_url'        => $s->logo_url,
                    'active'          => $s->active,
                    'is_current'      => $s->id === $currentStore->id,
                    'sales_count'     => $s->sales_count,
                    'products_count'  => $s->products_count,
                    'customers_count' => $s->customers_count,
                ];
            });

        return Inertia::render('Settings/Store', [
            'store' => [
                'id'                            => $currentStore->id,
                'name'                          => $currentStore->name,
                'slug'                          => $currentStore->slug,
                'accent_color'                  => $currentStore->accent_color ?? '#ff007f',
                'logo_url'                      => $currentStore->logo_url,
                'external_pos_webhook_enabled'  => (bool) $currentStore->external_pos_webhook_enabled,
                'external_pos_webhook_url'      => $currentStore->external_pos_webhook_url,
                'external_pos_webhook_secret'   => $currentStore->external_pos_webhook_secret,
            ],
            'organization' => [
                'id'   => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
            ],
            'stores' => $stores,
            'evolution' => [
                'webhook_url'    => url('/api/webhooks/evolution'),
                'webhook_secret' => (string) config('services.evolution.webhook_secret', 'alira-evo-secret-2026'),
                'api_url'        => (string) config('services.evolution.url', 'https://evolution.aliracrm.site'),
                'instance_name'  => $currentStore->slug,
                'is_configured'  => true,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'name'                         => ['required', 'string', 'max:100'],
            'accent_color'                 => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'logo'                         => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'logo_url'                     => ['nullable', 'string', 'max:1000'],
            'external_pos_webhook_enabled' => ['nullable', 'boolean'],
            'external_pos_webhook_url'     => ['nullable', 'url', 'max:1000'],
            'external_pos_webhook_secret'  => ['nullable', 'string', 'max:255'],
        ]);

        $store = $request->attributes->get('store');

        $data = [
            'name'                         => $request->input('name'),
            'accent_color'                 => $request->input('accent_color'),
            'external_pos_webhook_enabled' => $request->boolean('external_pos_webhook_enabled'),
            'external_pos_webhook_url'     => $request->input('external_pos_webhook_url'),
            'external_pos_webhook_secret'  => $request->input('external_pos_webhook_secret'),
        ];

        if ($request->hasFile('logo')) {
            if ($store->logo_url) {
                $oldPath = ltrim(parse_url($store->logo_url, PHP_URL_PATH), '/');
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $path = $request->file('logo')->store("logos/{$store->id}", 'public');
            $data['logo_url'] = Storage::disk('public')->url($path);
        } elseif ($request->filled('logo_url')) {
            $data['logo_url'] = $request->input('logo_url');
        }

        if ($request->boolean('remove_logo')) {
            if ($store->logo_url) {
                $oldPath = ltrim(parse_url($store->logo_url, PHP_URL_PATH), '/');
                Storage::disk('public')->delete($oldPath);
            }
            $data['logo_url'] = null;
        }

        $store->update($data);

        return redirect()->route('settings.store')->with('success', 'Configurações de logo, cores e webhook da loja salvas com sucesso!');
    }

    public function testWebhook(Request $request): JsonResponse
    {
        $request->validate([
            'url'    => ['required', 'url'],
            'secret' => ['nullable', 'string'],
        ]);

        $targetUrl = $request->input('url');
        $secret = $request->input('secret');

        $payload = [
            'event'     => 'pos.sale.test_ping',
            'timestamp' => now()->toISOString(),
            'store'     => [
                'name' => $request->attributes->get('store')->name,
                'slug' => $request->attributes->get('store')->slug,
            ],
            'test_data' => [
                'sale_id'     => 9999,
                'customer'    => 'Cliente Teste Alira',
                'items_count' => 2,
                'total'       => 189.90,
                'status'      => 'completed',
                'message'     => 'Disparo de teste de integração com PDV Externo via Alira CRM',
            ],
        ];

        try {
            $httpRequest = Http::timeout(8);
            if ($secret) {
                $httpRequest->withHeaders([
                    'Authorization' => "Bearer {$secret}",
                    'X-Webhook-Secret' => $secret,
                    'X-Alira-Event' => 'pos.sale.test_ping',
                ]);
            }

            $response = $httpRequest->post($targetUrl, $payload);

            return response()->json([
                'success'     => $response->successful(),
                'status_code' => $response->status(),
                'response'    => $response->json() ?? $response->body(),
                'message'     => $response->successful()
                    ? "Webhook respondido com sucesso (HTTP {$response->status()})!"
                    : "Webhook retornou erro HTTP {$response->status()}.",
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro no disparo de teste de webhook PDV Externo', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Falha ao conectar com o webhook: ' . $e->getMessage(),
            ], 500);
        }
    }
}
