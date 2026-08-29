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
    ArrowRightLeft,
    Check,
    X,
    Copy,
    ExternalLink,
    Globe,
    Lock,
    Link2,
} from 'lucide-react';

/* ── Paleta de cores sugeridas ── */
const PRESET_COLORS = [
    { label: 'Azul Royal',    value: '#2563eb' },
    { label: 'Anil',          value: '#4f46e5' },
    { label: 'Violeta',       value: '#7c3aed' },
    { label: 'Rosa Fúcsia',   value: '#db2777' },
    { label: 'Vermelho',      value: '#dc2626' },
    { label: 'Laranja',       value: '#ea580c' },
    { label: 'Âmbar',         value: '#d97706' },
    { label: 'Esmeralda',     value: '#059669' },
    { label: 'Ciano',         value: '#0891b2' },
    { label: 'Slate',         value: '#475569' },
    { label: 'Rosa Quente',   value: '#e11d48' },
    { label: 'Lima',          value: '#65a30d' },
];

/* ── Preview da sidebar com a cor escolhida ── */
function SidebarPreview({ color, logoUrl, logoPreview, storeName }) {
    const bg = color || '#2563eb';

    return (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg select-none" style={{ width: 180 }}>
            <div className="flex flex-col" style={{ background: '#09132b', minHeight: 280 }}>
                {/* Brand */}
                <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
                    {logoPreview || logoUrl ? (
                        <img
                            src={logoPreview || logoUrl}
                            alt="Logo"
                            className="w-7 h-7 rounded-lg object-contain bg-white p-0.5"
                        />
                    ) : (
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow"
                            style={{ background: bg }}
                        >
                            <Sparkles className="w-4 h-4" />
                        </div>
                    )}
                    <span className="text-white font-bold text-xs truncate">{storeName || 'Minha Loja'}</span>
                </div>

                {/* Nav items mock */}
                <div className="flex-1 px-2 py-2 space-y-1">
                    {['Dashboard', 'Funil', 'WhatsApp', 'Clientes'].map((item, i) => (
                        <div
                            key={item}
                            className="rounded-lg px-2 py-1.5 text-[11px] font-semibold flex items-center gap-2"
                            style={
                                i === 0
                                    ? { background: bg, color: '#fff' }
                                    : { color: '#94a3b8' }
                            }
                        >
                            <div className="w-2 h-2 rounded-full" style={i === 0 ? { background: '#fff' } : { background: '#475569' }} />
                            {item}
                        </div>
                    ))}
                </div>

                {/* CTA mock */}
                <div className="p-2 mx-2 mb-2 rounded-xl border border-white/10 text-center">
                    <div
                        className="text-white text-[10px] font-bold rounded-lg py-1.5 mt-1"
                        style={{ background: bg }}
                    >
                        + Nova Venda
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StoreSettings({ store, organization, stores = [] }) {
    const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'identity'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);
    const fileRef = useRef(null);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aliracrm.site';

    // Form para atualizar loja atual
    const { data, setData, post, processing, errors, reset } = useForm({
        name: store.name || '',
        accent_color: store.accent_color || '#2563eb',
        logo: null,
        remove_logo: false,
    });

    // Form para criar nova loja
    const newStoreForm = useForm({
        name: '',
        accent_color: '#2563eb',
        logo: null,
    });

    const handleCopy = (text, key) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 3000);
        }
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('logo', file);
        setRemoveLogo(false);
        setData('remove_logo', false);
        const reader = new FileReader();
        reader.onload = (ev) => setLogoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setData('logo', null);
        setData('remove_logo', true);
        setRemoveLogo(true);
        setLogoPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/configuracoes/loja', {
            forceFormData: true,
        });
    };

    const handleCreateStore = (e) => {
        e.preventDefault();
        newStoreForm.post('/lojas/nova', {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                newStoreForm.reset();
            },
        });
    };

    const handleSwitchStore = (storeId) => {
        router.post(`/lojas/${storeId}/alternar`);
    };

    const currentLogo = removeLogo ? null : (logoPreview || store.logo_url);

    return (
        <AppLayout title="Configurações e Gestão de Lojas">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Organização: <b className="text-slate-800">{organization?.name || 'Alira CRM'}</b></span>
                    </div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Administração & Multi-Lojas
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Links de acesso individuais de cada loja, login exclusivo e gestão centralizada.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        + Criar Nova Loja / Filial
                    </button>
                </div>
            </div>

            {/* Master Multi-Store Banner */}
            <div className="mb-6 p-4.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 block">
                            Link Master · Painel Administrador Geral Multi-Store
                        </span>
                        <p className="text-xs text-slate-300 font-mono mt-0.5 select-all">
                            {baseUrl}/admin
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => handleCopy(`${baseUrl}/admin`, 'master')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition active:scale-95"
                    >
                        {copiedKey === 'master' ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copiado!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Link Master</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('stores')}
                    className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'stores'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Store className="w-4 h-4" />
                    Lojas & Links da Rede ({stores.length})
                </button>
                <button
                    onClick={() => setActiveTab('identity')}
                    className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'identity'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Palette className="w-4 h-4" />
                    Identidade Visual da Loja Ativa ({store.name})
                </button>
            </div>

            {/* ──────────────── TAB 1: LISTA DE LOJAS & LINKS ──────────────── */}
            {activeTab === 'stores' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {stores.map((s) => {
                            const isCurrent = s.is_current;
                            const directUrl = `${baseUrl}/loja/${s.slug}`;
                            const loginUrl = `${baseUrl}/loja/${s.slug}/login`;

                            return (
                                <div
                                    key={s.id}
                                    className={`bg-white rounded-3xl p-5 border transition-all relative flex flex-col justify-between ${
                                        isCurrent
                                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                                            : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
                                    }`}
                                >
                                    <div>
                                        {/* Store Header */}
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                {s.logo_url ? (
                                                    <img
                                                        src={s.logo_url}
                                                        alt={s.name}
                                                        className="w-12 h-12 rounded-2xl object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0"
                                                        style={{ background: s.accent_color || '#2563eb' }}
                                                    >
                                                        <Store className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                                        {s.name}
                                                    </h3>
                                                    <span className="text-[11px] font-mono text-slate-400">
                                                        /loja/{s.slug}
                                                    </span>
                                                </div>
                                            </div>

                                            {isCurrent ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <Check className="w-3 h-3" /> Ativa Agora
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                                    Filial
                                                </span>
                                            )}
                                        </div>

                                        {/* Links Box */}
                                        <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
                                            {/* Link Direto */}
                                            <div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                                                    <span className="font-semibold flex items-center gap-1">
                                                        <Link2 className="w-3 h-3 text-blue-600" /> Link de Acesso Direto:
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(directUrl, `direct-${s.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold"
                                                    >
                                                        {copiedKey === `direct-${s.id}` ? 'Copiado!' : 'Copiar'}
                                                    </button>
                                                </div>
                                                <div className="font-mono text-[11px] text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200/60 truncate flex items-center justify-between">
                                                    <span className="truncate">{directUrl}</span>
                                                    <a
                                                        href={directUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-slate-400 hover:text-blue-600 ml-1.5 shrink-0"
                                                        title="Abrir em nova aba"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Link Login Exclusivo */}
                                            <div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                                                    <span className="font-semibold flex items-center gap-1">
                                                        <Lock className="w-3 h-3 text-indigo-600" /> Link de Login da Loja:
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(loginUrl, `login-${s.id}`)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                                                    >
                                                        {copiedKey === `login-${s.id}` ? 'Copiado!' : 'Copiar'}
                                                    </button>
                                                </div>
                                                <div className="font-mono text-[11px] text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200/60 truncate flex items-center justify-between">
                                                    <span className="truncate">{loginUrl}</span>
                                                    <a
                                                        href={loginUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-slate-400 hover:text-indigo-600 ml-1.5 shrink-0"
                                                        title="Abrir em nova aba"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Store Metrics */}
                                        <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-slate-100 text-center my-2">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-semibold block">VENDAS</span>
                                                <span className="text-xs font-bold text-slate-800 font-['Space_Grotesk']">
                                                    {s.sales_count || 0}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-semibold block">PRODUTOS</span>
                                                <span className="text-xs font-bold text-slate-800 font-['Space_Grotesk']">
                                                    {s.products_count || 0}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-semibold block">CLIENTES</span>
                                                <span className="text-xs font-bold text-slate-800 font-['Space_Grotesk']">
                                                    {s.customers_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="pt-2 flex items-center justify-between gap-2">
                                        {isCurrent ? (
                                            <button
                                                onClick={() => setActiveTab('identity')}
                                                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                            >
                                                Editar Identidade & Logo
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSwitchStore(s.id)}
                                                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                                            >
                                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                                Alternar para esta Loja
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ──────────────── TAB 2: IDENTIDADE VISUAL ──────────────── */}
            {activeTab === 'identity' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
                        {/* Nome da Loja */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nome da Loja Ativa *
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Ex: Loja Jardins (Matriz)"
                                required
                                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                            />
                            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                        </div>

                        {/* Logo Upload Card */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-slate-100 rounded-xl">
                                    <Store className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">Logo da Loja</h2>
                                    <p className="text-xs text-slate-500">PNG, JPG, SVG ou WebP — máx. 2 MB</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5">
                                <div className="shrink-0">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                                        {currentLogo ? (
                                            <img
                                                src={currentLogo}
                                                alt="Logo atual"
                                                className="w-full h-full object-contain p-2"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-slate-400">
                                                <ImageOff className="w-8 h-8" />
                                                <span className="text-[10px] font-medium">Sem logo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                        onChange={handleFile}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 transition"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Escolher arquivo
                                    </label>

                                    {currentLogo && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="ml-2 inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-semibold transition"
                                        >
                                            <ImageOff className="w-3.5 h-3.5" />
                                            Remover logo
                                        </button>
                                    )}

                                    {data.logo && (
                                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {data.logo.name}
                                        </p>
                                    )}
                                    {errors.logo && (
                                        <p className="text-xs text-rose-500">{errors.logo}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Color Card */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-slate-100 rounded-xl">
                                    <Palette className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">Cor Principal</h2>
                                    <p className="text-xs text-slate-500">Define a cor dos botões, links ativos e elementos de destaque</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mb-5">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        title={preset.label}
                                        onClick={() => setData('accent_color', preset.value)}
                                        className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 shadow-sm ${
                                            data.accent_color === preset.value
                                                ? 'border-white ring-2 ring-offset-2 scale-110'
                                                : 'border-transparent'
                                        }`}
                                        style={{
                                            background: preset.value,
                                            ringColor: preset.value,
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 flex-1 max-w-xs">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={data.accent_color}
                                            onChange={(e) => setData('accent_color', e.target.value)}
                                            className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                                            title="Cor personalizada"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                                            Hex
                                        </label>
                                        <input
                                            type="text"
                                            value={data.accent_color}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setData('accent_color', v);
                                            }}
                                            className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="#2563eb"
                                        />
                                        {errors.accent_color && (
                                            <p className="text-xs text-rose-500 mt-1">{errors.accent_color}</p>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="w-12 h-12 rounded-xl shadow-md border border-white/20"
                                    style={{ background: data.accent_color }}
                                    title="Prévia da cor"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-98 disabled:opacity-60"
                                style={{ background: data.accent_color }}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {processing ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { reset(); setLogoPreview(null); setRemoveLogo(false); }}
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Resetar
                            </button>
                        </div>
                    </form>

                    {/* ── Live Preview ── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-5">
                                    <Eye className="w-4 h-4 text-slate-500" />
                                    <h3 className="font-bold text-slate-800 font-['Space_Grotesk'] text-sm">
                                        Prévia em Tempo Real
                                    </h3>
                                </div>
                                <div className="flex justify-center">
                                    <SidebarPreview
                                        color={data.accent_color}
                                        logoUrl={store.logo_url}
                                        logoPreview={removeLogo ? null : logoPreview}
                                        storeName={data.name || store.name}
                                    />
                                </div>
                                <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
                                    Prévia da barra lateral da sua loja. O sistema inteiro refletirá estas cores.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: CRIAR NOVA LOJA / FILIAL ── */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg">
                                        Cadastrar Nova Loja / Filial
                                    </h3>
                                    <p className="text-xs text-slate-400">Adicione uma nova unidade para a rede {organization?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStore} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nome da Nova Loja *
                                </label>
                                <input
                                    type="text"
                                    value={newStoreForm.data.name}
                                    onChange={(e) => newStoreForm.setData('name', e.target.value)}
                                    placeholder="Ex: Loja Shopping Iguatemi, Filial Centro, E-commerce..."
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {newStoreForm.errors.name && <p className="text-xs text-rose-500 mt-1">{newStoreForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Cor de Destaque da Loja
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newStoreForm.data.accent_color}
                                        onChange={(e) => newStoreForm.setData('accent_color', e.target.value)}
                                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={newStoreForm.data.accent_color}
                                        onChange={(e) => newStoreForm.setData('accent_color', e.target.value)}
                                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={newStoreForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
                                >
                                    {newStoreForm.processing ? 'Criando...' : 'Criar e Ativar Loja'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
