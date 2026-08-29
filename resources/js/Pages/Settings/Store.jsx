import React, { useState, useRef } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Settings,
    Upload,
    Palette,
    ImageOff,
    CheckCircle2,
    RotateCcw,
    Store,
    Eye,
    Sparkles,
    Plus,
    Building2,
    Check,
    X,
    Copy,
    ExternalLink,
    Globe,
    Lock,
    Link2,
    MessageSquare,
    Radio,
    Terminal,
    Cpu,
    Workflow,
    HelpCircle,
    Zap,
    Send,
    AlertCircle,
} from 'lucide-react';

/* ── Paleta de cores sugeridas para lojas de moda e boutiques ── */
const PRESET_COLORS = [
    { label: 'Hot Pink (Referência)', value: '#ff007f' },
    { label: 'Rosa Dyvinuss',         value: '#db2777' },
    { label: 'Rosa Pink Fúcsia',      value: '#ec4899' },
    { label: 'Rosa Quente',           value: '#f43f5e' },
    { label: 'Violeta / Roxo',        value: '#7c3aed' },
    { label: 'Preto & Ouro Luxo',     value: '#0f172a' },
    { label: 'Vermelho Paixão',       value: '#dc2626' },
    { label: 'Esmeralda',             value: '#059669' },
    { label: 'Azul Royal',            value: '#2563eb' },
];

/* ── Preview da barra lateral e vitrine com a cor escolhida ── */
function SidebarPreview({ color, logoUrl, logoPreview, storeName }) {
    const bg = color || '#ff007f';

    return (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md select-none w-full max-w-[200px]">
            <div className="flex flex-col bg-slate-900 text-white" style={{ minHeight: 240 }}>
                {/* Brand Header */}
                <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
                    {logoPreview || logoUrl ? (
                        <img
                            src={logoPreview || logoUrl}
                            alt="Logo"
                            className="w-7 h-7 rounded-lg object-contain bg-white p-0.5"
                        />
                    ) : (
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs"
                            style={{ background: bg }}
                        >
                            DY
                        </div>
                    )}
                    <span className="text-white font-bold text-xs truncate">{storeName || 'Dyvinuss Looks'}</span>
                </div>

                {/* Nav items mock */}
                <div className="flex-1 px-2 py-2 space-y-1">
                    {['Dashboard', 'Catálogo Online', 'WhatsApp', 'Vendas & PDV'].map((item, i) => (
                        <div
                            key={item}
                            className="rounded-lg px-2 py-1 text-[10px] font-semibold flex items-center gap-1.5"
                            style={
                                i === 1
                                    ? { background: bg, color: '#fff' }
                                    : { color: '#94a3b8' }
                            }
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: i === 1 ? '#fff' : '#64748b' }} />
                            <span className="truncate">{item}</span>
                        </div>
                    ))}
                </div>

                {/* Footer preview */}
                <div className="px-3 py-2 border-t border-white/10">
                    <span className="text-[9px] text-slate-400">Identidade Visual Ativa</span>
                </div>
            </div>
        </div>
    );
}

