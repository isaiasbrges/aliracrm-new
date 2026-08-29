import React, { useState } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Kanban, Plus, Flame, Trash2, User, Search,
    ArrowRight, MessageCircle, AlertCircle, CheckCircle2,
    Clock, HeartHandshake, History, CalendarDays, Zap,
    Send, Sparkles, Check, X, Phone, Tag, DollarSign,
    Users, ChevronRight, MessageSquare, ShieldCheck,
    Activity, AlertTriangle, Info, HelpCircle
} from 'lucide-react';

/* ── Mensagens Prontas Inteligentes com Spintax Anti-Spam ({Olá|Oi|Oie}) ── */
const STAGE_TEMPLATES = {
    lead: [
        {
            title: 'Primeiro Contato & Boas-Vindas (Spintax Inteligente)',
            text: '{Olá|Oi|Oie} {cliente}! {Tudo bem?|Como você está?|Tudo certinho por aí?} Vi seu interesse na nossa coleção e separei opções lindas que combinam com seu estilo. Gostaria de dar uma olhadinha?',
            advanceTo: 'contacted',
        },
        {
            title: 'Apresentação de Looks Exclusivos',
            text: '{Oi|Olá} {cliente}! {Acabaram de chegar peças maravilhosas|Temos novidades fresquinhas na loja}! Posso te enviar algumas fotos dos lançamentos exclusivos?',
            advanceTo: 'contacted',
        },
    ],
    contacted: [
        {
            title: 'Follow-up de Interesse',
            text: '{Olá|Oi} {cliente}! {Passando para saber se conseguiu ver as peças|Queria saber o que achou dos looks que te enviei}! Teve algum modelo que chamou mais sua atenção?',
            advanceTo: 'proposal',
        },
        {
            title: 'Consultoria de Estilo & Tamanhos',
            text: '{Oi|Olá} {cliente}! Temos essa peça nos tamanhos P, M e G. {Se quiser, me passe suas medidas|Me informe como você gosta do caimento} que te ajudo a escolher a opção perfeita!',
            advanceTo: 'proposal',
        },
    ],
    proposal: [
        {
            title: 'Acompanhamento de Proposta / Orçamento',
            text: '{Olá|Oi} {cliente}! Seu orçamento no valor de {valor} para {titulo} está prontinho com condições especiais válidas para hoje! {Podemos fechar?|Gostaria de garantir sua reserva?}',
            advanceTo: 'negotiation',
        },
        {
            title: 'Condição Especial por Tempo Limitado',
            text: '{Oi|Olá} {cliente}! Consigo segurar o valor de {valor} com 5% de desconto no PIX ou até 6x sem juros no cartão se fecharmos hoje. O que acha?',
            advanceTo: 'negotiation',
        },
    ],
    negotiation: [
        {
            title: 'Cupom de Fechamento / Frete Cortesia',
            text: '{Oi|Olá} {cliente}! Para fecharmos agora seu pedido ({titulo}), liberei o frete cortesia para seu endereço! Posso gerar seu link de pagamento?',
            advanceTo: 'won',
        },
        {
            title: 'Chave PIX para Finalizar',
            text: '{Olá|Oi} {cliente}! Podemos finalizar seu pedido de {valor}? Me confirme que já gero sua chave PIX com desconto especial!',
            advanceTo: 'won',
        },
    ],
    won: [
        {
            title: 'Agradecimento & Pós-Venda',
            text: '{Olá|Oi} {cliente}! Muito obrigado pela confiança! Seu pedido já está sendo preparado com muito carinho. Logo mais envio seu código de rastreio! 💖',
            advanceTo: '',
        },
    ],
    reactivation: [
        {
            title: 'Reativação com Saudade & Novidades',
            text: '{Oi|Olá} {cliente}, estamos com saudades de você aqui na {loja}! Chegaram novidades incríveis e separei um presente de boas-vindas para sua próxima visita. Dá uma olhada!',
        },
        {
            title: 'Cupom Exclusivo de Retorno (10% OFF)',
            text: '{Olá|Oi} {cliente}! Preparamos um cupom especial de 10% OFF para você matar a saudade dos nossos looks. Válido para usar até este sábado!',
        },
    ],
};

