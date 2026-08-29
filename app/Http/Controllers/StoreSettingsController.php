<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\StoreCounter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                    'accent_color'    => $s->accent_color ?? '#2563eb',
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
                'id'           => $currentStore->id,
                'name'         => $currentStore->name,
                'slug'         => $currentStore->slug,
                'accent_color' => $currentStore->accent_color ?? '#2563eb',
                'logo_url'     => $currentStore->logo_url,
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
                'api_url'        => (string) config('services.evolution.url', ''),
                'instance_name'  => $currentStore->slug,
                'is_configured'  => !empty(config('services.evolution.url')) && !empty(config('services.evolution.key')),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'accent_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'logo'         => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
        ]);

        $store = $request->attributes->get('store');

        $data = [
            'name'         => $request->input('name'),
            'accent_color' => $request->input('accent_color'),
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
        }

        if ($request->boolean('remove_logo')) {
            if ($store->logo_url) {
                $oldPath = ltrim(parse_url($store->logo_url, PHP_URL_PATH), '/');
                Storage::disk('public')->delete($oldPath);
            }
            $data['logo_url'] = null;
        }

        $store->update($data);

        return redirect()->route('settings.store')->with('success', 'Configurações da loja atualizadas com sucesso!');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'accent_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'logo'         => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
        ]);

        $organization = $request->attributes->get('organization');
        $user = $request->user();

        $baseSlug = Str::slug($request->input('name'));
        $slug = $baseSlug;
        $counter = 1;
        while ($organization->stores()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $newStore = Store::create([
            'organization_id' => $organization->id,
            'name'            => $request->input('name'),
            'slug'            => $slug,
            'accent_color'    => $request->input('accent_color', '#2563eb'),
            'active'          => true,
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store("logos/{$newStore->id}", 'public');
            $newStore->update(['logo_url' => Storage::disk('public')->url($path)]);
        }

        StoreCounter::create([
            'store_id'    => $newStore->id,
            'last_number' => 100,
        ]);

        // Automatically switch user to newly created store
        $user->forceFill(['last_store_id' => $newStore->id])->saveQuietly();

        return redirect()->route('settings.store')->with('success', "Loja '{$newStore->name}' criada com sucesso e definida como ativa!");
    }

    public function switchStore(Request $request, Store $store): RedirectResponse
    {
        $organization = $request->attributes->get('organization');
        $user = $request->user();

        if ($store->organization_id !== $organization->id) {
            abort(403, 'Acesso não autorizado a esta loja.');
        }

        $user->forceFill(['last_store_id' => $store->id])->saveQuietly();

        return redirect()->back()->with('success', "Alternado para a loja '{$store->name}' com sucesso!");
    }
}