export default function StoreSettings({ store, organization, stores, evolution, flash }) {
    const fileInputRef = useRef(null);
    const [logoPreview, setLogoPreview] = useState(store?.logo_url || null);
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [webhookTestResult, setWebhookTestResult] = useState(null);

    const { data, setData, post, processing, errors, reset, isDirty } = useForm({
        name:                         store?.name || '',
        accent_color:                 store?.accent_color || '#ff007f',
        logo:                         null,
        logo_url:                     store?.logo_url || '',
        remove_logo:                  false,
        external_pos_webhook_enabled: store?.external_pos_webhook_enabled || false,
        external_pos_webhook_url:     store?.external_pos_webhook_url || '',
        external_pos_webhook_secret:  store?.external_pos_webhook_secret || '',
    });

    const handleColorChange = (color) => {
        let clean = (color || '').trim();
        if (clean && !clean.startsWith('#')) {
            clean = '#' + clean;
        }
        setData('accent_color', clean);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo', file);
            setData('remove_logo', false);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveLogo = () => {
        setData('logo', null);
        setData('logo_url', '');
        setData('remove_logo', true);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/configuracoes/loja', {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const handleTestWebhook = async () => {
        if (!data.external_pos_webhook_url) {
            alert('Por favor, informe a URL do webhook do seu PDV externo primeiro.');
            return;
        }

        setTestingWebhook(true);
        setWebhookTestResult(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/configuracoes/loja/test-webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    url: data.external_pos_webhook_url,
                    secret: data.external_pos_webhook_secret,
                }),
            });

            const json = await res.json();
            setWebhookTestResult(json);
        } catch (err) {
            setWebhookTestResult({
                success: false,
                message: 'Erro ao tentar disparar o teste: ' + err.message,
            });
        } finally {
            setTestingWebhook(false);
        }
    };

    return (
        <AppLayout title="Configurações da Loja & PDV">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* ── Header da Página ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                            Configurações da Loja
                            <span className="p-1 rounded-md bg-pink-100 text-pink-700 text-xs font-sans font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                Personalização & Webhooks
                            </span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                            Gerencie o logo da loja, cores da marca e integre com seu PDV externo via Webhook.
                        </p>
                    </div>

                    <a
                        href="/catalogo"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs w-fit"
                    >
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Ver Catálogo da Loja</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ── CARD 1: IDENTIDADE VISUAL (LOGO & CORES) ── */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
                        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
                            <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#ff007f] flex items-center justify-center font-bold">
                                <Palette className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-base">Identidade Visual da Loja</h2>
                                <p className="text-xs text-slate-500">Logo e paleta de cores aplicadas no sistema e no catálogo público.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Formulário de Logo & Cores */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Nome da Loja */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Nome da Loja *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full text-xs sm:text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition"
                                        placeholder="Ex: Dyvinuss Looks"
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                                </div>

                                {/* Logo da Loja */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                        Logo da Loja
                                    </label>

                                    <div className="flex items-start gap-4">
                                        {logoPreview ? (
                                            <div className="w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 shrink-0 shadow-xs relative group">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition shrink-0 bg-slate-50"
                                            >
                                                <Upload className="w-5 h-5 mb-1" />
                                                <span className="text-[9px] font-bold">Upload</span>
                                            </div>
                                        )}

                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                Escolher Imagem do Computador
                                            </button>
                                            <input
                                                type="url"
                                                value={data.logo_url}
                                                onChange={(e) => {
                                                    setData('logo_url', e.target.value);
                                                    setLogoPreview(e.target.value);
                                                }}
                                                placeholder="Ou cole a URL da imagem da Logo..."
                                                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            />
                                            {errors.logo && <p className="text-xs text-rose-600 mt-1">{errors.logo}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Cor de Destaque da Loja */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                        Cor de Destaque da Marca (Navbar, Botões e Destaques) *
                                    </label>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
                                        {PRESET_COLORS.map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => handleColorChange(preset.value)}
                                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                                                    data.accent_color.toLowerCase() === preset.value.toLowerCase()
                                                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                                                        : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span
                                                    className="w-4 h-4 rounded-full shadow-xs shrink-0"
                                                    style={{ backgroundColor: preset.value }}
                                                />
                                                <span className="truncate">{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={data.accent_color.startsWith('#') && data.accent_color.length === 7 ? data.accent_color : '#ff007f'}
                                                onChange={(e) => handleColorChange(e.target.value)}
                                                className="w-11 h-11 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs"
                                                title="Clique para abrir a paleta de cores"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                Código Hexadecimal:
                                            </label>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-slate-800 transition">
                                                <span className="text-xs font-mono font-bold text-slate-400">#</span>
                                                <input
                                                    type="text"
                                                    value={data.accent_color.replace(/^#/, '')}
                                                    onChange={(e) => handleColorChange(e.target.value)}
                                                    placeholder="ff007f"
                                                    maxLength={7}
                                                    className="w-full font-mono text-xs font-bold uppercase text-slate-900 bg-transparent outline-none tracking-wider"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {errors.accent_color && <p className="text-xs text-rose-600 mt-1">{errors.accent_color}</p>}
                                </div>
                            </div>

                            {/* Mini Preview em Tempo Real */}
                            <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                                <span className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
                                    Preview da Identidade:
                                </span>
                                <SidebarPreview
                                    color={data.accent_color}
                                    logoUrl={store?.logo_url}
                                    logoPreview={logoPreview}
                                    storeName={data.name}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── CARD 2: WEBHOOK DE PDV EXTERNO (OPCIONAL & DESABILITÁVEL) ── */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Workflow className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-base">Integração PDV Externo (Webhook)</h2>
                                    <p className="text-xs text-slate-500">
                                        Envie automaticamente todas as vendas finalizadas no Alira para o seu sistema de PDV externo.
                                    </p>
                                </div>
                            </div>

                            {/* Toggle Desabilitável */}
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.external_pos_webhook_enabled}
                                    onChange={(e) => setData('external_pos_webhook_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                <span className="ml-3 text-xs font-bold text-slate-700">
                                    {data.external_pos_webhook_enabled ? (
                                        <span className="text-emerald-700 font-bold">🟢 Webhook Ativo</span>
                                    ) : (
                                        <span className="text-slate-400 font-medium">⚪ Desabilitado</span>
                                    )}
                                </span>
                            </label>
                        </div>

                        {data.external_pos_webhook_enabled ? (
                            <div className="space-y-4 animate-in fade-in-50 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* URL do Webhook */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                            URL do Endpoint do PDV Externo *
                                        </label>
                                        <input
                                            type="url"
                                            value={data.external_pos_webhook_url}
                                            onChange={(e) => setData('external_pos_webhook_url', e.target.value)}
                                            placeholder="https://meupdvexterno.com.br/api/vendas/webhook"
                                            required={data.external_pos_webhook_enabled}
                                            className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition"
                                        />
                                        {errors.external_pos_webhook_url && (
                                            <p className="text-xs text-rose-600 mt-1">{errors.external_pos_webhook_url}</p>
                                        )}
                                    </div>

                                    {/* Token / Secret de Autenticação */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                            Token / Secret de Autenticação (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.external_pos_webhook_secret}
                                            onChange={(e) => setData('external_pos_webhook_secret', e.target.value)}
                                            placeholder="Ex: secret-key-pdv-2026"
                                            className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition"
                                        />
                                    </div>
                                </div>

                                {/* Botão Testar Webhook */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="text-xs text-slate-600">
                                        <p className="font-bold text-slate-800">Testar Conexão com o PDV:</p>
                                        <p className="text-[11px] text-slate-500">
                                            Envia um evento simulado <code>pos.sale.test_ping</code> para validar a recepção no seu PDV.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleTestWebhook}
                                        disabled={testingWebhook || !data.external_pos_webhook_url}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 shrink-0"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        {testingWebhook ? 'Testando...' : '🚀 Testar Envio de Webhook'}
                                    </button>
                                </div>

                                {/* Resultado do Teste de Webhook */}
                                {webhookTestResult && (
                                    <div
                                        className={`p-3.5 rounded-2xl border text-xs font-medium ${
                                            webhookTestResult.success
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                : 'bg-rose-50 border-rose-200 text-rose-800'
                                        }`}
                                    >
                                        <p className="font-bold flex items-center gap-1.5">
                                            {webhookTestResult.success ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                            )}
                                            {webhookTestResult.message}
                                        </p>
                                        {webhookTestResult.status_code && (
                                            <p className="text-[11px] mt-1 font-mono">
                                                Status HTTP: {webhookTestResult.status_code}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                A sincronização com webhook de PDV externo está desativada no momento. Ative a chave acima para configurar a URL.
                            </div>
                        )}
                    </div>

                    {/* ── BOTÃO PRINCIPAL DE SALVAR ── */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-3 rounded-2xl bg-[#ff007f] hover:bg-[#e11d48] text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-600/20 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            {processing ? 'Salvando Alterações...' : 'Salvar Todas as Configurações'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
