<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Organization;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CrmModulesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Organization $organization;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->organization = Organization::create([
            'name' => 'Org Teste',
            'slug' => 'org-teste',
            'status' => 'active',
        ]);

        $this->store = Store::create([
            'organization_id' => $this->organization->id,
            'name' => 'Loja Matriz',
            'slug' => 'loja-matriz',
            'active' => true,
        ]);

        $this->user = User::factory()->create([
            'organization_id' => $this->organization->id,
            'role' => 'owner',
            'active' => true,
            'last_store_id' => $this->store->id,
        ]);
    }

    public function test_can_view_and_create_deals_in_kanban(): void
    {
        $response = $this->actingAs($this->user)->get('/funil');
        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Deals/Index')
            ->has('columns')
        );

        $post = $this->actingAs($this->user)->post('/funil', [
            'title' => 'Oportunidade VIP',
            'value' => 750.00,
            'stage' => 'lead',
            'priority' => 'high',
        ]);

        $post->assertRedirect('/funil');
        $this->assertDatabaseHas('deals', ['title' => 'Oportunidade VIP', 'value' => 750.00]);
    }

    public function test_can_view_whatsapp_inbox_and_send_messages(): void
    {
        $customer = Customer::create([
            'organization_id' => $this->organization->id,
            'store_id' => $this->store->id,
            'name' => 'Cliente Teste',
            'whatsapp' => '5511999998888',
        ]);

        $conv = Conversation::create([
            'organization_id' => $this->organization->id,
            'store_id' => $this->store->id,
            'customer_id' => $customer->id,
            'channel' => 'whatsapp',
            'external_chat_id' => $customer->whatsapp,
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->user)->get('/atendimentos?chat=' . $conv->id);
        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Conversations/Index')
            ->where('activeConversation.customer.name', 'Cliente Teste')
        );

        $msg = $this->actingAs($this->user)->post("/atendimentos/{$conv->id}/mensagens", [
            'body' => 'Olá! Como posso ajudar?',
        ]);

        $msg->assertRedirect();
        $this->assertDatabaseHas('messages', ['body' => 'Olá! Como posso ajudar?', 'direction' => 'outbound']);
    }

    public function test_customer_360_view(): void
    {
        $customer = Customer::create([
            'organization_id' => $this->organization->id,
            'store_id' => $this->store->id,
            'name' => 'Juliana VIP',
            'whatsapp' => '5511977776666',
            'total_spent' => 1500.00,
            'total_purchases' => 5,
        ]);

        $response = $this->actingAs($this->user)->get("/clientes/{$customer->id}");
        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Customers/Show')
            ->where('customer.name', 'Juliana VIP')
            ->where('customer.whatsapp', '5511977776666')
        );
    }
}
