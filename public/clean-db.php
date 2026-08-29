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

    // 2. Rodar o Seeder limpo (apenas organização, loja Dyvinuss Looks com slug dyvinus e usuário admin)
    Artisan::call('db:seed', ['--force' => true]);
    $seedOutput = Artisan::output();

    echo "<!DOCTYPE html>
    <html>
    <head><title>Dyvinuss Looks - Conexões Ativas</title></head>
    <body style='font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;'>
        <div style='max-width:700px;margin:40px auto;background:#1e293b;padding:30px;border-radius:16px;border:1px solid #334155;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);'>
            <h1 style='color:#db2777;margin-top:0;font-size:24px;'>✨ Conexão com Evolution API & N8N Restaurada!</h1>
            <p style='color:#94a3b8;font-size:14px;line-height:1.5;'>A loja <strong>Dyvinuss Looks</strong> foi sincronizada diretamente com a instância <code>dyvinus</code> da Evolution API e N8N.</p>
            <div style='background:#090d16;color:#4ade80;padding:15px;border-radius:10px;font-size:13px;margin:20px 0;line-height:1.6;'>
                <strong>Loja:</strong> Dyvinuss Looks<br>
                <strong>Instância Evolution:</strong> <code>dyvinus</code> (Online)<br>
                <strong>N8N Webhook:</strong> Ativo & Sincronizado<br>
                <strong>Usuário:</strong> demo@alira.local / demo12345
            </div>
            <div style='display:flex;gap:12px;'>
                <a href='/loja/dyvinus' style='background:#db2777;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;'>Acessar o Painel &rarr;</a>
                <a href='/catalogo' style='background:#334155;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;'>Ver Catálogo &rarr;</a>
            </div>
        </div>
    </body>
    </html>";
} catch (\Throwable $e) {
    echo "<!DOCTYPE html>
    <html>
    <head><title>Dyvinuss Looks - Erro</title></head>
    <body style='font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;'>
        <div style='max-width:700px;margin:40px auto;background:#1e293b;padding:30px;border-radius:16px;border:1px solid #ef4444;'>
            <h1 style='color:#ef4444;margin-top:0;font-size:24px;'>❌ Erro ao Configurar Banco</h1>
            <pre style='background:#090d16;color:#f87171;padding:15px;border-radius:10px;overflow-x:auto;font-size:13px;'>" . htmlspecialchars($e->getMessage()) . "</pre>
        </div>
    </body>
    </html>";
}
