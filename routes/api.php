<?php

use App\Http\Controllers\EvolutionWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/evolution', EvolutionWebhookController::class)
    ->middleware('throttle:evolution-webhook')
    ->name('webhooks.evolution');
