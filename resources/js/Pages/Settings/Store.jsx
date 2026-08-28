import React, { useState, useRef } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
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

/* ── Utilitário: cor hex → rgb para CSS ── */
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
}

/* ── Preview da sidebar com a cor escolhida ── */
function SidebarPreview({ color, logoUrl, logoPreview, storeName }) {
    const bg = color || '#2563eb';

    return (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg select-none" style={{ width: 180 }}>
            {/* Sidebar mock */}
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
                    <span className="text-white font-bold text-sm">{storeName || 'Minha Loja'}</span>
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

export default function StoreSettings({ store }) {
    const [logoPreview, setLogoPreview] = useState(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const fileRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        accent_color: store.accent_color || '#2563eb',
        logo: null,
        remove_logo: false,
        _method: 'POST',
    });

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

    const currentLogo = removeLogo ? null : (logoPreview || store.logo_url);

    return (
        <AppLayout title="Configurações da Loja">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        Configurações
                    </div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight">
                        Identidade Visual da Loja
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Personalize o logo e a cor principal do sistema para refletir a sua marca.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

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
                            {/* Preview box */}
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

                            {/* Upload controls */}
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

                        {/* Color Presets */}
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

                        {/* Custom color picker + hex input */}
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

                            {/* Color swatch big */}
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
                            {processing ? 'Salvando...' : 'Salvar Configurações'}
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
                                    storeName={store.name}
                                />
                            </div>
                            <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
                                Prévia da sidebar lateral com sua cor e logo. O sistema inteiro irá refletir estas configurações.
                            </p>
                        </div>

                        {/* Color info card */}
                        <div
                            className="mt-4 rounded-2xl p-4 text-white text-sm font-semibold shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${data.accent_color}, ${data.accent_color}cc)`,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4" />
                                Cor selecionada
                            </div>
                            <p className="font-mono text-lg font-bold tracking-wider opacity-90">
                                {data.accent_color.toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
