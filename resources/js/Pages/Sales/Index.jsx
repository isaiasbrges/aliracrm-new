import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    ShoppingBag,
    Plus,
    Search,
    Download,
    DollarSign,
    Calendar,
    ArrowUpRight,
    Filter,
    User,
    CheckCircle2
} from 'lucide-react';

export default function SalesIndex({ sales, metrics, search, paymentMethod }) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethod || '');

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const handleFilterChange = (method) => {
        setSelectedPaymentMethod(method);
        router.get('/vendas', { search: searchTerm, payment_method: method }, { preserveState: true });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/vendas', { search: searchTerm, payment_method: selectedPaymentMethod }, { preserveState: true });
    };

    const paymentLabel = (method) => {
        switch (method) {
            case 'pix':
                return '📱 Pix';
            case 'credit':
                return '💳 Crédito';
            case 'debit':
                return '💳 Débito';
            case 'cash':
                return '💵 Dinheiro';
            default:
                return 'Outros';
        }
    };

    return (
        <AppLayout title="Vendas & PDV">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Histórico de Vendas & Caixa
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Consulte recibos emitidos, formas de pagamento e relatórios de vendas.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <a
                        href="/vendas/exportar"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </a>

                    <Link
                        href="/vendas/nova"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all transform active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        + Nova Venda (PDV)
                    </Link>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Faturamento Total
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
                        {formatCurrency(metrics?.total_revenue)}
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Vendas Realizadas
                    </span>
                    <h3 className="text-2xl font-extrabold text-blue-600 font-['Space_Grotesk'] mt-1">
                        {metrics?.total_sales || 0} pedidos
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ticket Médio por Venda
                    </span>
                    <h3 className="text-2xl font-extrabold text-emerald-600 font-['Space_Grotesk'] mt-1">
                        {formatCurrency(metrics?.avg_ticket)}
                    </h3>
                </div>
            </div>

            {/* Sales Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Search and Filters Bar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por número do pedido, cliente ou WhatsApp..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                        />
                    </form>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={selectedPaymentMethod}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none hover:bg-slate-50 transition"
                        >
                            <option value="">Todas as Formas de Pagamento</option>
                            <option value="pix">📱 Pix</option>
                            <option value="credit">💳 Cartão de Crédito</option>
                            <option value="debit">💳 Cartão de Débito</option>
                            <option value="cash">💵 Dinheiro</option>
                            <option value="other">Outros</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-3 px-4">Pedido</th>
                                <th className="py-3 px-4">Data / Hora</th>
                                <th className="py-3 px-4">Cliente</th>
                                <th className="py-3 px-4">Vendedor</th>
                                <th className="py-3 px-4">Pagamento</th>
                                <th className="py-3 px-4 text-right">Total</th>
                                <th className="py-3 px-4 text-right">Comprovante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sales?.data && sales.data.length > 0 ? (
                                sales.data.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                                            #{sale.number}
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-500">
                                            {new Date(sale.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>

                                        <td className="py-3.5 px-4">
                                            {sale.customer ? (
                                                <Link
                                                    href={`/clientes/${sale.customer.id}`}
                                                    className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                                                >
                                                    {sale.customer.name}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400 italic">Cliente Balcão</span>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-600">
                                            {sale.seller?.name || 'Vendedor'}
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                                                {paymentLabel(sale.payment_method)}
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-['Space_Grotesk'] text-sm">
                                            {formatCurrency(sale.total)}
                                        </td>

                                        <td className="py-3.5 px-4 text-right">
                                            <Link
                                                href={`/vendas/${sale.id}`}
                                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold p-1 hover:bg-blue-50 rounded-lg transition"
                                            >
                                                <span>Ver</span>
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-400">
                                        Nenhuma venda encontrada para os filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {sales?.links && sales.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Mostrando {sales.from || 0} a {sales.to || 0} de {sales.total || 0} vendas
                        </span>
                        <div className="flex items-center gap-1">
                            {sales.links.map((link, idx) => (
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
        </AppLayout>
    );
}
