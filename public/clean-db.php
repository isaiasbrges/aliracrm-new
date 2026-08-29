<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

define('LARAVEL_START', microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/html; charset=utf-8');

try {
    // 1. Limpar tabelas mantendo estrutura
    DB::statement('TRUNCATE TABLE sale_items, sales, deals, messages, conversations, product_variants, products, customers RESTART IDENTITY CASCADE;');

    // 2. Rodar o Seeder limpo (apenas organização, loja e usuário admin)
    Artisan::call('db:seed', ['--force' => true]);
    $seedOutput = Artisan::output();

    echo "<!DOCTYPE html>
    <html>
    <head><title>Alira CRM - Limpeza Concluída</title></head>
    <body style='font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;'>
        <div style='max-width:700px;margin:40px auto;background:#1e293b;padding:30px;border-radius:16px;border:1px solid #334155;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);'>
            <h1 style='color:#38bdf8;margin-top:0;font-size:24px;'>✨ Banco de Dados Limpo com Sucesso!</h1>
            <p style='color:#94a3b8;font-size:14px;line-height:1.5;'>Todos os dados simulados (vendas fictícias, clientes demo, produtos e mensagens de teste) foram removidos.</p>
            <div style='background:#090d16;color:#4ade80;padding:15px;border-radius:10px;font-size:13px;margin:20px 0;'>
                <strong>Status:</strong> Banco de dados zerado e pronto para registrar dados reais.<br>
                <strong>Usuário Mantido:</strong> demo@alira.local
            </div>
            <div>
                <a href='/' style='background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;'>Acessar o Painel Limpo &rarr;</a>
            </div>
        </div>
    </body>
    </html>";
} catch (\Throwable $e) {
    echo "<!DOCTYPE html>
    <html>
    <head><title>Alira CRM - Erro na Limpeza</title></head>
    <body style='font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;'>
        <div style='max-width:700px;margin:40px auto;background:#1e293b;padding:30px;border-radius:16px;border:1px solid #ef4444;'>
            <h1 style='color:#ef4444;margin-top:0;font-size:24px;'>❌ Erro ao Limpar Banco</h1>
            <pre style='background:#090d16;color:#f87171;padding:15px;border-radius:10px;overflow-x:auto;font-size:13px;'>" . htmlspecialchars($e->getMessage()) . "</pre>
        </div>
    </body>
    </html>";
}
