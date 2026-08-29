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

    // 2. Rodar o Seeder limpo (apenas organização, loja Dyvinus e usuário admin)
    Artisan::call('db:seed', ['--force' => true]);
    $seedOutput = Artisan::output();

    echo "<!DOCTYPE html>
    <html>
    <head><title>Alira CRM - Dyvinus Configurada</title></head>
    <body style='font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;'>
        <div style='max-width:700px;margin:40px auto;background:#1e293b;padding:30px;border-radius:16px;border:1px solid #334155;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);'>
            <h1 style='color:#db2777;margin-top:0;font-size:24px;'>✨ Loja Dyvinus Ativa & Banco Limpo!</h1>
            <p style='color:#94a3b8;font-size:14px;line-height:1.5;'>O sistema foi configurado exclusivamente para a loja <strong>Dyvinus</strong> com todas as automações, Evolution API e WhatsApp ativos.</p>
            <div style='background:#090d16;color:#4ade80;padding:15px;border-radius:10px;font-size:13px;margin:20px 0;'>
                <strong>Loja Ativa:</strong> Dyvinus (slug: <code>dyvinus</code>)<br>
                <strong>Usuário Administrador:</strong> demo@alira.local<br>
                <strong>Status:</strong> Pronto para registrar dados e atendimentos reais.
            </div>
            <div>
                <a href='/' style='background:#db2777;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;'>Acessar o Painel da Dyvinus &rarr;</a>
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
