import React, { useState, useEffect, useRef } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    MessageSquare,
    Send,
    Search,
    Plus,
    User,
    ShoppingBag,
    CheckCheck,
    Phone,
    ArrowUpRight,
    X,
    Filter,
    Clock,
    Sparkles,
    Zap,
    Bookmark,
    CreditCard,
    QrCode,
    Package,
    HeartHandshake,
    MapPin,
    Smile,
} from 'lucide-react';

const DEFAULT_QUICK_REPLIES = [
    {
        id: 'welcome',
        category: 'Boas-Vindas',
        title: 'Boas-Vindas & Recepção',
        icon: Smile,
        text: 'Olá {cliente}! Seja muito bem-vinda(o) à nossa loja! Como posso te ajudar hoje? ✨',
    },
    {
        id: 'pix',
        category: 'Pagamento',
        title: 'Chave PIX & Instruções',
        icon: QrCode,
        text: 'Aqui está nossa chave PIX oficial para pagamento:\n\n🔑 Chave PIX: [sua-chave-pix-aqui]\n\nAssim que realizar a transferência, basta nos enviar o comprovante por aqui para confirmarmos seu pedido imediatamente!',
    },
    {
        id: 'payments',
        category: 'Pagamento',
        title: 'Formas de Pagamento',
        icon: CreditCard,
        text: 'Trabalhamos com:\n• PIX à vista (com 5% de desconto)\n• Cartão de Crédito em até 6x sem juros\n• Link de Pagamento seguro\n\nQual forma prefere para finalizarmos?',
    },
    {
        id: 'catalog',
        category: 'Produtos',
        title: 'Catálogo & Lançamentos',
        icon: Sparkles,
        text: 'Temos lançamentos exclusivos e peças lindíssimas que acabaram de chegar! Gostaria de receber fotos e tamanhos disponíveis?',
    },
    {
        id: 'shipping',
        category: 'Entrega',
        title: 'Frete & Envio',
        icon: Package,
        text: 'Sua peça já está reservada com todo carinho! Por favor, me informe seu CEP para calcularmos a entrega expressa para você.',
    },
    {
        id: 'thanks',
        category: 'Pós-Venda',
        title: 'Agradecimento pela Compra',
        icon: HeartHandshake,
        text: 'Muito obrigado pela sua compra, {cliente}! Seu pedido está sendo embalado com todo carinho. Logo mais te envio o código de rastreio! 💖',
    },
    {
        id: 'hours',
        category: 'Atendimento',
        title: 'Horário de Atendimento',
        icon: Clock,
        text: 'Nosso atendimento funciona de segunda a sábado das 09h às 19h. Responderemos sua mensagem com todo prazer!',
    },
];

