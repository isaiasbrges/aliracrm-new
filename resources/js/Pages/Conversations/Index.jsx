import React, { useState, useEffect, useRef } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    MessageSquare,
    Send,
    Search,
    Plus,
    Minus,
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
    ListOrdered,
    CheckSquare,
    Layers,
    SlidersHorizontal,
} from 'lucide-react';

const DEFAULT_QUICK_REPLIES = [
    {
        id: 'welcome',
        category: 'Boas-Vindas',
        title: 'Boas-Vindas & Recepção',
        icon: Smile,
        text: 'Olá {cliente}! Seja muito bem-vinda(o) à Dyvinuss Looks! Como posso te ajudar hoje? ✨',
    },
    {
        id: 'catalog',
        category: 'Catálogo',
        title: 'Link do Catálogo Online',
        icon: ShoppingBag,
        text: 'Olá {cliente}! Você pode conferir todos os nossos looks disponíveis, fotos e tamanhos no nosso catálogo online: https://aliracrm.site/catalogo ✨ Basta escolher suas peças favoritas e me avisar aqui!',
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
        id: 'shipping',
        category: 'Envio & Frete',
        title: 'Frete & Prazo de Entrega',
        icon: Package,
        text: 'Enviamos para todo o Brasil via Sedex/PAC e Motoboy para entregas locais. Me informe seu CEP que já calculo o prazo e o frete com as melhores condições!',
    },
    {
        id: 'post_sale',
        category: 'Pós-Venda',
        title: 'Agradecimento & Rastreio',
        icon: HeartHandshake,
        text: 'Muito obrigado pela sua compra, {cliente}! Seu pedido está sendo embalado com muito carinho. Assim que for postado, envio o código de rastreamento por aqui! 💖',
    },
];

/* ── Templates Prontos de Opções Selecionáveis para WhatsApp ── */
const INTERACTIVE_OPTION_TEMPLATES = [
    {
        title: 'Menu de Atendimento VIP',
        prompt: 'Olá {cliente}! Como podemos te atender hoje na Dyvinuss Looks?',
        options: [
            '1. 🛍️ Ver Catálogo Online',
            '2. 👗 Lançamentos & Vestidos',
            '3. 💬 Falar com Consultora VIP',
            '4. 💳 Formas de Pagamento & PIX',
        ],
    },
    {
        title: 'Consultoria de Tamanhos',
        prompt: 'Qual tamanho de look você costuma vestir?',
        options: [
            '1. Tamanho P (36-38)',
            '2. Tamanho M (40)',
            '3. Tamanho G (42-44)',
            '4. Tamanho GG (46+)',
        ],
    },
    {
        title: 'Formas de Entrega / Frete',
        prompt: 'Como prefere receber suas peças?',
        options: [
            '1. 🛵 Entrega Express (Motoboy)',
            '2. 📦 Correios / Sedex',
            '3. 🛍️ Retirada na Loja',
        ],
    },
    {
        title: 'Confirmação de Pagamento',
        prompt: 'Qual a sua preferência para pagamento?',
        options: [
            '1. 💰 PIX com 5% de Desconto',
            '2. 💳 Cartão de Crédito em até 6x',
            '3. 🔗 Link de Pagamento',
        ],
    },
];

