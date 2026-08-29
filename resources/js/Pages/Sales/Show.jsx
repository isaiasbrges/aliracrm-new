import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
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
    Banknote,
    Phone,
    Sparkles,
    Send,
    Truck,
    Package,
    X,
    MessageSquare,
} from 'lucide-react';

export default function SalesShow({ sale }) {
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [sendingReceipt, setSendingReceipt] = useState(false);

    const { data: trackingData, setData: setTrackingData, post: postTracking, processing: sendingTracking, reset: resetTracking } = useForm({
        tracking_code: '',
        carrier: 'Correios',
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendReceipt = () => {
        if (!sale.customer?.whatsapp) {
            alert('Esta venda não possui cliente com WhatsApp vinculado.');
            return;
        }

        setSendingReceipt(true);
        router.post(`/vendas/${sale.id}/comprovante`, {}, {
            preserveScroll: true,
            onFinish: () => setSendingReceipt(false),
        });
    };

    const handleSendTrackingSubmit = (e) => {
        e.preventDefault();
        if (!trackingData.tracking_code.trim()) return;

        postTracking(`/vendas/${sale.id}/rastreio`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsTrackingModalOpen(false);
                resetTracking();
            },
        });
    };

    const renderPaymentMethod = (method) => {
        switch (method) {
            case 'pix':
                return (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                        <QrCode className="w-3.5 h-3.5" /> Pix (Instantâneo)
                    </span>
                );
            case 'credit':
                return (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600">
                        <CreditCard className="w-3.5 h-3.5" /> Cartão de Crédito
                    </span>
                );
            case 'debit':
                return (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-600">
                        <CreditCard className="w-3.5 h-3.5" /> Cartão de Débito
                    </span>
                );
            case 'cash':
                return (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
                        <Banknote className="w-3.5 h-3.5" /> Dinheiro
                    </span>
                );
            default:
                return <span>Outros</span>;
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

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Botão Enviar WhatsApp */}
                    {sale.customer?.whatsapp && (
                        <>
                            <button
                                onClick={handleSendReceipt}
                                disabled={sendingReceipt}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                                title="Enviar ou reenviar comprovante no WhatsApp do cliente"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {sendingReceipt ? 'Enviando...' : 'Reenviar WhatsApp'}
                            </button>

                            <button
                                onClick={() => setIsTrackingModalOpen(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 active:scale-95"
                                title="Enviar código de rastreamento no WhatsApp"
                            >
                                <Truck className="w-4 h-4" />
                                Enviar Rastreio
                            </button>
                        </>
                    )}

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Recibo
                    </button>

                    <Link
                        href="/vendas/nova"
                        className="inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-pink-600/20 transition active:scale-95"
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
                            Dyvinuss <span className="text-xs uppercase font-extrabold bg-pink-600 text-white px-2 py-0.5 rounded-md font-sans">LOOKS</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Comprovante de Venda & Atendimento</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Operação PDV Balcão & Online</p>
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
                                <p className="text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-600" /> {sale.customer.whatsapp}
                                </p>
                                {sale.customer.email && <p className="text-slate-400">{sale.customer.email}</p>}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">Cliente Balcão (Não identificado)</p>
                        )}
                    </div>

                    <div className="sm:text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Atendimento & Vendedora
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{sale.seller?.name || 'Vendedora Dyvinuss'}</p>
                        <div className="text-slate-500 mt-1 flex sm:justify-end items-center gap-1.5">
                            <span>Forma de Pagamento:</span>
                            {renderPaymentMethod(sale.payment_method)}
                        </div>
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
                                                {item.variant?.product?.name || 'Look'}
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
                        <span className="text-pink-600 text-xl">{formatCurrency(sale.total)}</span>
                    </div>
                </div>

                {/* Receipt Footer */}
                <div className="mt-10 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                    <p>Obrigado pela preferência e carinho! 💖</p>
                    <p className="mt-1 text-[11px]">Dyvinuss Looks · Moda Feminina Exclusiva & Elegância</p>
                </div>
            </div>

            {/* Modal Enviar Código de Rastreio */}
            {isTrackingModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base flex items-center gap-2">
                                <Truck className="w-5 h-5 text-purple-600" />
                                Enviar Rastreio no WhatsApp
                            </h3>
                            <button
                                onClick={() => setIsTrackingModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSendTrackingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Código de Rastreamento *
                                </label>
                                <input
                                    type="text"
                                    value={trackingData.tracking_code}
                                    onChange={(e) => setTrackingData('tracking_code', e.target.value)}
                                    placeholder="Ex: NL123456789BR"
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition font-mono uppercase"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Transportadora
                                </label>
                                <select
                                    value={trackingData.carrier}
                                    onChange={(e) => setTrackingData('carrier', e.target.value)}
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 outline-none transition"
                                >
                                    <option value="Correios">Correios (Sedex / PAC)</option>
                                    <option value="Motoboy Express">Motoboy Express (Local)</option>
                                    <option value="Jadlog">Jadlog</option>
                                    <option value="Melhor Envio">Melhor Envio</option>
                                    <option value="Loggi">Loggi</option>
                                </select>
                            </div>

                            <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                📲 A cliente <strong>{sale.customer?.name}</strong> receberá no WhatsApp uma mensagem elegante com o código e o link direto para acompanhar a entrega.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsTrackingModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingTracking || !trackingData.tracking_code.trim()}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {sendingTracking ? 'Disparando...' : 'Disparar Rastreio no WhatsApp'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
