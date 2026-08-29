<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Store;
use App\Models\StoreCounter;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $organization = Organization::query()->updateOrCreate(
            ['slug' => 'alira-demo'],
            ['name' => 'Alira Boutique & Moda', 'status' => 'active'],
        );

        $store = Store::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'slug' => 'loja-principal'],
            ['name' => 'Loja Jardins (Matriz)', 'active' => true, 'accent_color' => '#2563eb'],
        );

        StoreCounter::query()->firstOrCreate(['store_id' => $store->id], ['last_number' => 100]);

        User::query()->updateOrCreate(
            ['email' => 'demo@alira.local'],
            [
                'organization_id' => $organization->id,
                'name' => 'Isaias Consultor',
                'password' => 'demo12345',
                'role' => 'owner',
                'active' => true,
                'last_store_id' => $store->id,
            ],
        );
    }
}
