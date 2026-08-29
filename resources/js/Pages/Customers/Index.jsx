import React, { useState } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Users,
    UserPlus,
    Search,
    Phone,
    Mail,
    MapPin,
    CheckCircle2,
    DollarSign,
    ArrowUpRight,
    X,
    MessageSquare,
    ShoppingBag
} from 'lucide-react';

export default function CustomersIndex({ customers, metrics, search }) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        whatsapp: '',
        email: '',
        city: '',
        state: '',
        whatsapp_consent: true,
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/clientes', { search: searchTerm }, { preserveState: true });
    };

    const handleCreateCustomer = (e) => {
        e.preventDefault();
        post('/clientes', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout title="Clientes & Visão 360°">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Base de Clientes & CRM
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Gerencie contatos, histórico de compras e autorizações de WhatsApp.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all transform active:scale-95 shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    + Novo Cliente
                </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total de Clientes
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
                        {metrics?.total || 0}
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Opt-in WhatsApp (LGPD)
                    </span>
                    <h3 className="text-2xl font-extrabold text-emerald-600 font-['Space_Grotesk'] mt-1">
                        {metrics?.with_consent || 0}
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        LTV Acumulado (Total Gasto)
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
                        {formatCurrency(metrics?.total_spent)}
                    </h3>
                </div>
            </div>

            {/* Search & Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Search Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome, WhatsApp, e-mail ou cidade..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                        />
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-3 px-4">Cliente</th>
                                <th className="py-3 px-4">Contato</th>
                                <th className="py-3 px-4">Cidade / UF</th>
                                <th className="py-3 px-4 text-center">Compras</th>
                                <th className="py-3 px-4 text-right">LTV (Gasto)</th>
                                <th className="py-3 px-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {customers?.data && customers.data.length > 0 ? (
                                customers.data.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                    {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'CL'}
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/clientes/${customer.id}`}
                                                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                                                    >
                                                        {customer.name}
                                                    </Link>
                                                    {customer.whatsapp_consent && (
                                                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                                            Consentimento WhatsApp
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <div className="space-y-0.5">
                                                <p className="font-mono text-slate-700 font-medium flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                                    {customer.whatsapp}
                                                </p>
                                                {customer.email && (
                                                    <p className="text-slate-400 text-[11px] truncate max-w-[180px] flex items-center gap-1">
                                                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                                        {customer.email}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-600">
                                            {customer.city ? `${customer.city}${customer.state ? ' / ' + customer.state : ''}` : '-'}
                                        </td>

                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                                                {customer.sales_count || 0}
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-['Space_Grotesk']">
                                            {formatCurrency(customer.total_spent)}
                                        </td>

                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/vendas/nova?customer_id=${customer.id}`}
                                                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Nova Venda para este cliente"
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/clientes/${customer.id}`}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold"
                                                    title="Ver Visão 360°"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-400">
                                        Nenhum cliente cadastrado ou encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {customers?.links && customers.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Mostrando {customers.from || 0} a {customers.to || 0} de {customers.total || 0} clientes
                        </span>
                        <div className="flex items-center gap-1">
                            {customers.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 rounded-lg border text-xs transition ${
                                        link.active
                                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Novo Cliente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    <UserPlus className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg">
                                    Cadastrar Novo Cliente
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Fernanda Lima"
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        WhatsApp com DDD *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.whatsapp}
                                        onChange={(e) => setData('whatsapp', e.target.value)}
                                        placeholder="5511999998888"
                                        required
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        E-mail
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="cliente@email.com"
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Cidade
                                    </label>
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="São Paulo"
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        UF (Estado)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="2"
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value.toUpperCase())}
                                        placeholder="SP"
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition uppercase"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={data.whatsapp_consent}
                                    onChange={(e) => setData('whatsapp_consent', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Cliente autorizou contato via WhatsApp (Opt-in LGPD)
                            </label>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Salvando...' : 'Salvar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
