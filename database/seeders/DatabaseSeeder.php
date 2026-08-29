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
            ['slug' => 'dyvinus-org'],
            ['name' => 'Dyvinuss Looks', 'status' => 'active'],
        );

        // Loja Principal & Instância WhatsApp Evolution API (dyvinus)
        $storeDyvinus = Store::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'slug' => 'dyvinus'],
            ['name' => 'Dyvinuss Looks', 'active' => true, 'accent_color' => '#db2777'],
        );
        StoreCounter::query()->firstOrCreate(['store_id' => $storeDyvinus->id], ['last_number' => 100]);

        // Remover outras lojas anteriores
        Store::query()->where('id', '!=', $storeDyvinus->id)->delete();

        User::query()->updateOrCreate(
            ['email' => 'demo@alira.local'],
            [
                'organization_id' => $organization->id,
                'name' => 'Isaias Dyvinuss',
                'password' => 'demo12345',
                'role' => 'owner',
                'active' => true,
                'last_store_id' => $storeDyvinus->id,
            ],
        );
    }
}
