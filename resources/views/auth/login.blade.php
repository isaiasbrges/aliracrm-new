<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrar · Alira CRM</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <main class="login-shell">
        <section class="login-card" aria-labelledby="login-title">
            <a class="brand" href="{{ route('login') }}">alira<span>crm</span></a>
            <h1 id="login-title">Bem-vindo de volta</h1>
            <p class="lede">Acesse o workspace da sua loja.</p>

            @if ($errors->any())
                <div class="flash flash-error" role="alert" style="margin-top: 20px;">
                    {{ $errors->first() }}
                </div>
            @endif

            <form method="POST" action="{{ route('login.store') }}">
                @csrf
                <div class="field">
                    <label for="email">E-mail</label>
                    <input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required autofocus>
                </div>
                <div class="field">
                    <label for="password">Senha</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" required>
                </div>
                <label style="align-items:center; display:flex; gap:8px; font-size:13px;">
                    <input name="remember" type="checkbox" value="1"> Manter conectado
                </label>
                <button class="button" type="submit">Entrar</button>
            </form>
        </section>
    </main>
</body>
</html>
