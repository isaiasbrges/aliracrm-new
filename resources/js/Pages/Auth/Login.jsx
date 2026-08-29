import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Sparkles, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, Store, Building2 } from 'lucide-react';

export default function Login({ targetStore }) {
    const isStoreLogin = !!targetStore;
    const accentColor = targetStore?.accent_color || '#2563eb';

    const { data, setData, post, processing, errors } = useForm({
        email: 'demo@alira.local',
        password: 'demo12345',
        remember: true,
        store_slug: targetStore?.slug || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const endpoint = isStoreLogin ? `/loja/${targetStore.slug}/login` : '/login';
        post(endpoint);
    };

    const handleFillDemo = () => {
        setData({
            email: 'demo@alira.local',
            password: 'demo12345',
            remember: true,
            store_slug: targetStore?.slug || '',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1329] to-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
            <Head title={isStoreLogin ? `Entrar - ${targetStore.name}` : 'Entrar no Alira CRM'} />

            {/* Glowing background shapes */}
            <div
                className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: accentColor }}
            />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    {isStoreLogin ? (
                        <div>
                            {targetStore.logo_url ? (
                                <img
                                    src={targetStore.logo_url}
                                    alt={targetStore.name}
                                    className="w-16 h-16 rounded-2xl object-contain bg-white p-2 mx-auto shadow-xl mb-3 border border-white/20"
                                />
                            ) : (
                                <div
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white shadow-xl mb-3 border border-white/20"
                                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
                                >
                                    <Store className="w-8 h-8" />
                                </div>
                            )}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold mb-2">
                                <Building2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
                                <span>Acesso Exclusivo à Filial</span>
                            </div>
                            <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
                                {targetStore.name}
                            </h1>
                            <p className="text-slate-400 text-xs mt-1">
                                Entre com seu usuário para operar esta loja.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/30 animate-in zoom-in-95 duration-500">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <h1 className="font-['Space_Grotesk'] text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                                Alira <span className="text-xs uppercase font-extrabold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-lg font-sans">CRM</span>
                            </h1>
                            <p className="text-slate-400 text-sm mt-2">
                                Painel Master Multi-Store & Central de Vendas
                            </p>
                        </div>
                    )}
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl">
                    {/* Demo Account Indicator */}
                    <div
                        onClick={handleFillDemo}
                        className="mb-6 p-3 rounded-2xl bg-blue-950/60 border border-blue-500/30 hover:border-blue-500/60 flex items-center justify-between cursor-pointer transition-all duration-200 group"
                    >
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <p className="text-xs font-semibold text-blue-300">Ambiente de Demonstração</p>
                                <p className="text-[11px] text-slate-400">Clique para preencher: demo@alira.local</p>
                            </div>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-400 bg-blue-900/50 px-2 py-1 rounded-lg border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            Usar Demo
                        </span>
                    </div>

                    {errors?.email && (
                        <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{errors.email}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                E-mail de Acesso
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    placeholder="seu.email@empresa.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                />
                                Manter conectado
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 flex items-center justify-center gap-2 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-98 disabled:opacity-50"
                            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
                        >
                            {processing ? (
                                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isStoreLogin ? `Entrar em ${targetStore.name}` : 'Acessar Painel Master'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {isStoreLogin ? (
                        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
                            <Link
                                href="/login"
                                className="text-xs text-slate-400 hover:text-blue-400 transition"
                            >
                                ← Entrar pelo Painel Master Geral
                            </Link>
                        </div>
                    ) : null}
                </div>

                {/* Footer Info */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    Alira CRM & Omnichannel · Multi-Store Architecture
                </p>
            </div>
        </div>
    );
}
