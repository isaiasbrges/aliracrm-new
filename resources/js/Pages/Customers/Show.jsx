import React from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    ShoppingBag,
    MessageSquare,
    DollarSign,
    CheckCircle2,
    ArrowLeft,
    Clock,
    ArrowUpRight,
    Tag
} from 'lucide-react';

export default function CustomerShow({ customer }) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    return (
        <AppLayout title={`${customer.name} · Visão 360°`}>
            {/* Back Button & Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <Link
                        href="/clientes"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Voltar para Lista de Clientes
                    </Link>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        {customer.name}
                        {customer.whatsapp_consent && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> WhatsApp Opt-in
                            </span>
                        )}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/vendas/nova?customer_id=${customer.id}`}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition active:scale-95"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        + Nova Venda (PDV)
                    </Link>
                </div>
            </div>

            {/* Profile 360 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Card: Customer Info & Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                        <div className="flex items-center gap-3.5 pb-5 mb-5 border-b border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                                {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'CL'}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base truncate">
                                    {customer.name}
                                </h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.whatsapp}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" /> E-mail:
                                </span>
                                <span className="font-medium text-slate-800">{customer.email || 'Não informado'}</span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Localização:
                                </span>
                                <span className="font-medium text-slate-800">
                                    {customer.city ? `${customer.city} - ${customer.state || ''}` : 'Não informado'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Cliente desde:
                                </span>
                                <span className="font-medium text-slate-800">
                                    {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>

                        {/* Customer Metric Stats */}
                        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-100">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Gasto (LTV)</span>
                                <p className="text-base font-extrabold text-slate-900 font-['Space_Grotesk'] mt-0.5">
                                    {formatCurrency(customer.total_spent)}
                                </p>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total de Pedidos</span>
                                <p className="text-base font-extrabold text-slate-900 font-['Space_Grotesk'] mt-0.5">
                                    {customer.sales?.length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Deals in pipeline */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                        <h4 className="font-bold text-slate-900 font-['Space_Grotesk'] text-sm mb-3">
                            Oportunidades no Funil
                        </h4>
                        {customer.deals && customer.deals.length > 0 ? (
                            <div className="space-y-2.5">
                                {customer.deals.map((d) => (
                                    <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-800">{d.title}</p>
                                            <span className="text-[10px] text-blue-600 font-semibold capitalize">
                                                Etapa: {d.stage}
                                            </span>
                                        </div>
                                        <span className="font-extrabold text-slate-900 font-['Space_Grotesk']">
                                            {formatCurrency(d.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">Nenhuma oportunidade ativa no momento.</p>
                        )}
                    </div>
                </div>

                {/* Right Area: Purchase History & Conversations (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Sales History Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                    Histórico de Compras
                                </h3>
                                <p className="text-xs text-slate-500">Todos os pedidos realizados pelo cliente</p>
                            </div>
                        </div>

                        {customer.sales && customer.sales.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {customer.sales.map((sale) => (
                                    <div key={sale.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-slate-900">
                                                    Pedido #{sale.number}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                    {sale.payment_method}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(sale.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })} · Vendedor: <b>{sale.seller?.name || 'Vendedor'}</b>
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-extrabold text-slate-900 font-['Space_Grotesk']">
                                                    {formatCurrency(sale.total)}
                                                </p>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase">
                                                    {sale.status === 'completed' ? 'Concluída' : sale.status}
                                                </span>
                                            </div>

                                            <Link
                                                href={`/vendas/${sale.id}`}
                                                className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition"
                                                title="Ver Comprovante"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-slate-400">
                                Nenhuma compra registrada ainda para este cliente.
                            </div>
                        )}
                    </div>

                    {/* WhatsApp Interactions */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                    Histórico de Atendimentos WhatsApp
                                </h3>
                                <p className="text-xs text-slate-500">Últimas interações de chat registradas</p>
                            </div>
                            <Link
                                href="/atendimentos"
                                className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                                Abrir Inbox
                            </Link>
                        </div>

                        {customer.conversations && customer.conversations.length > 0 ? (
                            <div className="space-y-3">
                                {customer.conversations.map((conv) => (
                                    <Link
                                        key={conv.id}
                                        href={`/atendimentos?chat=${conv.id}`}
                                        className="block p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${conv.status === 'open' ? 'bg-emerald-500' : conv.status === 'closed' ? 'bg-slate-400' : 'bg-amber-500'}`} />
                                                {conv.status === 'open' ? 'Aberta' : conv.status === 'closed' ? 'Finalizada' : 'Em atendimento'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('pt-BR') : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {conv.last_message_preview || 'Atendimento registrado'}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 py-6 text-center">Nenhum histórico de conversa registrado.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
