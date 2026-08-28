import React from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    TrendingUp,
    ShoppingBag,
    Users,
    MessageSquare,
    DollarSign,
    Package,
    ArrowUpRight,
    Sparkles,
    ChevronRight,
    Flame
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

export default function Dashboard({
    metrics,
    chartDays,
    maxChartValue,
    topProducts,
    recentSales,
    recentConversations
}) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const statCards = [
        {
            title: 'Faturamento Total',
            value: formatCurrency(metrics?.revenue),
            icon: DollarSign,
            change: '+14.2% vs mês ant.',
            color: 'from-blue-600 to-indigo-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Vendas Concluídas',
            value: metrics?.sales_count || 0,
            icon: ShoppingBag,
            change: `${metrics?.sales_count || 0} pedidos no total`,
            color: 'from-emerald-600 to-teal-600',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Ticket Médio',
            value: formatCurrency(metrics?.avg_ticket),
            icon: TrendingUp,
            change: 'Por venda realizada',
            color: 'from-purple-600 to-indigo-600',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Valor no Funil',
            value: formatCurrency(metrics?.pipeline_value),
            icon: Flame,
            change: 'Oportunidades ativas',
            color: 'from-amber-500 to-orange-600',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
                    <p className="font-semibold text-slate-300">{payload[0].payload.label || label}</p>
                    <p className="text-emerald-400 font-bold mt-1 text-sm">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <AppLayout title="Dashboard Geral">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Visão Geral do Negócio
                        <span className="p-1 rounded-md bg-blue-100 text-blue-600">
                            <Sparkles className="w-4 h-4" />
                        </span>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Acompanhe vendas, funil de oportunidades e fluxo de clientes em tempo real.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/vendas/nova"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all transform active:scale-95"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Nova Venda (PDV)
                    </Link>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {card.title}
                                </span>
                                <div className={`p-2 rounded-xl ${card.bgColor} ${card.textColor}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <h3 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] tracking-tight">
                                    {card.value}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                                    <span className="text-emerald-600 font-semibold">{card.change}</span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart & Top Products Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                Faturamento nos Últimos 7 Dias
                            </h3>
                            <p className="text-xs text-slate-500">Volume diário de vendas concluídas</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Em Tempo Real
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(val) => `R$ ${val}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products (1 col) */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                Mais Vendidos
                            </h3>
                            <Link href="/produtos" className="text-xs font-semibold text-blue-600 hover:underline">
                                Ver todos
                            </Link>
                        </div>

                        <div className="space-y-3.5">
                            {topProducts && topProducts.length > 0 ? (
                                topProducts.map((prod, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                #{idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-slate-800 truncate">
                                                    {prod.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-500">
                                                    {prod.total_qty} {prod.total_qty === 1 ? 'unidade vendida' : 'unidades vendidas'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-extrabold text-slate-900 shrink-0 font-['Space_Grotesk']">
                                            {formatCurrency(prod.total_sales)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 py-8 text-center">
                                    Nenhum produto vendido recentemente.
                                </p>
                            )}
                        </div>
                    </div>

                    <Link
                        href="/produtos"
                        className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                        <Package className="w-3.5 h-3.5" />
                        Gerenciar Catálogo & Estoque
                    </Link>
                </div>
            </div>

            {/* Bottom Grid: Recent Sales & Recent Conversations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                Últimas Vendas
                            </h3>
                            <p className="text-xs text-slate-500">Histórico recente de pedidos emitidos</p>
                        </div>
                        <Link href="/vendas" className="text-xs font-semibold text-blue-600 hover:underline">
                            Ver todas
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {recentSales && recentSales.length > 0 ? (
                            recentSales.map((sale) => (
                                <div key={sale.id} className="py-3.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                            #{sale.number}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                {sale.customer?.name || 'Cliente Balcão'}
                                            </p>
                                            <p className="text-[11px] text-slate-400 capitalize">
                                                {sale.payment_method} · {sale.seller?.name || 'Vendedor'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-extrabold text-slate-900 font-['Space_Grotesk']">
                                            {formatCurrency(sale.total)}
                                        </p>
                                        <Link
                                            href={`/vendas/${sale.id}`}
                                            className="text-[11px] text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                                        >
                                            Comprovante <ArrowUpRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 py-6 text-center">Nenhuma venda registrada ainda.</p>
                        )}
                    </div>
                </div>

                {/* Recent WhatsApp Conversations */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                Atendimentos no WhatsApp
                            </h3>
                            <p className="text-xs text-slate-500">Conversas em andamento com clientes</p>
                        </div>
                        <Link href="/atendimentos" className="text-xs font-semibold text-blue-600 hover:underline">
                            Abrir Inbox
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {recentConversations && recentConversations.length > 0 ? (
                            recentConversations.map((conv) => (
                                <Link
                                    key={conv.id}
                                    href={`/atendimentos?chat=${conv.id}`}
                                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                            {conv.customer?.name ? conv.customer.name.substring(0, 2).toUpperCase() : 'WA'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                {conv.customer?.name || `WhatsApp ${conv.external_chat_id}`}
                                            </p>
                                            <p className="text-[11px] text-slate-400 truncate">
                                                {conv.last_message_preview || 'Nova conversa iniciada'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        Abrir
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 py-6 text-center">Nenhum atendimento recente.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