export default function ConversationsIndex({
    conversations,
    activeConversation,
    messages,
    customers,
    status,
    search,
}) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
    const [isInteractiveModalOpen, setIsInteractiveModalOpen] = useState(false);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    // Form de Mensagem Interativa com Opções
    const [interactiveTitle, setInteractiveTitle] = useState('Como podemos te atender hoje?');
    const [interactiveOptions, setInteractiveOptions] = useState([
        '1. 🛍️ Ver Catálogo Online',
        '2. 👗 Lançamentos & Vestidos',
        '3. 💬 Falar com Consultora VIP',
    ]);
    const [sendingInteractive, setSendingInteractive] = useState(false);

    // Modal de Cobrança PIX Rápida
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [pixAmount, setPixAmount] = useState('');
    const [pixKey, setPixKey] = useState('pix@dyvinusslooks.com.br');
    const [pixBeneficiary, setPixBeneficiary] = useState('Dyvinuss Looks');

    const [quickReplies, setQuickReplies] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('alira_custom_quick_replies');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) {}
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

    /* ── Carregar Template Interativo ── */
    const handleSelectInteractiveTemplate = (tpl) => {
        const clientName = activeConversation?.customer?.name ? activeConversation.customer.name.split(' ')[0] : 'Cliente';
        setInteractiveTitle(tpl.prompt.replace('{cliente}', clientName));
        setInteractiveOptions([...tpl.options]);
    };

    const handleAddOption = () => {
        if (interactiveOptions.length < 10) {
            setInteractiveOptions([...interactiveOptions, `${interactiveOptions.length + 1}. Nova Opção`]);
        }
    };

    const handleRemoveOption = (index) => {
        if (interactiveOptions.length > 2) {
            setInteractiveOptions(interactiveOptions.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index, value) => {
        const updated = [...interactiveOptions];
        updated[index] = value;
        setInteractiveOptions(updated);
    };

    /* ── Enviar Mensagem Interativa no WhatsApp ── */
    const handleSendInteractiveSubmit = (e) => {
        e.preventDefault();
        if (!activeConversation || !interactiveTitle.trim()) return;

        const cleanOptions = interactiveOptions.map((o) => o.trim()).filter(Boolean);
        if (cleanOptions.length < 2) {
            alert('Adicione pelo menos 2 opções para o cliente.');
            return;
        }

        setSendingInteractive(true);
        router.post(
            `/atendimentos/${activeConversation.id}/interativo`,
            {
                title: interactiveTitle,
                options: cleanOptions,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsInteractiveModalOpen(false);
                    setSendingInteractive(false);
                },
                onError: () => setSendingInteractive(false),
            }
        );
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
                        Converse com clientes, envie mensagens com opções clicáveis e feche pedidos diretamente pelo chat.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/funil"
                        className="inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs shrink-0"
                        title="Ir para o Funil de Vendas e Disparos em Massa"
                    >
                        <Zap className="w-4 h-4 text-indigo-600 fill-indigo-500" />
                        <span>Disparos & Anti-Ban</span>
                    </Link>

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
                                            {conv.channel === 'whatsapp' && (
                                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white">
                                                    <Phone className="w-2 h-2" />
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <h4 className="font-bold text-xs text-slate-900 truncate">
                                                    {conv.customer?.name || `WhatsApp ${conv.external_chat_id}`}
                                                </h4>
                                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                                    {conv.last_message_at
                                                        ? new Date(conv.last_message_at).toLocaleTimeString('pt-BR', {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : ''}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 truncate leading-snug">
                                                {conv.last_message_preview || 'Nova conversa'}
                                            </p>
                                        </div>

                                        {hasUnread && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 self-center" />
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

                {/* Right Chat & CRM Panel (8 cols) */}
                {activeConversation ? (
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                    {activeConversation.customer?.name
                                        ? activeConversation.customer.name.substring(0, 2).toUpperCase()
                                        : 'WA'}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-slate-900 truncate">
                                            {activeConversation.customer?.name || 'Cliente WhatsApp'}
                                        </h3>
                                        <span className="text-[11px] font-mono text-slate-500">
                                            ({activeConversation.external_chat_id})
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate">
                                        Atendimento via WhatsApp · Instância Dyvinuss Looks
                                    </p>
                                </div>
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={activeConversation.status}
                                    onChange={(e) => handleUpdateStatus(e.target.value)}
                                    className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none hover:bg-slate-50 transition"
                                >
                                    <option value="open">Aberta</option>
                                    <option value="in_progress">Em Atendimento</option>
                                    <option value="closed">Finalizada</option>
                                </select>

                                {activeConversation.customer && (
                                    <Link
                                        href={`/clientes/${activeConversation.customer.id}`}
                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                                        title="Ver Perfil 360° do Cliente"
                                    >
                                        <User className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
                            {messages && messages.length > 0 ? (
                                messages.map((msg) => {
                                    const isOutbound = msg.direction === 'outbound';
                                    const isInteractive = msg.type === 'interactive' || msg.body?.startsWith('📊');

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[78%] p-3.5 rounded-2xl shadow-xs ${
                                                    isOutbound
                                                        ? isInteractive
                                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none border border-indigo-400/40'
                                                            : 'bg-blue-600 text-white rounded-tr-none'
                                                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                                                }`}
                                            >
                                                {isInteractive && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-1">
                                                        <ListOrdered className="w-3.5 h-3.5" />
                                                        Opções Selecionáveis Enviadas
                                                    </div>
                                                )}
                                                <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.body}</p>
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

                        {/* Quick Replies & Interactive Options Chips Bar */}
                        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/70 flex items-center gap-2 overflow-x-auto text-[11px]">
                            {/* Botão de Cobrança PIX */}
                            <button
                                type="button"
                                onClick={() => setIsPixModalOpen(true)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition shrink-0 active:scale-95"
                                title="Gerar cobrança PIX com valor e chave para o cliente"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Cobrança PIX</span>
                            </button>

                            {/* Botão de Enviar Opções Selecionáveis */}
                            <button
                                type="button"
                                onClick={() => setIsInteractiveModalOpen(true)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition shrink-0 active:scale-95"
                                title="Enviar mensagem com opções para o cliente clicar no WhatsApp"
                            >
                                <ListOrdered className="w-3.5 h-3.5" />
                                <span>Enviar Opções / Menu</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsQuickRepliesOpen(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold border border-amber-300/60 shadow-2xs transition shrink-0"
                            >
                                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                                <span>Mensagens Prontas</span>
                            </button>

                            {quickReplies.slice(0, 3).map((qr) => (
                                <button
                                    key={qr.id}
                                    type="button"
                                    onClick={() => handleSelectQuickReply(qr.text)}
                                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/80 shadow-2xs transition shrink-0 truncate max-w-[170px]"
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
                                placeholder="Digite sua mensagem ou escolha uma opção acima..."
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
                    </div>
                ) : (
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg">
                            Nenhum Atendimento Selecionado
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                            Selecione uma conversa ao lado para responder seus clientes ou inicie um novo atendimento no WhatsApp.
                        </p>
                        <button
                            onClick={() => setIsNewChatModalOpen(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                        >
                            + Iniciar Nova Conversa
                        </button>
                    </div>
                )}
            </div>

            {/* ── MODAL: ENVIAR MENSAGEM COM OPÇÕES SELECIONÁVEIS (POLL / MENU) ── */}
            {isInteractiveModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                                    <ListOrdered className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                        Enviar Opções Selecionáveis
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        O cliente recebe botões no WhatsApp para clicar e responder com 1 toque!
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsInteractiveModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSendInteractiveSubmit} className="space-y-4 py-3 overflow-y-auto flex-1">
                            {/* Templates Rápidos */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    Modelos Prontos de Opções:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {INTERACTIVE_OPTION_TEMPLATES.map((tpl, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectInteractiveTemplate(tpl)}
                                            className="p-2 text-left rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-900 transition flex flex-col justify-between"
                                        >
                                            <span className="font-bold">{tpl.title}</span>
                                            <span className="text-[10px] text-purple-600 mt-1">{tpl.options.length} opções</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Título / Pergunta */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Pergunta / Título do Menu *
                                </label>
                                <input
                                    type="text"
                                    value={interactiveTitle}
                                    onChange={(e) => setInteractiveTitle(e.target.value)}
                                    placeholder="Ex: Como podemos te atender hoje?"
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                                />
                            </div>

                            {/* Lista de Opções */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Opções para o Cliente Escolher ({interactiveOptions.length}) *
                                    </label>
                                    {interactiveOptions.length < 10 && (
                                        <button
                                            type="button"
                                            onClick={handleAddOption}
                                            className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> + Adicionar Opção
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {interactiveOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                placeholder={`Opção ${idx + 1}`}
                                                required
                                                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 outline-none transition"
                                            />
                                            {interactiveOptions.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOption(idx)}
                                                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsInteractiveModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingInteractive || !interactiveTitle.trim()}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {sendingInteractive ? 'Enviando...' : 'Enviar Opções no WhatsApp'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: GERAR COBRANÇA PIX RÁPIDA ── */}
            {isPixModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <QrCode className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                        Gerador de PIX Copia-e-Cola
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Preencha o valor para formatar a cobrança no WhatsApp
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPixModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 py-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Valor a Cobrar (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={pixAmount}
                                    onChange={(e) => setPixAmount(e.target.value)}
                                    placeholder="Ex: 189.90"
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-mono font-bold text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Chave PIX da Loja
                                </label>
                                <input
                                    type="text"
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Beneficiário / Nome da Loja
                                </label>
                                <input
                                    type="text"
                                    value={pixBeneficiary}
                                    onChange={(e) => setPixBeneficiary(e.target.value)}
                                    placeholder="Dyvinuss Looks"
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPixModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const clientName = activeConversation?.customer?.name ? activeConversation.customer.name.split(' ')[0] : 'Cliente';
                                    const formattedVal = pixAmount ? `R$ ${parseFloat(pixAmount).toFixed(2).replace('.', ',')}` : 'R$ [Valor]';
                                    const text = `✨ *Dados para Pagamento PIX - Dyvinuss Looks* ✨\n\nOlá, ${clientName}! Seguem os dados para pagamento do seu pedido:\n\n💰 *Valor Total:* ${formattedVal}\n🔑 *Chave PIX:* ${pixKey || '[chave-pix-loja]'}\n👤 *Favorecido:* ${pixBeneficiary || 'Dyvinuss Looks'}\n\nAssim que realizar a transferência, basta nos enviar o comprovante por aqui para confirmarmos imediatamente! 💖`;
                                    setMsgData('body', text);
                                    setIsPixModalOpen(false);
                                }}
                                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center gap-1.5"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Inserir Cobrança no Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Mensagens Prontas (Quick Replies) */}
            {isQuickRepliesOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                    Catálogo de Mensagens Prontas
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsQuickRepliesOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-3 space-y-2">
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
