@extends('layouts.app', ['title' => 'Clientes · Alira CRM'])

@section('content')
<div class="page-heading">
    <div>
        <h1>Gestão de Clientes & Contatos</h1>
        <p class="lede">Histórico comercial, segmentação RFM e consentimento de WhatsApp.</p>
    </div>
    <button class="button" onclick="document.getElementById('formNovoCliente').scrollIntoView({behavior:'smooth'})">
        + Novo Cliente
    </button>
</div>

<!-- Métricas de Clientes -->
<div class="grid grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
    <div class="card">
        <span class="metric-label">Total de Clientes</span>
        <div class="metric-value">{{ $metrics['total'] }}</div>
        <div class="metric-note">Base cadastrada na loja</div>
    </div>
    <div class="card">
        <span class="metric-label">Com Consentimento WhatsApp</span>
        <div class="metric-value" style="color: #10b981;">{{ $metrics['with_consent'] }}</div>
        <div class="metric-note">Autorizados para campanhas e avisos</div>
    </div>
    <div class="card">
        <span class="metric-label">LTV Total Acumulado</span>
        <div class="metric-value" style="color: #2563eb;">R$ {{ number_format($metrics['total_spent'], 2, ',', '.') }}</div>
        <div class="metric-note">Volume financeiro gerado</div>
    </div>
</div>

<div class="grid grid-2" style="align-items: start; gap: 24px;">
    <!-- Lista de Clientes -->
    <div class="card">
        <div class="section-header">
            <h3>Clientes Cadastrados</h3>
            <form method="GET" action="{{ route('customers.index') }}">
                <input type="text" name="search" placeholder="🔍 Buscar por nome, WhatsApp ou cidade..." value="{{ $search }}" style="border: 1px solid var(--line); border-radius: 9px; padding: 6px 12px; font-size: 13px; min-width: 240px;">
            </form>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Cliente / WhatsApp</th>
                        <th>Segmento</th>
                        <th>Compras</th>
                        <th>Total Gasto</th>
                        <th style="text-align: right;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($customers as $customer)
                        <tr>
                            <td>
                                <strong><a href="{{ route('customers.show', $customer) }}" style="color: var(--ink);">{{ $customer->name }}</a></strong>
                                <small style="color: var(--muted); display: block;">📱 {{ $customer->whatsapp }}</small>
                            </td>
                            <td>
                                <span class="badge {{ $customer->segment['badge'] }}">
                                    {{ $customer->segment['icon'] }} {{ $customer->segment['label'] }}
                                </span>
                            </td>
                            <td>{{ $customer->total_purchases }}x</td>
                            <td><strong>R$ {{ number_format($customer->total_spent, 2, ',', '.') }}</strong></td>
                            <td style="text-align: right; white-space: nowrap;">
                                <a href="{{ route('customers.show', $customer) }}" class="button button-secondary" style="padding: 6px 10px; font-size: 12px;" title="Ver Perfil 360°">
                                    👤 Perfil
                                </a>
                                <a href="{{ route('sales.create', ['customer_id' => $customer->id]) }}" class="button" style="padding: 6px 10px; font-size: 12px;" title="Vender">
                                    🛍️
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" style="text-align: center; color: var(--muted); padding: 30px;">
                                Nenhum cliente encontrado.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div style="margin-top: 18px;">
            {{ $customers->links() }}
        </div>
    </div>

    <!-- Formulário de Cadastro -->
    <div class="card" id="formNovoCliente">
        <h3 style="margin-bottom: 16px;">Cadastrar Novo Cliente</h3>
        <form method="POST" action="{{ route('customers.store') }}">
            @csrf
            <div class="form-grid">
                <div class="field full">
                    <label for="name">Nome Completo</label>
                    <input id="name" name="name" type="text" value="{{ old('name') }}" placeholder="Ex: Maria da Silva" required>
                </div>
                <div class="field">
                    <label for="whatsapp">WhatsApp (DDD + Número)</label>
                    <input id="whatsapp" name="whatsapp" type="text" value="{{ old('whatsapp') }}" placeholder="Ex: 11999999999" required>
                </div>
                <div class="field">
                    <label for="email">E-mail</label>
                    <input id="email" name="email" type="email" value="{{ old('email') }}" placeholder="cliente@exemplo.com">
                </div>
                <div class="field">
                    <label for="city">Cidade</label>
                    <input id="city" name="city" type="text" value="{{ old('city') }}" placeholder="São Paulo">
                </div>
                <div class="field">
                    <label for="state">UF</label>
                    <input id="state" name="state" type="text" maxlength="2" value="{{ old('state') }}" placeholder="SP" style="text-transform: uppercase;">
                </div>
                <div class="field full">
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer;">
                        <input name="whatsapp_consent" type="checkbox" value="1" {{ old('whatsapp_consent', true) ? 'checked' : '' }}>
                        <span>Cliente concorda em receber atualizações e comprovantes via WhatsApp</span>
                    </label>
                </div>
            </div>

            <div style="margin-top: 18px; text-align: right;">
                <button class="button" type="submit">Salvar Cliente</button>
            </div>
        </form>
    </div>
</div>
@endsection
