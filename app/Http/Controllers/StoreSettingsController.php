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

        $serverHost = parse_url(config('app.url') ?: 'https://aliracrm.site', PHP_URL_HOST) ?: 'aliracrm.site';
        $serverIp = @gethostbyname($serverHost) ?: '185.173.111.45';

        return Inertia::render('Settings/Store', [
            'store' => [
                'id'                            => $currentStore->id,
                'name'                          => $currentStore->name,
                'slug'                          => $currentStore->slug,
                'accent_color'                  => $currentStore->accent_color ?? '#ff007f',
                'logo_url'                      => $currentStore->logo_url,
                'custom_domain'                 => $currentStore->custom_domain,
                'custom_domain_status'          => $currentStore->custom_domain_status ?? 'pending',
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
            'dns_info' => [
                'server_ip'   => $serverIp,
                'server_host' => $serverHost,
            ],
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
            'accent_color'                 => ['nullable', 'string', 'max:30'],
            'logo'                         => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'logo_url'                     => ['nullable', 'string', 'max:1000'],
            'custom_domain'                => ['nullable', 'string', 'max:190'],
            'external_pos_webhook_enabled' => ['nullable', 'boolean'],
            'external_pos_webhook_url'     => ['nullable', 'url', 'max:500'],
            'external_pos_webhook_secret'  => ['nullable', 'string', 'max:100'],
        ]);

        $store = $request->attributes->get('store');

        // Normalizar cor hexadecimal (aceita com ou sem #, maiúsculo ou minúsculo)
        $rawColor = trim((string) $request->input('accent_color', '#ff007f'));
        if (!empty($rawColor) && !str_starts_with($rawColor, '#')) {
            $rawColor = '#' . $rawColor;
        }
        if (!preg_match('/^#[0-9a-fA-F]{3,8}$/', $rawColor)) {
            $rawColor = '#ff007f';
        }

        $domain = trim(strtolower((string) $request->input('custom_domain', '')));
        $domain = preg_replace('#^https?://#', '', $domain);
        $domain = rtrim($domain, '/');

        $data = [
            'name'          => $request->input('name', $store->name),
            'accent_color'  => $rawColor,
            'custom_domain' => !empty($domain) ? $domain : null,
        ];

        if (\Illuminate\Support\Facades\Schema::hasColumn('stores', 'custom_domain_status')) {
            $data['custom_domain_status'] = !empty($domain) ? 'pending' : 'none';
        }

        if (\Illuminate\Support\Facades\Schema::hasColumn('stores', 'external_pos_webhook_enabled')) {
            $data['external_pos_webhook_enabled'] = $request->boolean('external_pos_webhook_enabled');
        }
        if (\Illuminate\Support\Facades\Schema::hasColumn('stores', 'external_pos_webhook_url')) {
            $data['external_pos_webhook_url'] = $request->input('external_pos_webhook_url');
        }
        if (\Illuminate\Support\Facades\Schema::hasColumn('stores', 'external_pos_webhook_secret')) {
            $data['external_pos_webhook_secret'] = $request->input('external_pos_webhook_secret');
        }

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

        $data['logo_url'] = $logoUrl;

        try {
            $store->update($data);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Erro ao atualizar loja: " . $e->getMessage());
            $store->name = $data['name'];
            $store->accent_color = $data['accent_color'];
            $store->logo_url = $logoUrl;
            $store->save();
        }

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
