<?php

namespace Tests\Feature;

use App\Models\WebhookEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EvolutionWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.evolution.webhook_secret' => 'local-webhook-secret']);
    }

    public function test_webhook_rejects_requests_without_secret(): void
    {
        $this->postJson('/api/webhooks/evolution', [
            'event' => 'MESSAGES_UPSERT',
            'instance' => 'alira-demo',
        ])->assertUnauthorized();

        $this->assertDatabaseCount('webhook_events', 0);
    }

    public function test_webhook_accepts_and_deduplicates_the_same_message(): void
    {
        $payload = [
            'event' => 'MESSAGES_UPSERT',
            'instance' => 'alira-demo',
            'data' => [
                'key' => [
                    'id' => 'message-001',
                    'remoteJid' => '5511999999999@s.whatsapp.net',
                    'fromMe' => false,
                ],
                'message' => ['conversation' => 'Olá'],
            ],
        ];

        $this->withHeader('Authorization', 'Bearer local-webhook-secret')
            ->postJson('/api/webhooks/evolution', $payload)
            ->assertStatus(202)
            ->assertJson(['accepted' => true, 'duplicate' => false]);

        $this->withHeader('Authorization', 'Bearer local-webhook-secret')
            ->postJson('/api/webhooks/evolution', $payload)
            ->assertStatus(202)
            ->assertJson(['accepted' => true, 'duplicate' => true]);

        $this->assertDatabaseCount('webhook_events', 1);
        $this->assertSame('MESSAGES_UPSERT', WebhookEvent::firstOrFail()->event_name);
    }
}
