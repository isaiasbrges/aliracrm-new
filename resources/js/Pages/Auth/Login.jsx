import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Sparkles, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, ShoppingBag, Store, Building2 } from 'lucide-react';

export default function Login({ targetStore }) {
    const storeName = targetStore?.name || 'Dyvinuss Looks';
    const storeSlug = targetStore?.slug || 'dyvinuss-looks';
    const accentColor = targetStore?.accent_color || '#db2777';

    const { data, setData, post, processing, errors } = useForm({
        email: 'demo@alira.local',
        password: 'demo12345',
        remember: true,
        store_slug: storeSlug,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const endpoint = targetStore ? `/loja/${storeSlug}/login` : '/login';
        post(endpoint);
    };

    const handleFillDemo = () => {
        setData({
            email: 'demo@alira.local',
            password: 'demo12345',
            remember: true,
            store_slug: storeSlug,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#150a1d] to-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-pink-600 selection:text-white relative overflow-hidden font-sans">
            <Head title={`Entrar · ${storeName}`} />

            {/* Glowing background ambient shapes in Dyvinuss Pink */}
            <div
                className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30 animate-pulse duration-1000"
                style={{ background: accentColor }}
            />
            <div
                className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #9333ea)` }}
            />

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Brand Header */}
                <div className="text-center mb-7">
                    {targetStore?.logo_url ? (
                        <img
                            src={targetStore.logo_url}
                            alt={storeName}
                            className="w-20 h-20 rounded-3xl object-contain bg-white/10 backdrop-blur-md p-3 mx-auto shadow-2xl shadow-pink-500/20 mb-3 border border-pink-500/30"
                        />
                    ) : (
                        <div
                            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-white shadow-2xl mb-3 border border-pink-400/40 relative group transform hover:scale-105 transition-all duration-300"
                            style={{
                                background: `linear-gradient(135deg, ${accentColor}, #f43f5e)`,
                                boxShadow: `0 20px 40px -10px ${accentColor}55`,
                            }}
                        >
                            <span className="font-['Space_Grotesk'] text-2xl font-extrabold tracking-wider">
                                DY
                            </span>
                            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white text-pink-600 flex items-center justify-center shadow-md">
                                <Sparkles className="w-3.5 h-3.5 fill-pink-500" />
                            </div>
                        </div>
                    )}

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Acesso Exclusivo à Loja</span>
                    </div>

                    <h1 className="font-['Space_Grotesk'] text-3xl font-extrabold text-white tracking-tight">
                        {storeName}
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Central de Vendas, WhatsApp & Atendimento VIP
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/85 backdrop-blur-2xl border border-pink-500/20 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
                    {/* Top glowing line in brand color */}
                    <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
                    />

                    {/* Demo Account Quick-Fill Helper */}
                    <div
                        onClick={handleFillDemo}
                        className="mb-6 p-3 rounded-2xl bg-pink-950/40 border border-pink-500/30 hover:border-pink-500/70 hover:bg-pink-950/70 flex items-center justify-between cursor-pointer transition-all duration-200 group"
                        title="Clique para preencher os dados de teste"
                    >
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <p className="text-xs font-semibold text-pink-200">Acesso Administrador Dyvinuss</p>
                                <p className="text-[11px] text-slate-400">demo@alira.local · demo12345</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-md group-hover:bg-pink-500 group-hover:text-white transition-colors">
                            Preencher
                        </span>
                    </div>

                    {/* Global Error Banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                            <span>{errors.email || errors.password || errors.store_slug || 'Credenciais inválidas.'}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                E-mail de Acesso
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="seu.email@dyvinuss.com"
                                    required
                                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Senha Secreta
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs py-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 text-pink-600 focus:ring-pink-500/20 bg-slate-800"
                                />
                                <span>Lembrar meu login</span>
                            </label>
                            <span className="text-[11px] text-pink-400/80 hover:text-pink-300 cursor-pointer">
                                Esqueceu a senha?
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50"
                            style={{
                                background: `linear-gradient(135deg, ${accentColor}, #f43f5e)`,
                                boxShadow: `0 10px 25px -5px ${accentColor}66`,
                            }}
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Autenticando...
                                </span>
                            ) : (
                                <>
                                    <span>Entrar no Painel Dyvinuss</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Security Badges */}
                <div className="mt-8 text-center text-xs text-slate-500 space-y-2">
                    <div className="flex items-center justify-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Criptografia TLS/SSL Ativa
                        </span>
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-pink-500" />
                            WhatsApp Integrado
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                        Dyvinuss Looks · Alira CRM Engine © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
