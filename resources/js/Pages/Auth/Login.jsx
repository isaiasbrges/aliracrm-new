import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Sparkles, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: 'demo@alira.local',
        password: 'demo12345',
        remember: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    const handleFillDemo = () => {
        setData({
            email: 'demo@alira.local',
            password: 'demo12345',
            remember: true,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1329] to-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
            <Head title="Entrar no Alira CRM" />

            {/* Glowing background shapes */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/30 animate-in zoom-in-95 duration-500">
                        <Sparkles className="w-7 h-7" />
                    </div>
                    <h1 className="font-['Space_Grotesk'] text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                        Alira <span className="text-xs uppercase font-extrabold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-lg font-sans">CRM</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">
                        Acesse o workspace de vendas e atendimento da sua loja.
                    </p>
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
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-98 disabled:opacity-50"
                        >
                            {processing ? (
                                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Acessar Painel</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    Alira CRM & Omnichannel · Multi-Tenant Architecture
                </p>
            </div>
        </div>
    );
}
