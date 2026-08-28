<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_requires_authentication(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_active_user_can_see_the_dashboard_for_the_active_store(): void
    {
        $organization = Organization::create([
            'name' => 'Alira Teste',
            'slug' => 'alira-teste',
            'status' => 'active',
        ]);

        $store = Store::create([
            'organization_id' => $organization->id,
            'name' => 'Loja Teste',
            'slug' => 'loja-teste',
            'active' => true,
            'accent_color' => '#d946ef',
        ]);

        $user = User::factory()->create([
            'organization_id' => $organization->id,
            'role' => 'owner',
            'active' => true,
            'last_store_id' => $store->id,
        ]);

        $this->actingAs($user)
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard/Index')
                ->where('store.name', 'Loja Teste')
                ->has('metrics')
            );
    }
}
