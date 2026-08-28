import React, { useState } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Kanban, Plus, Flame, Trash2, User, Search,
    ArrowRight, MessageCircle, AlertCircle, CheckCircle2,
    Clock, HeartHandshake, History, CalendarDays
} from 'lucide-react';

export default function DealsIndex({ columns, totalPipelineValue, customers, recencySegments }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [draggingDealId, setDraggingDealId] = useState(null);
    const [activeTab, setActiveTab] = useState('kanban');

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        customer_id: '',
        value: '',
        stage: 'lead',
        priority: 'medium',
        notes: '',
        expected_close_date: '',
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const handleCreateDeal = (e) => {
        e.preventDefault();
        post('/funil', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const handleStageChange = (dealId, newStage) => {
        router.patch(`/funil/${dealId}/stage`, { stage: newStage }, { preserveScroll: true });
    };

    const handleDeleteDeal = (dealId) => {
        if (confirm('Tem certeza que deseja excluir esta oportunidade?')) {
            router.delete(`/funil/${dealId}`, { preserveScroll: true });
        }
    };

    // Native HTML5 Drag and Drop
    const onDragStart = (e, dealId) => {
        setDraggingDealId(dealId);
        e.dataTransfer.setData('text/plain', dealId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e, targetStage) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData('text/plain');
        if (dealId) {
            handleStageChange(dealId, targetStage);
        }
        setDraggingDealId(null);
    };

    const priorityBadge = (priority) => {
        switch (priority) {
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        🔥 Alta
                    </span>
                );
            case 'low':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Baixa
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        Média
                    </span>
                );
        }
    };

    const RecencyCard = ({ customer, status }) => {
        const getStyles = () => {
            switch (status) {
                case 'fresh': return 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300';
                case 'at_risk': return 'bg-amber-50/50 border-amber-200 hover:border-amber-300';
                case 'inactive': return 'bg-orange-50/50 border-orange-200 hover:border-orange-300';
                case 'lost': return 'bg-rose-50/50 border-rose-200 hover:border-rose-300';
                default: return 'bg-slate-50/50 border-slate-200 hover:border-slate-300';
            }
        };

        const getBadge = () => {
            switch (status) {
                case 'fresh': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Recente</span>;
                case 'at_risk': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Em Risco</span>;
                case 'inactive': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">Inativo</span>;
                case 'lost': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Perdido</span>;
                default: return null;
            }
        };

        return (
            <div className={`p-4 rounded-2xl border transition-all shadow-sm hover:shadow-md ${getStyles()} flex flex-col gap-3 group`}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 shadow-sm">
                            {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <Link href={`/clientes/${customer.id}`} className="font-bold text-sm text-slate-900 hover:text-blue-600 line-clamp-1">
                                {customer.name}
                            </Link>
                            <div className="text-xs text-slate-500 mt-0.5">{customer.whatsapp}</div>
                        </div>
                    </div>
                    {getBadge()}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-white/60 p-2 rounded-xl border border-black/5">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Última Compra</div>
                        <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {customer.recency_days} dias atrás
                        </div>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-black/5">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Gasto (LTV)</div>
                        <div className="text-sm font-bold text-slate-700 mt-0.5 font-['Space_Grotesk']">
                            {formatCurrency(customer.total_spent)}
                        </div>
                    </div>
                </div>

                <a
                    href={`https://wa.me/55${customer.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-sm"
                >
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    Iniciar Conversa
                </a>
            </div>
        );
    };

    return (
        <AppLayout title="Funil de Vendas · Kanban">
            {/* Header & Tabs */}
            <div className="flex flex-col mb-6 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                            Funil de Vendas & Pipeline
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                            Acompanhe suas negociações ativas. Total em pipeline:{' '}
                            <strong className="text-emerald-600 font-bold font-['Space_Grotesk']">
                                {formatCurrency(totalPipelineValue)}
                            </strong>
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all transform active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        + Nova Oportunidade
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-px mt-2">
                    <button
                        onClick={() => setActiveTab('kanban')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'kanban'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Kanban (Negociações)
                    </button>
                    <button
                        onClick={() => setActiveTab('recency')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'recency'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Radar de Reativação
                    </button>
                </div>
            </div>

            {/* Content Based on Tab */}
            {activeTab === 'kanban' && (
                <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar">
                    {Object.entries(columns || {}).map(([stageKey, col]) => (
                        <div
                            key={stageKey}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, stageKey)}
                            className="bg-slate-100/70 border border-slate-200/90 rounded-3xl p-3.5 flex flex-col h-[calc(100vh-280px)] min-h-[400px] w-72 min-w-[288px] shrink-0 shadow-2xs hover:border-slate-300 transition-colors snap-center"
                        >
                            {/* Column Header */}
                            <div
                                className="bg-white rounded-2xl p-3 mb-3 border border-slate-200/80 shadow-2xs"
                                style={{ borderTop: `3.5px solid ${col.info.color}` }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-slate-900 font-['Space_Grotesk']">
                                        {col.info.label}
                                    </span>
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                                        {col.count}
                                    </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-500 mt-1 font-['Space_Grotesk']">
                                    {formatCurrency(col.total)}
                                </p>
                            </div>

                            {/* Cards List */}
                            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 custom-scrollbar">
                                {col.deals && col.deals.length > 0 ? (
                                    col.deals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, deal.id)}
                                            className={`bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative group ${
                                                draggingDealId === deal.id ? 'opacity-40 ring-2 ring-blue-500' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                {priorityBadge(deal.priority)}
                                                <button
                                                    onClick={() => handleDeleteDeal(deal.id)}
                                                    className="text-slate-300 hover:text-rose-600 p-1 rounded transition opacity-0 group-hover:opacity-100 md:opacity-100 lg:opacity-0"
                                                    title="Excluir card"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                                                {deal.title}
                                            </h4>

                                            {deal.customer && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-2">
                                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <Link
                                                        href={`/clientes/${deal.customer.id}`}
                                                        className="truncate hover:text-blue-600 font-medium"
                                                    >
                                                        {deal.customer.name}
                                                    </Link>
                                                    {deal.customer.recency_days !== null && (
                                                        <span className="shrink-0 text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-semibold border border-slate-200" title={`Última compra há ${deal.customer.recency_days} dias`}>
                                                            {deal.customer.recency_days}d
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {deal.notes && (
                                                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                    "{deal.notes}"
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                                                <span className="text-xs font-extrabold text-slate-900 font-['Space_Grotesk']">
                                                    {formatCurrency(deal.value)}
                                                </span>

                                                {/* Quick stage selector */}
                                                <select
                                                    value={deal.stage}
                                                    onChange={(e) => handleStageChange(deal.id, e.target.value)}
                                                    className="text-[10px] font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none hover:bg-slate-200 transition"
                                                >
                                                    <option value="lead">Lead</option>
                                                    <option value="contacted">Contato</option>
                                                    <option value="proposal">Proposta</option>
                                                    <option value="negotiation">Negociação</option>
                                                    <option value="won">Ganho ✓</option>
                                                    <option value="lost">Perdido ✕</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[11px] text-slate-400 text-center p-3">
                                        Arraste um card
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'recency' && (
                <div className="pb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <History className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900">
                            Radar de Reativação
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Acompanhe o tempo desde a última compra dos seus clientes. Inicie conversas para fidelizar ou reconquistar.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Coluna 1: Fresh (<=30 dias) */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    Até 30 dias <span className="text-slate-400 font-normal text-xs">(Pós-venda)</span>
                                </h3>
                                <span className="text-xs font-bold text-slate-400">{recencySegments?.fresh?.length || 0}</span>
                            </div>
                            <div className="space-y-3">
                                {recencySegments?.fresh?.slice(0, 10).map(c => <RecencyCard key={c.id} customer={c} status="fresh" />)}
                                {recencySegments?.fresh?.length === 0 && <p className="text-xs text-slate-400 italic py-2">Nenhum cliente neste período.</p>}
                            </div>
                        </div>

                        {/* Coluna 2: At Risk (31-90 dias) */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                    31 a 90 dias <span className="text-slate-400 font-normal text-xs">(Atenção)</span>
                                </h3>
                                <span className="text-xs font-bold text-slate-400">{recencySegments?.at_risk?.length || 0}</span>
                            </div>
                            <div className="space-y-3">
                                {recencySegments?.at_risk?.slice(0, 10).map(c => <RecencyCard key={c.id} customer={c} status="at_risk" />)}
                                {recencySegments?.at_risk?.length === 0 && <p className="text-xs text-slate-400 italic py-2">Nenhum cliente neste período.</p>}
                            </div>
                        </div>

                        {/* Coluna 3: Inactive (91-120 dias) */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                                    91 a 120 dias <span className="text-slate-400 font-normal text-xs">(Risco Alto)</span>
                                </h3>
                                <span className="text-xs font-bold text-slate-400">{recencySegments?.inactive?.length || 0}</span>
                            </div>
                            <div className="space-y-3">
                                {recencySegments?.inactive?.slice(0, 10).map(c => <RecencyCard key={c.id} customer={c} status="inactive" />)}
                                {recencySegments?.inactive?.length === 0 && <p className="text-xs text-slate-400 italic py-2">Nenhum cliente neste período.</p>}
                            </div>
                        </div>

                        {/* Coluna 4: Lost (>120 dias) */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                    +120 dias <span className="text-slate-400 font-normal text-xs">(Perdidos)</span>
                                </h3>
                                <span className="text-xs font-bold text-slate-400">{recencySegments?.lost?.length || 0}</span>
                            </div>
                            <div className="space-y-3">
                                {recencySegments?.lost?.slice(0, 10).map(c => <RecencyCard key={c.id} customer={c} status="lost" />)}
                                {recencySegments?.lost?.length === 0 && <p className="text-xs text-slate-400 italic py-2">Nenhum cliente neste período.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Nova Oportunidade */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-2 z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg">
                                    Nova Oportunidade
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDeal} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Título da Oportunidade *
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Ex: Vestido de Festa + Acessórios"
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Cliente Vinculado
                                    </label>
                                    <select
                                        value={data.customer_id}
                                        onChange={(e) => setData('customer_id', e.target.value)}
                                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="">-- Selecione --</option>
                                        {customers?.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.whatsapp})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Valor Estimado (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.value}
                                        onChange={(e) => setData('value', e.target.value)}
                                        placeholder="0,00"
                                        required
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-['Space_Grotesk']"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Etapa Inicial *
                                    </label>
                                    <select
                                        value={data.stage}
                                        onChange={(e) => setData('stage', e.target.value)}
                                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="lead">Novos Leads</option>
                                        <option value="contacted">Contato Feito</option>
                                        <option value="proposal">Proposta Enviada</option>
                                        <option value="negotiation">Em Negociação</option>
                                        <option value="won">Ganhos / Fechados</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Prioridade *
                                    </label>
                                    <select
                                        value={data.priority}
                                        onChange={(e) => setData('priority', e.target.value)}
                                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">🔥 Alta</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Anotações & Observações
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows="3"
                                    placeholder="Detalhes..."
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                                    {processing ? 'Salvando...' : 'Criar Oportunidade'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