export default function DealsIndex({
    columns,
    totalPipelineValue,
    customers,
    catalogProducts = [],
    recencySegments,
    chipHealth
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [draggingDealId, setDraggingDealId] = useState(null);
    const [activeTab, setActiveTab] = useState('kanban');

    // Estados para Disparo de WhatsApp
    const [selectedDealForDispatch, setSelectedDealForDispatch] = useState(null);
    const [selectedCustomerForReactivation, setSelectedCustomerForReactivation] = useState(null);
    const [selectedColumnForBulk, setSelectedColumnForBulk] = useState(null);

    // Form Nova Oportunidade
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        customer_id: '',
        value: '',
        stage: 'lead',
        priority: 'medium',
        notes: '',
        expected_close_date: '',
    });

    // Form Disparo Individual
    const singleDispatchForm = useForm({
        message: '',
        advance_stage: '',
    });

    // Form Disparo em Massa por Coluna
    const bulkDispatchForm = useForm({
        deal_ids: [],
        message_template: '',
        advance_stage: '',
    });

    // Form Disparo Reativação
    const reactivationForm = useForm({
        message: '',
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const insertTagIntoForm = (form, field, tag) => {
        const current = form.data[field] || '';
        form.setData(field, current + (current.length > 0 && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '') + tag);
    };

    const insertLookIntoForm = (form, field, look) => {
        if (!look) return;
        const current = form.data[field] || '';
        const formattedPrice = formatCurrency(look.price);
        const textToInsert = `✨ *${look.name}* por apenas ${formattedPrice}!\n👗 Veja os detalhes e compre aqui: {catalogo_link}`;
        form.setData(field, current ? current + '\n\n' + textToInsert : textToInsert);
    };

    const renderLivePreview = (template, sampleCustomer, sampleDeal) => {
        if (!template) return '';
        const firstName = sampleCustomer?.name ? sampleCustomer.name.split(' ')[0] : 'Juliana';
        const fullName = sampleCustomer?.name || 'Juliana Santos';
        const val = sampleDeal?.value ? formatCurrency(sampleDeal.value) : 'R$ 189,90';
        const title = sampleDeal?.title || 'Vestido Musse';
        const storeName = 'Dyvinuss Looks';
        const catalogLink = 'https://aliracrm.site/catalogo';

        let res = template
            .replace(/\{cliente\}|\{nome\}|\{primeiro_nome\}/g, firstName)
            .replace(/\{nome_completo\}/g, fullName)
            .replace(/\{saudacao\}/g, 'Olá')
            .replace(/\{valor\}/g, val)
            .replace(/\{titulo\}/g, title)
            .replace(/\{loja\}/g, storeName)
            .replace(/\{catalogo_link\}/g, catalogLink)
            .replace(/\{cidade\}/g, sampleCustomer?.city || 'São Paulo');

        res = res.replace(/\{([^{}]+)\}/g, (match, p1) => {
            const parts = p1.split('|');
            return parts[0] || match;
        });

        return res;
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

    /* ── Abrir Modal de Disparo Individual ── */
    const openSingleDispatch = (deal) => {
        setSelectedDealForDispatch(deal);
        const stage = deal.stage || 'lead';
        const templates = STAGE_TEMPLATES[stage] || STAGE_TEMPLATES.lead;
        const defaultTpl = templates[0];

        const firstName = deal.customer?.name ? deal.customer.name.split(' ')[0] : 'Cliente';
        const formattedVal = formatCurrency(deal.value);
        const text = defaultTpl.text
            .replace('{cliente}', firstName)
            .replace('{valor}', formattedVal)
            .replace('{titulo}', deal.title);

        singleDispatchForm.setData({
            message: text,
            advance_stage: defaultTpl.advanceTo || '',
        });
    };

    const handleSingleDispatchSubmit = (e) => {
        e.preventDefault();
        if (!selectedDealForDispatch) return;

        singleDispatchForm.post(`/funil/${selectedDealForDispatch.id}/disparar`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedDealForDispatch(null);
                singleDispatchForm.reset();
            },
        });
    };

    /* ── Abrir Modal de Disparo em Massa ── */
    const openBulkDispatch = (stageKey, columnData) => {
        const dealsWithCustomer = columnData.deals.filter((d) => d.customer && d.customer.whatsapp);
        if (dealsWithCustomer.length === 0) {
            alert('Não há oportunidades com WhatsApp válido nesta etapa.');
            return;
        }

        setSelectedColumnForBulk({
            stageKey,
            label: columnData.info.label,
            deals: dealsWithCustomer,
        });

        const templates = STAGE_TEMPLATES[stageKey] || STAGE_TEMPLATES.lead;
        const defaultTpl = templates[0];

        bulkDispatchForm.setData({
            deal_ids: dealsWithCustomer.map((d) => d.id),
            message_template: defaultTpl.text,
            advance_stage: defaultTpl.advanceTo || '',
        });
    };

    const handleBulkDispatchSubmit = (e) => {
        e.preventDefault();
        bulkDispatchForm.post('/funil/disparo-massa', {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedColumnForBulk(null);
                bulkDispatchForm.reset();
            },
        });
    };

    /* ── Abrir Modal de Reativação ── */
    const openReactivationDispatch = (customer) => {
        setSelectedCustomerForReactivation(customer);
        const firstName = customer.name ? customer.name.split(' ')[0] : 'Cliente';
        const text = STAGE_TEMPLATES.reactivation[0].text.replace('{cliente}', firstName);

        reactivationForm.setData({
            message: text,
        });
    };

    const handleReactivationSubmit = (e) => {
        e.preventDefault();
        if (!selectedCustomerForReactivation) return;

        reactivationForm.post(`/funil/disparo-reativacao/${selectedCustomerForReactivation.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCustomerForReactivation(null);
                reactivationForm.reset();
            },
        });
    };

    const priorityBadge = (priority) => {
        switch (priority) {
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <Flame className="w-3 h-3 text-rose-500" /> Alta
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
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
            <div className={`p-4 rounded-2xl border transition-all shadow-xs hover:shadow-md ${getStyles()} flex flex-col justify-between gap-3 group`}>
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-2xs">
                                {customer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <Link href={`/clientes/${customer.id}`} className="font-bold text-xs text-slate-900 hover:text-blue-600 line-clamp-1">
                                    {customer.name}
                                </Link>
                                <div className="text-[11px] text-slate-500 font-mono">{customer.whatsapp}</div>
                            </div>
                        </div>
                        {getBadge()}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-white/70 p-2 rounded-xl border border-black/5">
                            <div className="text-[9px] font-semibold text-slate-400 uppercase">Última Compra</div>
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {customer.recency_days} dias atrás
                            </div>
                        </div>
                        <div className="bg-white/70 p-2 rounded-xl border border-black/5">
                            <div className="text-[9px] font-semibold text-slate-400 uppercase">Total Gasto</div>
                            <div className="text-xs font-bold text-emerald-600 mt-0.5">
                                {formatCurrency(customer.total_spent)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botão Disparo Reativação */}
                <button
                    onClick={() => openReactivationDispatch(customer)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Disparar Reativação WhatsApp
                </button>
            </div>
        );
    };

    return (
        <AppLayout title="Funil de Vendas (Kanban)">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Funil de Vendas & Disparos
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Gerencie oportunidades e faça disparos inteligentes com proteção anti-ban por etapa.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-sm text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Pipeline Total</span>
                        <span className="text-sm sm:text-base font-bold font-['Space_Grotesk'] text-emerald-400">
                            {formatCurrency(totalPipelineValue)}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-md shadow-blue-600/20 transition-all transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Oportunidade
                    </button>
                </div>
            </div>

            {/* ── PAINEL INTELIGENTE: SAÚDE DO CHIP & ANTI-BAN ── */}
            {chipHealth && (
                <div className="mb-5 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                            chipHealth.status === 'safe'
                                ? 'bg-emerald-100 text-emerald-700'
                                : chipHealth.status === 'warning'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                        }`}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 font-['Space_Grotesk']">
                                    Saúde do Chip WhatsApp (Anti-Ban Ativo)
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    chipHealth.status === 'safe'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : chipHealth.status === 'warning'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                    {chipHealth.status === 'safe' ? '🟢 Zona Segura' : chipHealth.status === 'warning' ? '🟡 Atenção' : '🛑 Limite Diário'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Disparos hoje: <b>{chipHealth.dispatches_today}</b> de {chipHealth.daily_limit} (restam {chipHealth.remaining}) · Protegendo contra bloqueios da Meta.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        {/* Progress Bar */}
                        <div className="w-36 hidden sm:block">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>Cota Diária</span>
                                <b>{chipHealth.percentage}%</b>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        chipHealth.status === 'safe'
                                            ? 'bg-emerald-500'
                                            : chipHealth.status === 'warning'
                                            ? 'bg-amber-500'
                                            : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${chipHealth.percentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Status Horário Comercial */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-600 font-medium">
                                {chipHealth.current_hour} · {chipHealth.is_commercial_hour ? 'Horário Comercial 🟢' : 'Fora de Horário ⚠️'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('kanban')}
                    className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'kanban'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Kanban className="w-4 h-4" />
                    Quadro Kanban
                </button>
                <button
                    onClick={() => setActiveTab('recency')}
                    className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'recency'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <History className="w-4 h-4" />
                    Radar de Reativação (Pós-Venda)
                </button>
            </div>

            {/* ── KANBAN BOARD ── */}
            {activeTab === 'kanban' && (
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
                    {Object.entries(columns).map(([stageKey, col]) => (
                        <div
                            key={stageKey}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, stageKey)}
                            className="min-w-[290px] w-[290px] max-w-[290px] bg-slate-50/80 rounded-3xl p-3.5 border border-slate-200/70 flex flex-col max-h-[calc(100vh-270px)] shrink-0"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: col.info.color }}
                                    />
                                    <h3 className="font-bold text-xs text-slate-800 font-['Space_Grotesk']">
                                        {col.info.label}
                                    </h3>
                                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                                        {col.count}
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 font-['Space_Grotesk']">
                                    {formatCurrency(col.total)}
                                </span>
                            </div>

                            {/* Botão Disparo em Massa da Coluna */}
                            {col.count > 0 && (
                                <button
                                    onClick={() => openBulkDispatch(stageKey, col)}
                                    className="mb-3 w-full py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                                    title="Enviar mensagem inteligente para todos os leads desta etapa"
                                >
                                    <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                                    Disparar para os {col.count} Leads
                                </button>
                            )}

                            {/* Column Cards Container */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                {col.deals.length > 0 ? (
                                    col.deals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, deal.id)}
                                            className={`bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative group ${
                                                draggingDealId === deal.id ? 'opacity-40 ring-2 ring-blue-500' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                {priorityBadge(deal.priority)}
                                                <button
                                                    onClick={() => handleDeleteDeal(deal.id)}
                                                    className="text-slate-300 hover:text-rose-600 p-1 rounded transition opacity-0 group-hover:opacity-100"
                                                    title="Excluir card"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                                                {deal.title}
                                            </h4>

                                            {deal.customer && (
                                                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                        <span className="truncate font-semibold text-slate-800">
                                                            {deal.customer.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {deal.customer.whatsapp}
                                                    </span>
                                                </div>
                                            )}

                                            {deal.notes && (
                                                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 italic">
                                                    "{deal.notes}"
                                                </p>
                                            )}

                                            {/* Valor & Seletor de Estágio */}
                                            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
                                                <span className="text-xs font-extrabold text-slate-900 font-['Space_Grotesk']">
                                                    {formatCurrency(deal.value)}
                                                </span>

                                                <select
                                                    value={deal.stage}
                                                    onChange={(e) => handleStageChange(deal.id, e.target.value)}
                                                    className="text-[10px] font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none hover:bg-slate-200 transition"
                                                >
                                                    <option value="lead">Lead</option>
                                                    <option value="contacted">Contato</option>
                                                    <option value="proposal">Proposta</option>
                                                    <option value="negotiation">Negociação</option>
                                                    <option value="won">Ganho</option>
                                                    <option value="lost">Perdido</option>
                                                </select>
                                            </div>

                                            {/* Botão Disparar WhatsApp no Card */}
                                            {deal.customer?.whatsapp && (
                                                <button
                                                    onClick={() => openSingleDispatch(deal)}
                                                    className="mt-2.5 w-full py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                                                >
                                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                                    Disparar WhatsApp
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-28 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[11px] text-slate-400 text-center p-3">
                                        Arraste um card aqui
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── RADAR DE REATIVAÇÃO ── */}
            {activeTab === 'recency' && (
                <div className="pb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <History className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900">
                            Radar de Reativação & Disparo de Pós-Venda
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Faça disparos automáticos para reconquistar clientes inativos e fidelizar quem comprou recentemente.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Coluna 1: Fresh (<=30 dias) */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    Até 30 dias (Pós-Venda)
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
                                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                    31 a 90 dias (Atenção)
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
                                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                                    91 a 120 dias (Risco Alto)
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
                                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                    Mais de 120 dias (Perdidos)
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

            {/* ── MODAL: DISPARO INDIVIDUAL DE WHATSAPP (ULTRA DINÂMICO) ── */}
            {selectedDealForDispatch && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <Zap className="w-5 h-5 fill-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                        Disparo Dinâmico de WhatsApp
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {selectedDealForDispatch.customer?.name} · <span className="font-mono font-bold text-slate-700">{selectedDealForDispatch.customer?.whatsapp}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDealForDispatch(null)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSingleDispatchSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                            {/* Templates Sugeridos para esta Etapa */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Modelos Prontos para esta Etapa:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(STAGE_TEMPLATES[selectedDealForDispatch.stage] || STAGE_TEMPLATES.lead).map((tpl, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                singleDispatchForm.setData({
                                                    message: tpl.text,
                                                    advance_stage: tpl.advanceTo || '',
                                                });
                                            }}
                                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition text-left group"
                                        >
                                            <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 block mb-0.5">
                                                {tpl.title}
                                            </span>
                                            <p className="text-[10px] text-slate-500 line-clamp-2">
                                                {tpl.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inserir Variáveis Dinâmicas com 1 Clique */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Tags Dinâmicas (Clique para Inserir):
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '+ {cliente}', tag: '{cliente}' },
                                        { label: '+ {saudacao}', tag: '{saudacao}' },
                                        { label: '+ {valor}', tag: '{valor}' },
                                        { label: '+ {titulo}', tag: '{titulo}' },
                                        { label: '+ {loja}', tag: '{loja}' },
                                        { label: '+ {catalogo_link}', tag: '{catalogo_link}' },
                                        { label: '+ {cidade}', tag: '{cidade}' },
                                        { label: '+ {Olá|Oi|Oie}', tag: '{Olá|Oi|Oie}' },
                                    ].map((v, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => insertTagIntoForm(singleDispatchForm, 'message', v.tag)}
                                            className="text-[11px] font-mono font-bold px-2 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg border border-slate-200 transition"
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Anexar Look do Catálogo */}
                            {catalogProducts && catalogProducts.length > 0 && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                                        Inserir Look do Catálogo na Mensagem:
                                    </label>
                                    <select
                                        onChange={(e) => {
                                            const p = catalogProducts.find(x => x.id === parseInt(e.target.value));
                                            if (p) insertLookIntoForm(singleDispatchForm, 'message', p);
                                            e.target.value = '';
                                        }}
                                        className="w-full text-xs font-semibold bg-pink-50/50 border border-pink-200 rounded-xl px-3 py-2 text-pink-900 outline-none"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Selecione um look para anexar à mensagem...</option>
                                        {catalogProducts.map(p => (
                                            <option key={p.id} value={p.id}>
                                                👗 {p.name} — {formatCurrency(p.price)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Mensagem a ser disparada */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Texto da Mensagem *
                                </label>
                                <textarea
                                    value={singleDispatchForm.data.message}
                                    onChange={(e) => singleDispatchForm.setData('message', e.target.value)}
                                    rows={4}
                                    required
                                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none leading-relaxed"
                                />
                            </div>

                            {/* Preview Visual em Tempo Real do WhatsApp */}
                            {singleDispatchForm.data.message && (
                                <div className="p-3.5 rounded-2xl bg-emerald-950/5 border border-emerald-200/60 space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        Pré-Visualização Real no WhatsApp:
                                    </span>
                                    <div className="bg-[#dcf8c6] text-slate-900 p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-wrap leading-relaxed max-w-md font-sans">
                                        {renderLivePreview(singleDispatchForm.data.message, selectedDealForDispatch.customer, selectedDealForDispatch)}
                                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-800/60">
                                            <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Avançar Estágio Automaticamente */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-xs text-slate-800 block">Avançar Etapa do Lead?</span>
                                    <span className="text-[11px] text-slate-500">Move o card automaticamente após o envio</span>
                                </div>
                                <select
                                    value={singleDispatchForm.data.advance_stage}
                                    onChange={(e) => singleDispatchForm.setData('advance_stage', e.target.value)}
                                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                                >
                                    <option value="">Não mover</option>
                                    <option value="contacted">Mover para: Contato Feito</option>
                                    <option value="proposal">Mover para: Proposta Enviada</option>
                                    <option value="negotiation">Mover para: Em Negociação</option>
                                    <option value="won">Mover para: Ganho / Fechado</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDealForDispatch(null)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={singleDispatchForm.processing || !singleDispatchForm.data.message.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {singleDispatchForm.processing ? 'Disparando...' : 'Disparar WhatsApp Agora'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: DISPARO EM MASSA POR COLUNA (ULTRA DINÂMICO) ── */}
            {selectedColumnForBulk && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                        Disparo em Massa Inteligente: {selectedColumnForBulk.label}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Disparo dinâmico para {selectedColumnForBulk.deals.length} oportunidades
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedColumnForBulk(null)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBulkDispatchSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                            {/* Alerta Anti-Ban Spintax */}
                            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2.5">
                                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                    <b>Proteção Anti-Ban & Variação Inteligente:</b> O sistema varia automaticamente as saudações com Spintax como <code>{"{Olá|Oi|Oie}"}</code> e personaliza o nome e valor de cada oportunidade.
                                </div>
                            </div>

                            {/* Inserir Variáveis Dinâmicas */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Tags Rápidas:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '+ {cliente}', tag: '{cliente}' },
                                        { label: '+ {saudacao}', tag: '{saudacao}' },
                                        { label: '+ {valor}', tag: '{valor}' },
                                        { label: '+ {titulo}', tag: '{titulo}' },
                                        { label: '+ {loja}', tag: '{loja}' },
                                        { label: '+ {catalogo_link}', tag: '{catalogo_link}' },
                                        { label: '+ {cidade}', tag: '{cidade}' },
                                        { label: '+ {Olá|Oi|Oie}', tag: '{Olá|Oi|Oie}' },
                                    ].map((v, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => insertTagIntoForm(bulkDispatchForm, 'message_template', v.tag)}
                                            className="text-[11px] font-mono font-bold px-2 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 rounded-lg border border-slate-200 transition"
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Anexar Look do Catálogo */}
                            {catalogProducts && catalogProducts.length > 0 && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                                        Inserir Look do Catálogo no Template:
                                    </label>
                                    <select
                                        onChange={(e) => {
                                            const p = catalogProducts.find(x => x.id === parseInt(e.target.value));
                                            if (p) insertLookIntoForm(bulkDispatchForm, 'message_template', p);
                                            e.target.value = '';
                                        }}
                                        className="w-full text-xs font-semibold bg-pink-50/50 border border-pink-200 rounded-xl px-3 py-2 text-pink-900 outline-none"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Selecione um look para anexar ao template...</option>
                                        {catalogProducts.map(p => (
                                            <option key={p.id} value={p.id}>
                                                👗 {p.name} — {formatCurrency(p.price)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Template da Mensagem em Massa *
                                </label>
                                <textarea
                                    value={bulkDispatchForm.data.message_template}
                                    onChange={(e) => bulkDispatchForm.setData('message_template', e.target.value)}
                                    rows={4}
                                    required
                                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none leading-relaxed"
                                />
                            </div>

                            {/* Preview Visual em Tempo Real */}
                            {bulkDispatchForm.data.message_template && (
                                <div className="p-3.5 rounded-2xl bg-indigo-950/5 border border-indigo-200/60 space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-indigo-600" />
                                        Exemplo de Prévia para um Lead da Lista:
                                    </span>
                                    <div className="bg-[#dcf8c6] text-slate-900 p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-wrap leading-relaxed max-w-md font-sans">
                                        {renderLivePreview(bulkDispatchForm.data.message_template, selectedColumnForBulk.deals[0]?.customer, selectedColumnForBulk.deals[0])}
                                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-800/60">
                                            <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-xs text-slate-800 block">Avançar Todos de Etapa?</span>
                                    <span className="text-[11px] text-slate-500">Move todos os cards disparados</span>
                                </div>
                                <select
                                    value={bulkDispatchForm.data.advance_stage}
                                    onChange={(e) => bulkDispatchForm.setData('advance_stage', e.target.value)}
                                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                                >
                                    <option value="">Não mover</option>
                                    <option value="contacted">Mover para: Contato Feito</option>
                                    <option value="proposal">Mover para: Proposta Enviada</option>
                                    <option value="negotiation">Mover para: Em Negociação</option>
                                    <option value="won">Mover para: Ganho / Fechado</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedColumnForBulk(null)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkDispatchForm.processing || !bulkDispatchForm.data.message_template.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                    {bulkDispatchForm.processing ? 'Disparando...' : `Disparar para ${selectedColumnForBulk.deals.length} Leads`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: DISPARO DE REATIVAÇÃO (RADAR - ULTRA DINÂMICO) ── */}
            {selectedCustomerForReactivation && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                        Reconquista & Reativação de Cliente
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {selectedCustomerForReactivation.name} · <span className="font-mono font-bold text-slate-700">{selectedCustomerForReactivation.whatsapp}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCustomerForReactivation(null)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReactivationSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                            {/* Inserir Variáveis Dinâmicas */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Tags Rápidas:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '+ {cliente}', tag: '{cliente}' },
                                        { label: '+ {saudacao}', tag: '{saudacao}' },
                                        { label: '+ {loja}', tag: '{loja}' },
                                        { label: '+ {catalogo_link}', tag: '{catalogo_link}' },
                                        { label: '+ {cidade}', tag: '{cidade}' },
                                        { label: '+ {Olá|Oi|Oie}', tag: '{Olá|Oi|Oie}' },
                                    ].map((v, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => insertTagIntoForm(reactivationForm, 'message', v.tag)}
                                            className="text-[11px] font-mono font-bold px-2 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg border border-slate-200 transition"
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Anexar Look do Catálogo */}
                            {catalogProducts && catalogProducts.length > 0 && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                                        Recomendar Novidade do Catálogo:
                                    </label>
                                    <select
                                        onChange={(e) => {
                                            const p = catalogProducts.find(x => x.id === parseInt(e.target.value));
                                            if (p) insertLookIntoForm(reactivationForm, 'message', p);
                                            e.target.value = '';
                                        }}
                                        className="w-full text-xs font-semibold bg-pink-50/50 border border-pink-200 rounded-xl px-3 py-2 text-pink-900 outline-none"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Selecione um look para convidar o cliente...</option>
                                        {catalogProducts.map(p => (
                                            <option key={p.id} value={p.id}>
                                                👗 {p.name} — {formatCurrency(p.price)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Mensagem de Reconquista (com Spintax) *
                                </label>
                                <textarea
                                    value={reactivationForm.data.message}
                                    onChange={(e) => reactivationForm.setData('message', e.target.value)}
                                    rows={4}
                                    required
                                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none leading-relaxed"
                                />
                            </div>

                            {/* Preview Visual em Tempo Real */}
                            {reactivationForm.data.message && (
                                <div className="p-3.5 rounded-2xl bg-emerald-950/5 border border-emerald-200/60 space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        Pré-Visualização no WhatsApp:
                                    </span>
                                    <div className="bg-[#dcf8c6] text-slate-900 p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-wrap leading-relaxed max-w-md font-sans">
                                        {renderLivePreview(reactivationForm.data.message, selectedCustomerForReactivation, null)}
                                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-800/60">
                                            <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCustomerForReactivation(null)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={reactivationForm.processing || !reactivationForm.data.message.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {reactivationForm.processing ? 'Enviando...' : 'Enviar WhatsApp de Retorno'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: NOVA OPORTUNIDADE ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg">
                                Nova Oportunidade
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDeal} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Título da Oportunidade *
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Ex: Look festa de gala, Enxoval..."
                                    required
                                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                    {errors.value && <p className="text-xs text-rose-500 mt-1">{errors.value}</p>}
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
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Cliente Vinculado
                                </label>
                                <select
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', e.target.value)}
                                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    <option value="">Selecione um cliente (opcional)...</option>
                                    {customers &&
                                        customers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.whatsapp || 'sem whats'})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Estágio Inicial *
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
                                    <option value="won">Ganho / Fechado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Observações / Anotações
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Detalhes das peças de interesse..."
                                    rows={2}
                                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Salvando...' : 'Adicionar ao Funil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
