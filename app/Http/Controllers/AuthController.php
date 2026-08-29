<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function create(Request $request, ?string $storeSlug = null): Response
    {
        $store = null;
        if ($storeSlug) {
            $store = Store::query()->where('slug', $storeSlug)->where('active', true)->first();
        }
        if (!$store) {
            $store = Store::query()->where('slug', 'dyvinuss-looks')->first()
                ?? Store::query()->where('active', true)->first();
        }

        $targetStore = null;
        if ($store) {
            $targetStore = [
                'id'           => $store->id,
                'name'         => $store->name,
                'slug'         => $store->slug,
                'accent_color' => $store->accent_color ?? '#db2777',
                'logo_url'     => $store->logo_url,
            ];
        }

        return Inertia::render('Auth/Login', [
            'targetStore' => $targetStore,
        ]);
    }

    public function store(Request $request, ?string $storeSlug = null): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'min:8'],
            'store_slug' => ['nullable', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (!Auth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
            'active' => true,
        ], $remember)) {
            return back()->withErrors([
                'email' => 'E-mail ou senha inválidos.',
            ])->onlyInput('email');
        }

        $request->session()->regenerate();
        $user = $request->user();

        if (!$user?->organization || $user->organization->status !== 'active') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'email' => 'Sua organização não está ativa.',
            ])->onlyInput('email');
        }

        $targetSlug = $storeSlug ?? $request->input('store_slug');
        if ($targetSlug) {
            $store = Store::query()
                ->where('organization_id', $user->organization_id)
                ->where('slug', $targetSlug)
                ->where('active', true)
                ->first();

            if ($store) {
                $user->forceFill(['last_store_id' => $store->id])->saveQuietly();
            }
        }

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
