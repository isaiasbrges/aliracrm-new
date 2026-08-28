<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

define('LARAVEL_START', microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/html; charset=utf-8');

try {
    Artisan::call('migrate', ['--force' => true]);
    $migrateOutput = Artisan::output();

    Artisan::call('db:seed', ['--force' => true]);
    $seedOutput = Artisan::output();

    echo "<!DOCTYPE html>
    <html>
    <head><title>Alira CRM - Setup Banco</title></head>
    <body style='font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;'>
        <div style='max-width:800px;margin:0 auto;background:#1e293b;padding:30px;border-radius:12px;border:1px solid #334155;'>
            <h1 style='color:#38bdf8;margin-top:0;'>🚀 Banco de Dados Criado com Sucesso!</h1>
            <p>Todas as tabelas e dados iniciais foram criados no PostgreSQL.</p>
            <pre style='background:#090d16;color:#4ade80;padding:15px;border-radius:8px;overflow-x:auto;font-size:13px;'>{$migrateOutput}\n{$seedOutput}</pre>
            <div style='margin-top:25px;'>
                <a href='/login' style='background:#38bdf8;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;'>Ir para a Tela de Login &rarr;</a>
            </div>
            <div style='margin-top:20px;padding:15px;background:#090d16;border-radius:8px;font-size:14px;'>
                <strong>Credenciais de Acesso:</strong><br>
                Email: <code style='color:#fbbf24;'>demo@alira.local</code><br>
                Senha: <code style='color:#fbbf24;'>demo12345</code>
            </div>
        </div>
    </body>
    </html>";
} catch (\Throwable $e) {
    echo "<!DOCTYPE html>
    <html>
    <head><title>Alira CRM - Erro no Setup</title></head>
    <body style='font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;'>
        <div style='max-width:800px;margin:0 auto;background:#1e293b;padding:30px;border-radius:12px;border:1px solid #ef4444;'>
            <h1 style='color:#ef4444;margin-top:0;'>❌ Erro ao Inicializar Banco</h1>
            <pre style='background:#090d16;color:#f87171;padding:15px;border-radius:8px;overflow-x:auto;font-size:13px;'>" . htmlspecialchars($e->getMessage()) . "\n\n" . htmlspecialchars($e->getTraceAsString()) . "</pre>
        </div>
    </body>
    </html>";
}
