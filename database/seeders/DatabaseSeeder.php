<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Organization;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\StoreCounter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException('O seeder demo está bloqueado em produção.');
        }

        $organization = Organization::query()->updateOrCreate(
            ['slug' => 'alira-demo'],
            ['name' => 'Alira Boutique & Moda', 'status' => 'active'],
        );

        $store = Store::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'slug' => 'loja-principal'],
            ['name' => 'Loja Jardins (Matriz)', 'active' => true, 'accent_color' => '#2563eb'],
        );

        StoreCounter::query()->firstOrCreate(['store_id' => $store->id], ['last_number' => 100]);

        $user = User::query()->updateOrCreate(
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

        // 1. Clientes
        $customersData = [
            [
                'name' => 'Fernanda Lima',
                'whatsapp' => '5511988881111',
                'email' => 'fernanda.lima@gmail.com',
                'city' => 'São Paulo',
                'state' => 'SP',
                'whatsapp_consent' => true,
                'total_spent' => 1250.00,
                'total_purchases' => 4,
                'last_purchase_at' => Carbon::now()->subDays(2),
            ],
            [
                'name' => 'Camila Rodrigues',
                'whatsapp' => '5511977772222',
                'email' => 'camila.rodrigues@hotmail.com',
                'city' => 'Campinas',
                'state' => 'SP',
                'whatsapp_consent' => true,
                'total_spent' => 680.00,
                'total_purchases' => 2,
                'last_purchase_at' => Carbon::now()->subDays(5),
            ],
            [
                'name' => 'Juliana Souza',
                'whatsapp' => '5521966663333',
                'email' => 'juliana.souza@gmail.com',
                'city' => 'Rio de Janeiro',
                'state' => 'RJ',
                'whatsapp_consent' => true,
                'total_spent' => 450.00,
                'total_purchases' => 1,
                'last_purchase_at' => Carbon::now()->subDays(45), // Em risco
            ],
            [
                'name' => 'Beatriz Mendes',
                'whatsapp' => '5531955554444',
                'email' => 'beatriz.mendes@yahoo.com',
                'city' => 'Belo Horizonte',
                'state' => 'MG',
                'whatsapp_consent' => true,
                'total_spent' => 0.00,
                'total_purchases' => 0,
                'last_purchase_at' => null, // Novo Lead
            ],
        ];

        $createdCustomers = [];
        foreach ($customersData as $c) {
            $createdCustomers[] = Customer::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'whatsapp' => $c['whatsapp']],
                [
                    'store_id' => $store->id,
                    'name' => $c['name'],
                    'email' => $c['email'],
                    'city' => $c['city'],
                    'state' => $c['state'],
                    'whatsapp_consent' => $c['whatsapp_consent'],
                    'total_spent' => $c['total_spent'],
                    'total_purchases' => $c['total_purchases'],
                    'last_purchase_at' => $c['last_purchase_at'],
                ],
            );
        }

        // 2. Produtos e Variantes
        $productsData = [
            ['name' => 'Vestido Seda Aurora', 'sku' => 'AUR-001', 'price' => 389.90, 'size' => 'M', 'color' => 'Preto', 'stock' => 15],
            ['name' => 'Vestido Seda Aurora', 'sku' => 'AUR-002', 'price' => 389.90, 'size' => 'G', 'color' => 'Terracota', 'stock' => 8],
            ['name' => 'Camisa Linho Horizonte', 'sku' => 'HOR-001', 'price' => 229.90, 'size' => 'M', 'color' => 'Branca', 'stock' => 12],
            ['name' => 'Blazer Alfaiataria Noite', 'sku' => 'BLZ-001', 'price' => 549.90, 'size' => 'P', 'color' => 'Azul Marinho', 'stock' => 6],
            ['name' => 'Calça Pantalona Elegance', 'sku' => 'PAN-001', 'price' => 279.90, 'size' => '38', 'color' => 'Off-White', 'stock' => 10],
        ];

        $variants = [];
        foreach ($productsData as $data) {
            $product = Product::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'sku' => $data['sku']],
                [
                    'store_id' => $store->id,
                    'name' => $data['name'],
                    'price' => $data['price'],
                    'status' => 'active',
                ],
            );

            $variant = ProductVariant::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'sku' => $data['sku']],
                [
                    'product_id' => $product->id,
                    'size' => $data['size'],
                    'color' => $data['color'],
                    'price' => $data['price'],
                    'stock' => $data['stock'],
                ],
            );
            $variants[] = $variant;
        }

        // 3. Vendas Simuladas nos Últimos 7 Dias (para o gráfico e histórico)
        $salesToSeed = [
            ['days_ago' => 6, 'customer' => $createdCustomers[0], 'variant' => $variants[0], 'qty' => 1, 'method' => 'pix'],
            ['days_ago' => 5, 'customer' => $createdCustomers[1], 'variant' => $variants[2], 'qty' => 1, 'method' => 'credit'],
            ['days_ago' => 4, 'customer' => $createdCustomers[0], 'variant' => $variants[3], 'qty' => 1, 'method' => 'credit'],
            ['days_ago' => 3, 'customer' => null, 'variant' => $variants[1], 'qty' => 1, 'method' => 'cash'],
            ['days_ago' => 2, 'customer' => $createdCustomers[1], 'variant' => $variants[4], 'qty' => 2, 'method' => 'pix'],
            ['days_ago' => 1, 'customer' => $createdCustomers[0], 'variant' => $variants[0], 'qty' => 1, 'method' => 'pix'],
            ['days_ago' => 0, 'customer' => $createdCustomers[0], 'variant' => $variants[2], 'qty' => 2, 'method' => 'credit'],
        ];

        $orderNum = 101;
        foreach ($salesToSeed as $s) {
            $date = Carbon::now()->subDays($s['days_ago'])->setHour(14)->setMinute(30);
            $itemTotal = (float) $s['variant']->price * $s['qty'];

            $sale = Sale::create([
                'organization_id' => $organization->id,
                'store_id' => $store->id,
                'customer_id' => $s['customer']?->id,
                'seller_id' => $user->id,
                'number' => $orderNum++,
                'status' => 'completed',
                'subtotal' => $itemTotal,
                'discount' => 0,
                'total' => $itemTotal,
                'payment_method' => $s['method'],
                'completed_at' => $date,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            SaleItem::create([
                'organization_id' => $organization->id,
                'sale_id' => $sale->id,
                'variant_id' => $s['variant']->id,
                'quantity' => $s['qty'],
                'unit_price' => $s['variant']->price,
                'discount' => 0,
                'total' => $itemTotal,
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }

        // 4. Conversas e Mensagens de WhatsApp
        $conv1 = Conversation::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'external_chat_id' => $createdCustomers[0]->whatsapp],
            [
                'store_id' => $store->id,
                'customer_id' => $createdCustomers[0]->id,
                'channel' => 'whatsapp',
                'status' => 'open',
                'priority' => 'high',
                'subject' => 'Atendimento VIP',
                'last_message_preview' => 'Perfeito! O vestido ficou maravilhoso, muito obrigada!',
                'last_message_at' => Carbon::now()->subMinutes(15),
                'unread_count' => 1,
            ]
        );

        Message::create([
            'organization_id' => $organization->id,
            'conversation_id' => $conv1->id,
            'direction' => 'outbound',
            'type' => 'text',
            'body' => 'Olá Fernanda! Seu pedido com o Vestido Aurora já foi embalado e está pronto.',
            'status' => 'delivered',
            'sent_at' => Carbon::now()->subMinutes(30),
            'created_at' => Carbon::now()->subMinutes(30),
        ]);

        Message::create([
            'organization_id' => $organization->id,
            'conversation_id' => $conv1->id,
            'direction' => 'inbound',
            'type' => 'text',
            'body' => 'Perfeito! O vestido ficou maravilhoso, muito obrigada!',
            'status' => 'received',
            'sent_at' => Carbon::now()->subMinutes(15),
            'created_at' => Carbon::now()->subMinutes(15),
        ]);

        $conv2 = Conversation::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'external_chat_id' => $createdCustomers[3]->whatsapp],
            [
                'store_id' => $store->id,
                'customer_id' => $createdCustomers[3]->id,
                'channel' => 'whatsapp',
                'status' => 'open',
                'priority' => 'normal',
                'subject' => 'Dúvida sobre Tamanhos',
                'last_message_preview' => 'Vocês teriam o blazer azul no tamanho M também?',
                'last_message_at' => Carbon::now()->subHours(1),
                'unread_count' => 1,
            ]
        );

        Message::create([
            'organization_id' => $organization->id,
            'conversation_id' => $conv2->id,
            'direction' => 'inbound',
            'type' => 'text',
            'body' => 'Olá! Vi o Blazer Alfaiataria no site. Vocês teriam o azul no tamanho M também?',
            'status' => 'received',
            'sent_at' => Carbon::now()->subHours(1),
            'created_at' => Carbon::now()->subHours(1),
        ]);

        // 5. Funil de Vendas (Deals Kanban)
        $dealsData = [
            [
                'title' => 'Look Completo Casamento',
                'customer_id' => $createdCustomers[0]->id,
                'value' => 1250.00,
                'stage' => 'negotiation',
                'priority' => 'high',
                'notes' => 'Cliente quer Vestido Aurora + Blazer Alfaiataria para evento no sábado.',
            ],
            [
                'title' => 'Conjunto Primavera',
                'customer_id' => $createdCustomers[1]->id,
                'value' => 509.80,
                'stage' => 'proposal',
                'priority' => 'medium',
                'notes' => 'Proposta enviada via WhatsApp com 10% no Pix.',
            ],
            [
                'title' => 'Primeira Compra Blazer',
                'customer_id' => $createdCustomers[3]->id,
                'value' => 549.90,
                'stage' => 'contacted',
                'priority' => 'medium',
                'notes' => 'Interessada no Blazer M. Confirmar disponibilidade no estoque.',
            ],
            [
                'title' => 'Camisa Linho + Calça',
                'customer_id' => null,
                'value' => 509.80,
                'stage' => 'lead',
                'priority' => 'low',
                'notes' => 'Lead de campanha no Instagram.',
            ],
            [
                'title' => 'Look Executivo Fechado',
                'customer_id' => $createdCustomers[0]->id,
                'value' => 829.80,
                'stage' => 'won',
                'priority' => 'high',
                'notes' => 'Venda finalizada com sucesso e entregue.',
            ],
        ];

        foreach ($dealsData as $d) {
            Deal::create([
                'organization_id' => $organization->id,
                'store_id' => $store->id,
                'user_id' => $user->id,
                'title' => $d['title'],
                'customer_id' => $d['customer_id'],
                'value' => $d['value'],
                'stage' => $d['stage'],
                'priority' => $d['priority'],
                'notes' => $d['notes'],
                'won_at' => $d['stage'] === 'won' ? Carbon::now()->subDays(1) : null,
            ]);
        }
    }
}
