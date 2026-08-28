<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $store = $request->attributes->get('store');

        return Inertia::render('Settings/Store', [
            'store' => [
                'id'           => $store->id,
                'name'         => $store->name,
                'accent_color' => $store->accent_color ?? '#2563eb',
                'logo_url'     => $store->logo_url,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'accent_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'logo'         => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
        ]);

        $store = $request->attributes->get('store');

        $data = [
            'accent_color' => $request->input('accent_color'),
        ];

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
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

        return redirect()->route('settings.store')->with('success', 'Configurações da loja salvas com sucesso!');
    }
}
