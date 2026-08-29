<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (app()->environment('production') || !app()->environment('local') || str_starts_with(config('app.url', ''), 'https://')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        RateLimiter::for('login', function (Request $request): Limit {
            return Limit::perMinute(5)->by(
                strtolower((string) $request->input('email')).'|'.$request->ip(),
            );
        });

        RateLimiter::for('evolution-webhook', function (Request $request): Limit {
            return Limit::perMinute(120)->by($request->ip());
        });
    }
}