export default function ConversationsIndex({
    conversations,
    activeConversation,
    messages,
    status,
    search,
    customers,
}) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
    const [quickReplies, setQuickReplies] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('alira_custom_quick_replies');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {}
            }
        }
        return DEFAULT_QUICK_REPLIES;
    });

    const [newReplyTitle, setNewReplyTitle] = useState('');
    const [newReplyText, setNewReplyText] = useState('');
    const [isAddingReply, setIsAddingReply] = useState(false);

    const messagesEndRef = useRef(null);

    const { data: msgData, setData: setMsgData, post: postMessage, processing: sendingMsg, reset: resetMsg } = useForm({
        body: '',
    });

    const { data: newChatData, setData: setNewChatData, post: postNewChat, processing: startingChat } = useForm({
        customer_id: '',
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeConversation]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!msgData.body.trim() || !activeConversation) return;

        postMessage(`/atendimentos/${activeConversation.id}/mensagens`, {
            preserveScroll: true,
            onSuccess: () => resetMsg(),
        });
    };

    const handleSelectQuickReply = (textTemplate) => {
        const clientName = activeConversation?.customer?.name ? activeConversation.customer.name.split(' ')[0] : 'Cliente';
        const formatted = textTemplate.replace('{cliente}', clientName);
        setMsgData('body', formatted);
        setIsQuickRepliesOpen(false);
    };

    const handleSaveNewReply = (e) => {
        e.preventDefault();
        if (!newReplyTitle.trim() || !newReplyText.trim()) return;

        const updated = [
            ...quickReplies,
            {
                id: 'custom_' + Date.now(),
                category: 'Personalizadas',
                title: newReplyTitle,
                icon: Bookmark,
                text: newReplyText,
            },
        ];

        setQuickReplies(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('alira_custom_quick_replies', JSON.stringify(updated));
        }
        setNewReplyTitle('');
        setNewReplyText('');
        setIsAddingReply(false);
    };

    const handleStatusFilter = (newStatus) => {
        router.get('/atendimentos', { status: newStatus, search: searchTerm }, { preserveState: true });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/atendimentos', { status, search: searchTerm }, { preserveState: true });
    };

    const handleUpdateStatus = (newStatus) => {
        if (!activeConversation) return;
        router.patch(`/atendimentos/${activeConversation.id}/status`, { status: newStatus }, { preserveScroll: true });
    };

    const handleStartNewChat = (e) => {
        e.preventDefault();
        postNewChat('/atendimentos/iniciar', {
            onSuccess: () => setIsNewChatModalOpen(false),
        });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    return (
        <AppLayout title="Central WhatsApp">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Central de Atendimento WhatsApp
                        <span className="p-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-sans font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                        </span>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Converse com clientes, utilize mensagens prontas e feche vendas diretamente pelo chat.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsNewChatModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        + Nova Conversa
                    </button>
                </div>
            </div>

            {/* Chat Application Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[580px]">
                {/* Left Sidebar: Conversations List (4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                    {/* Search & Filter bar */}
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
                        <form onSubmit={handleSearchSubmit} className="relative mb-2.5">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar cliente ou WhatsApp..."
                                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition"
                            />
                        </form>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                            {[
                                { label: 'Todas', value: 'all' },
                                { label: 'Abertas', value: 'open' },
                                { label: 'Em Atendimento', value: 'in_progress' },
                                { label: 'Finalizadas', value: 'closed' },
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => handleStatusFilter(tab.value)}
                                    className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 ${
                                        status === tab.value
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversations Scrollable List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {conversations && conversations.length > 0 ? (
                            conversations.map((conv) => {
                                const isActive = activeConversation?.id === conv.id;
                                const hasUnread = conv.unread_count > 0;

                                return (
                                    <Link
                                        key={conv.id}
                                        href={`/atendimentos?chat=${conv.id}&status=${status}&search=${searchTerm}`}
                                        preserveState
                                        className={`p-3.5 flex items-start gap-3 transition-colors text-left block relative ${
                                            isActive
                                                ? 'bg-blue-50/70 border-l-4 border-blue-600'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                                {conv.customer?.name
                                                    ? conv.customer.name.substring(0, 2).toUpperCase()
                                                    : 'WA'}
                                            </div>
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <h4 className="font-bold text-xs text-slate-900 truncate">
                                                    {conv.customer?.name || conv.external_chat_id}
                                                </h4>
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {conv.last_message_at
                                                        ? new Date(conv.last_message_at).toLocaleTimeString('pt-BR', {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : ''}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-slate-500 truncate leading-relaxed">
                                                {conv.last_message_preview || 'Conversa iniciada'}
                                            </p>

                                            <div className="flex items-center justify-between mt-1.5">
                                                <span
                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                                        conv.status === 'open'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : conv.status === 'in_progress'
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {conv.status === 'open'
                                                        ? 'Aberta'
                                                        : conv.status === 'in_progress'
                                                        ? 'Em curso'
                                                        : 'Finalizada'}
                                                </span>

                                                {hasUnread && (
                                                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-xs text-slate-400">
                                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                Nenhuma conversa encontrada.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Active Chat Window (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden relative">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-3.5 border-b border-slate-100 bg-white flex items-center justify-between gap-3 shadow-2xs z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                                        {activeConversation.customer?.name
                                            ? activeConversation.customer.name.substring(0, 2).toUpperCase()
                                            : 'WA'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-sm flex items-center gap-2">
                                            {activeConversation.customer?.name || activeConversation.external_chat_id}
                                            <span className="text-[11px] font-normal text-slate-400 font-mono">
                                                {activeConversation.customer?.whatsapp || activeConversation.external_chat_id}
                                            </span>
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            {activeConversation.customer?.total_spent > 0 ? (
                                                <>
                                                    Total gasto: <b className="text-emerald-600">{formatCurrency(activeConversation.customer.total_spent)}</b> ({activeConversation.customer.total_purchases} compras) ·{' '}
                                                    <Link
                                                        href={`/clientes/${activeConversation.customer.id}`}
                                                        className="text-blue-600 hover:underline font-semibold"
                                                    >
                                                        Ver Perfil 360°
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    Cliente sem histórico prévio ·{' '}
                                                    <Link
                                                        href={`/clientes/${activeConversation.customer.id}`}
                                                        className="text-blue-600 hover:underline font-semibold"
                                                    >
                                                        Ver Perfil 360°
                                                    </Link>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={activeConversation.status}
                                        onChange={(e) => handleUpdateStatus(e.target.value)}
                                        className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 outline-none hover:bg-slate-50 transition shadow-2xs"
                                    >
                                        <option value="open">Aberta</option>
                                        <option value="in_progress">Em Atendimento</option>
                                        <option value="closed">Finalizada</option>
                                    </select>

                                    {activeConversation.customer_id && (
                                        <Link
                                            href={`/vendas/nova?customer_id=${activeConversation.customer_id}`}
                                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Nova Venda</span>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] bg-radial from-slate-100/50 to-transparent">
                                {messages && messages.length > 0 ? (
                                    messages.map((msg) => {
                                        const isOutbound = msg.direction === 'outbound';
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] sm:max-w-md p-3.5 rounded-2xl text-xs shadow-xs relative ${
                                                        isOutbound
                                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                                                    <div
                                                        className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                                                            isOutbound ? 'text-blue-100' : 'text-slate-400'
                                                        }`}
                                                    >
                                                        <span>
                                                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                        {isOutbound && <CheckCheck className="w-3 h-3 text-blue-200" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                        Nenhuma mensagem nesta conversa ainda.
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Replies Chips Bar */}
                            <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/70 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickRepliesOpen(true)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold border border-amber-300/60 shadow-2xs transition shrink-0"
                                >
                                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                                    <span>Mensagens Prontas</span>
                                </button>

                                {quickReplies.slice(0, 4).map((qr) => (
                                    <button
                                        key={qr.id}
                                        type="button"
                                        onClick={() => handleSelectQuickReply(qr.text)}
                                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/80 shadow-2xs transition shrink-0 truncate max-w-[170px]"
                                        title={qr.text}
                                    >
                                        {qr.title}
                                    </button>
                                ))}
                            </div>

                            {/* Message Input Box */}
                            <form onSubmit={handleSendMessage} className="p-3 bg-white flex items-center gap-2 border-t border-slate-100">
                                <input
                                    type="text"
                                    value={msgData.body}
                                    onChange={(e) => setMsgData('body', e.target.value)}
                                    placeholder="Digite sua mensagem ou escolha uma pronta acima..."
                                    className="flex-1 text-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingMsg || !msgData.body.trim()}
                                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-slate-800 font-['Space_Grotesk'] text-base">
                                Selecione uma conversa ao lado
                            </h3>
                            <p className="text-xs text-slate-400 max-w-sm mt-1">
                                Ou clique em <b>+ Nova Conversa</b> para iniciar um atendimento com um cliente cadastrado.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL: CATÁLOGO DE MENSAGENS PRONTAS ── */}
            {isQuickRepliesOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                    <Zap className="w-5 h-5 fill-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                        Catálogo de Mensagens Prontas (WhatsApp)
                                    </h3>
                                    <p className="text-xs text-slate-400">Clique para preencher o chat automaticamente com dados do cliente</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setIsQuickRepliesOpen(false); setIsAddingReply(false); }}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List of Replies */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {quickReplies.map((qr) => {
                                const IconComponent = qr.icon || Bookmark;
                                return (
                                    <div
                                        key={qr.id}
                                        onClick={() => handleSelectQuickReply(qr.text)}
                                        className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition group relative"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 transition">
                                                    <IconComponent className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition">
                                                    {qr.title}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                                    {qr.category}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                                                Usar Mensagem →
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 group-hover:bg-white p-2.5 rounded-xl border border-slate-100">
                                            {qr.text}
                                        </p>
                                    </div>
                                );
                            })}

                            {/* Add Custom Reply Drawer */}
                            {isAddingReply ? (
                                <form onSubmit={handleSaveNewReply} className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-3 mt-4">
                                    <h4 className="font-bold text-xs text-slate-800">Criar Nova Resposta Pronta</h4>
                                    <input
                                        type="text"
                                        value={newReplyTitle}
                                        onChange={(e) => setNewReplyTitle(e.target.value)}
                                        placeholder="Título (ex: Promoção Fim de Semana)"
                                        required
                                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl"
                                    />
                                    <textarea
                                        value={newReplyText}
                                        onChange={(e) => setNewReplyText(e.target.value)}
                                        placeholder="Texto da mensagem (use {cliente} para o nome automático)"
                                        rows={3}
                                        required
                                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingReply(false)}
                                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                                        >
                                            Salvar Mensagem
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsAddingReply(true)}
                                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 transition flex items-center justify-center gap-1.5 mt-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Nova Mensagem Personalizada
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Iniciar Nova Conversa */}
            {isNewChatModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                Iniciar Conversa WhatsApp
                            </h3>
                            <button
                                onClick={() => setIsNewChatModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleStartNewChat} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Selecione o Cliente
                                </label>
                                <select
                                    value={newChatData.customer_id}
                                    onChange={(e) => setNewChatData('customer_id', e.target.value)}
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                                >
                                    <option value="">Escolha um cliente cadastrado...</option>
                                    {customers &&
                                        customers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.whatsapp || 'sem whats'})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsNewChatModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={startingChat || !newChatData.customer_id}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                                >
                                    {startingChat ? 'Abrindo...' : 'Abrir Atendimento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
