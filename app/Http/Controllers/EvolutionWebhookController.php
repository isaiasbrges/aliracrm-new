<?php

namespace App\Http\Controllers;

use App\Models\WebhookEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EvolutionWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $expected = (string) config('services.evolution.webhook_secret');
        $provided = (string) $request->bearerToken();

        if ($expected === '' || ! hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $eventName = strtoupper((string) ($payload['event'] ?? 'UNKNOWN'));
        $instance = (string) ($payload['instance'] ?? '');
        $externalId = data_get($payload, 'data.key.id')
            ?? data_get($payload, 'data.messageId')
            ?? hash('sha256', $request->getContent());

        $event = WebhookEvent::firstOrCreate(
            [
                'provider' => 'evolution_api',
                'instance' => $instance,
                'event_name' => $eventName,
                'external_id' => (string) $externalId,
            ],
            ['payload' => $payload],
        );

        if ($event->wasRecentlyCreated) {
            Log::info('Evolution webhook received', [
                'event_id' => $event->id,
                'event' => $eventName,
                'instance' => $instance,
            ]);
        }

        return response()->json([
            'accepted' => true,
            'event_id' => $event->id,
            'duplicate' => ! $event->wasRecentlyCreated,
        ], 202);
    }
}
