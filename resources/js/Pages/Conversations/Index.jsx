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
    Sparkles
} from 'lucide-react';

export default function ConversationsIndex({
    conversations,
    activeConversation,
    messages,
    status,
    search,
    customers
}) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
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
                        Converse com clientes, tire dúvidas e feche vendas diretamente pelo chat.
                    </p>
                </div>

                <button
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    + Nova Conversa
                </button>
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
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                            />
                        </form>

                        {/* Status Tabs */}
                        <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl text-[11px] font-semibold text-slate-600">
                            {['all', 'open', 'closed'].map((tabKey) => (
                                <button
                                    key={tabKey}
                                    type="button"
                                    onClick={() => handleStatusFilter(tabKey)}
                                    className={`py-1.5 rounded-lg capitalize transition-all ${
                                        status === tabKey
                                            ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                            : 'hover:text-slate-900'
                                    }`}
                                >
                                    {tabKey === 'all' ? 'Todas' : tabKey === 'open' ? 'Abertas' : 'Finalizadas'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {conversations && conversations.length > 0 ? (
                            conversations.map((conv) => {
                                const isCurrent = activeConversation?.id === conv.id;
                                return (
                                    <Link
                                        key={conv.id}
                                        href={`/atendimentos?chat=${conv.id}&status=${status}&search=${searchTerm}`}
                                        className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors relative block text-left ${
                                            isCurrent ? 'bg-blue-50/80 hover:bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                            {conv.customer?.name ? conv.customer.name.substring(0, 2).toUpperCase() : 'WA'}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                                    {conv.customer?.name || `WhatsApp ${conv.external_chat_id}`}
                                                </h4>
                                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                                    {conv.last_message_at
                                                        ? new Date(conv.last_message_at).toLocaleTimeString('pt-BR', {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : ''}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                {conv.last_message_preview || 'Nova conversa'}
                                            </p>
                                        </div>

                                        {conv.unread_count > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-xs text-slate-400">
                                Nenhuma conversa encontrada.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Active Chat (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        {activeConversation.customer?.name
                                            ? activeConversation.customer.name.substring(0, 2).toUpperCase()
                                            : 'WA'}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs font-bold text-slate-900 truncate">
                                            {activeConversation.customer?.name || `WhatsApp ${activeConversation.external_chat_id}`}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                {activeConversation.external_chat_id}
                                            </span>
                                            {activeConversation.customer && (
                                                <>
                                                    <span>•</span>
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

                            {/* Message Input Box */}
                            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                                <input
                                    type="text"
                                    value={msgData.body}
                                    onChange={(e) => setMsgData('body', e.target.value)}
                                    placeholder="Digite sua mensagem no WhatsApp..."
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
                                    Selecione o Cliente *
                                </label>
                                <select
                                    value={newChatData.customer_id}
                                    onChange={(e) => setNewChatData('customer_id', e.target.value)}
                                    required
                                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    <option value="">-- Escolha um cliente cadastrado --</option>
                                    {customers?.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.whatsapp})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsNewChatModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={startingChat || !newChatData.customer_id}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                                >
                                    {startingChat ? 'Iniciando...' : 'Abrir Atendimento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
