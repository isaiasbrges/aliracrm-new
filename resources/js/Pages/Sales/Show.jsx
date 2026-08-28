import React from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    ShoppingBag,
    Printer,
    ArrowLeft,
    CheckCircle2,
    Calendar,
    User,
    Store,
    CreditCard,
    DollarSign,
    QrCode,
    Sparkles
} from 'lucide-react';

export default function SalesShow({ sale }) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const handlePrint = () => {
        window.print();
    };

    const paymentLabel = (method) => {
        switch (method) {
            case 'pix':
                return '📱 Pix (Instantâneo)';
            case 'credit':
                return '💳 Cartão de Crédito';
            case 'debit':
                return '💳 Cartão de Débito';
            case 'cash':
                return '💵 Dinheiro';
            default:
                return 'Outros';
        }
    };

    return (
        <AppLayout title={`Comprovante Venda #${sale.number}`}>
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
                <div>
                    <Link
                        href="/vendas"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Voltar para Lista de Vendas
                    </Link>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Comprovante de Venda #{sale.number}
                        <span className="p-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-sans font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Concluída
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Recibo
                    </button>

                    <Link
                        href="/vendas/nova"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition active:scale-95"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Nova Venda
                    </Link>
                </div>
            </div>

            {/* Printable Receipt Card */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
                {/* Receipt Brand & Store Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                            Alira <span className="text-xs uppercase font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-md font-sans">CRM</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Comprovante de Venda Não-Fiscal</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Operação PDV Balcão</p>
                    </div>

                    <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Pedido
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-900 font-mono">
                            #{sale.number}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {new Date(sale.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                </div>

                {/* Seller & Customer Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Dados do Cliente
                        </span>
                        {sale.customer ? (
                            <div>
                                <p className="font-bold text-slate-900 text-sm">{sale.customer.name}</p>
                                <p className="text-slate-500 font-mono mt-0.5">📱 {sale.customer.whatsapp}</p>
                                {sale.customer.email && <p className="text-slate-400">{sale.customer.email}</p>}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">Cliente Balcão (Não identificado)</p>
                        )}
                    </div>

                    <div className="sm:text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Atendimento & Vendedor
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{sale.seller?.name || 'Vendedor Padrão'}</p>
                        <p className="text-slate-500 mt-0.5">Forma de Pagamento: <b>{paymentLabel(sale.payment_method)}</b></p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="py-6">
                    <table className="w-full text-left text-xs">
                        <thead className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100 pb-2">
                            <tr>
                                <th className="py-2.5">Item / Descrição</th>
                                <th className="py-2.5 text-center">Qtd</th>
                                <th className="py-2.5 text-right">Preço Unit.</th>
                                <th className="py-2.5 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sale.items && sale.items.length > 0 ? (
                                sale.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3">
                                            <p className="font-bold text-slate-900">
                                                {item.variant?.product?.name || 'Produto'}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Tam: {item.variant?.size} · Cor: {item.variant?.color} · SKU: {item.variant?.sku}
                                            </p>
                                        </td>
                                        <td className="py-3 text-center font-bold text-slate-800">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 text-right font-mono text-slate-600">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="py-3 text-right font-extrabold text-slate-900 font-['Space_Grotesk'] text-sm">
                                            {formatCurrency(item.total)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-4 text-center text-slate-400">
                                        Nenhum item registrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Subtotal dos Produtos</span>
                        <span className="font-mono">{formatCurrency(sale.subtotal || sale.total)}</span>
                    </div>

                    {sale.discount > 0 && (
                        <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                            <span>Desconto Aplicado</span>
                            <span className="font-mono">- {formatCurrency(sale.discount)}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-lg font-extrabold text-slate-900 pt-3 border-t border-slate-200 font-['Space_Grotesk']">
                        <span>Total Pago</span>
                        <span className="text-emerald-600 text-xl">{formatCurrency(sale.total)}</span>
                    </div>
                </div>

                {/* Receipt Footer */}
                <div className="mt-10 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                    <p>Obrigado pela preferência!</p>
                    <p className="mt-1 text-[11px]">Alira CRM & Omnichannel · Sistema de Gestão Comercial</p>
                </div>
            </div>
        </AppLayout>
    );
}
