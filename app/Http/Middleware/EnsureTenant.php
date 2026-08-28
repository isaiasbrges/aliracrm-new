<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->active || !$user->organization || $user->organization->status !== 'active') {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Sua conta ou organização não está ativa.',
            ]);
        }

        $store = $user->lastStore;
        if (!$store || !$store->active || $store->organization_id !== $user->organization_id) {
            $store = $user->organization->stores()->where('active', true)->orderBy('id')->first();
        }

        if (!$store) {
            abort(403, 'Nenhuma loja ativa está disponível para esta organização.');
        }

        if ($user->last_store_id !== $store->id) {
            $user->forceFill(['last_store_id' => $store->id])->saveQuietly();
        }

        $request->attributes->set('organization', $user->organization);
        $request->attributes->set('store', $store);
        view()->share('organization', $user->organization);
        view()->share('store', $store);

        return $next($request);
    }
}
