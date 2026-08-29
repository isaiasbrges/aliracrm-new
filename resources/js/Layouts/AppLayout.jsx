import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Kanban,
    MessageSquare,
    Users,
    ShoppingBag,
    Package,
    PlusCircle,
    Search,
    LogOut,
    Menu,
    X,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Settings,
    Sparkles,
    ShieldCheck,
    RefreshCw,
    QrCode,
    Smartphone,
    Activity,
    Clock,
    Zap,
    ExternalLink,
} from 'lucide-react';

/* ── Utility: hex → "r g g" for CSS color-mix ── */
function hexToRgb(hex = '#db2777') {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
}

export default function AppLayout({ title, children }) {
    const { auth, organization, store, flash, errors } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFlash, setShowFlash] = useState(true);

    // Estados do Verificador Real de WhatsApp
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState({
        connected: false,
        state: 'checking',
        loading: false,
        chip_health: null,
        instance: store?.slug || 'dyvinus',
    });
    const [qrCodeData, setQrCodeData] = useState(null);
    const [loadingQr, setLoadingQr] = useState(false);

    const accentColor = store?.accent_color || '#db2777';
    const logoUrl     = store?.logo_url || null;
    const currentUrl  = window.location.pathname;

    /* ── Fetch Real-time WhatsApp Status ── */
    const checkWhatsAppStatus = async () => {
        setWhatsappStatus((prev) => ({ ...prev, loading: true }));
        try {
            const res = await fetch('/api/whatsapp/status');
            if (res.ok) {
                const data = await res.json();
                setWhatsappStatus({
                    connected: data.connected,
                    state: data.state,
                    loading: false,
                    chip_health: data.chip_health,
                    instance: data.instance,
                    raw: data,
                });
            } else {
                setWhatsappStatus((prev) => ({ ...prev, loading: false, connected: false, state: 'error' }));
            }
        } catch (e) {
            setWhatsappStatus((prev) => ({ ...prev, loading: false, connected: false, state: 'error' }));
        }
    };

    /* ── Fetch Live QR Code ── */
    const fetchQrCode = async () => {
        setLoadingQr(true);
        try {
            const res = await fetch('/api/whatsapp/qrcode');
            if (res.ok) {
                const data = await res.json();
                setQrCodeData(data);
            }
        } catch (e) {
            console.error('Erro ao buscar QR Code:', e);
        } finally {
            setLoadingQr(false);
        }
    };

    useEffect(() => {
        checkWhatsAppStatus();
        const interval = setInterval(checkWhatsAppStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    /* ── Inject brand color as CSS custom property ── */
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--brand', accentColor);
        root.style.setProperty('--brand-rgb', hexToRgb(accentColor));
    }, [accentColor]);

    useEffect(() => {
        if (flash?.success || flash?.error || Object.keys(errors || {}).length > 0) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash, errors]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) router.get('/clientes', { search: searchQuery });
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const navItems = [
        { name: 'Dashboard',        href: '/',                  icon: LayoutDashboard, exact: true },
        { name: 'Funil de Vendas',  href: '/funil',             icon: Kanban },
        { name: 'Central WhatsApp', href: '/atendimentos',       icon: MessageSquare },
        { name: 'Catálogo Online',  href: '/catalogo/gerenciar', icon: Sparkles },
        { name: 'Clientes',         href: '/clientes',          icon: Users },
        { name: 'Vendas & PDV',     href: '/vendas',            icon: ShoppingBag },
        { name: 'Produtos',         href: '/produtos',          icon: Package },
    ];

    const isActive = (item) =>
        item.exact ? currentUrl === item.href : currentUrl.startsWith(item.href);

    const activeStyle = { backgroundColor: accentColor, color: '#fff' };
    const activeRingStyle = { boxShadow: `0 4px 14px rgba(${hexToRgb(accentColor)}, 0.35)` };

    return (
        <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased selection:text-white"
             style={{ '--brand': accentColor, '--brand-rgb': hexToRgb(accentColor), 'selectionBackground': accentColor }}>
            <Head title={title} />

            {/* Mobile Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-[#09132b] text-slate-300 flex flex-col border-r border-slate-800/80 transition-all duration-300 ease-in-out lg:static shrink-0 shadow-2xl lg:shadow-none ${
                    mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
                } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} lg:translate-x-0`}
            >
                {/* Brand / Logo */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                    <Link href="/" className="flex items-center gap-2.5 group min-w-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={store?.name || 'Logo'}
                                className="w-9 h-9 rounded-xl object-contain bg-white p-1 shadow group-hover:scale-105 transition-transform duration-200 shrink-0"
                            />
                        ) : (
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-200 shrink-0"
                                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
                            >
                                <Sparkles className="w-5 h-5" />
                            </div>
                        )}
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-1.5 font-['Space_Grotesk'] text-xl font-bold text-white tracking-tight min-w-0">
                                <span className="truncate">{store?.name || 'Dyvinuss Looks'}</span>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Store Branding Box & Live WhatsApp Trigger */}
                <div className={`px-4 py-3.5 ${sidebarCollapsed ? 'hidden lg:block lg:px-2' : ''}`}>
                    <div
                        onClick={() => setWhatsappModalOpen(true)}
                        className={`bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner cursor-pointer transition group ${sidebarCollapsed ? 'lg:justify-center lg:p-2' : ''}`}
                        title="Verificar Conexão do WhatsApp & Saúde do Chip"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md"
                                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
                            >
                                {store?.name ? store.name.substring(0, 2).toUpperCase() : 'DY'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-semibold text-white truncate tracking-tight">
                                        {store?.name || 'Dyvinuss Looks'}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full inline-block ${whatsappStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                                        <span>{whatsappStatus.connected ? 'WhatsApp Online' : 'WhatsApp Offline'}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                title={sidebarCollapsed ? item.name : undefined}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? `text-white font-semibold ${sidebarCollapsed ? '' : 'translate-x-1'}`
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                } ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                                style={active ? { ...activeStyle, ...activeRingStyle } : {}}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Profile */}
                <div className="p-3 border-t border-slate-800/60">
                    <div className={`flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
                            >
                                {auth?.user?.name ? auth.user.name.substring(0, 2).toUpperCase() : 'IS'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-white truncate">{auth?.user?.name || 'Isaias'}</p>
                                    <p className="text-[10px] text-slate-400 truncate capitalize">{auth?.user?.role || 'Admin'}</p>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <form onSubmit={handleLogout}>
                                <button
                                    type="submit"
                                    title="Sair"
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main Layout Column ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
                    <div className="flex items-center gap-3 flex-1 max-w-lg">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:block p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            title="Recolher / Expandir Menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar clientes por nome, telefone ou e-mail..."
                                className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 rounded-xl border border-slate-200/80 focus:outline-none transition-all"
                                style={{ '--tw-ring-color': `${accentColor}20` }}
                                onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 4px ${accentColor}15`; }}
                                onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                                ⌘K
                            </span>
                        </form>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Verificador Real de Conexão WhatsApp */}
                        <button
                            onClick={() => setWhatsappModalOpen(true)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border ${
                                whatsappStatus.connected
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 animate-pulse'
                            }`}
                            title="Verificar Conexão Real do WhatsApp"
                        >
                            <span className={`w-2 h-2 rounded-full ${whatsappStatus.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="hidden sm:inline">
                                {whatsappStatus.connected ? 'WhatsApp Online' : 'Conectar WhatsApp'}
                            </span>
                            <RefreshCw className={`w-3 h-3 ${whatsappStatus.loading ? 'animate-spin' : ''}`} />
                        </button>

                        <Link
                            href="/atendimentos"
                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition relative"
                            title="Central WhatsApp"
                            style={{}} onMouseEnter={e => { e.currentTarget.style.color = accentColor; }} onMouseLeave={e => { e.currentTarget.style.color = ''; }}
                        >
                            <MessageSquare className="w-5 h-5" />
                        </Link>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-xl text-slate-600 text-xs font-medium border border-slate-200/60">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                                {new Date().toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                })}
                            </span>
                        </div>

                        <Link
                            href="/vendas/nova"
                            className="hidden sm:inline-flex items-center gap-2 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95"
                            style={{ background: accentColor, boxShadow: `0 2px 8px rgba(${hexToRgb(accentColor)}, 0.3)` }}
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Nova Venda</span>
                        </Link>
                    </div>
                </header>

                {/* Content Shell */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {/* Flash Success */}
                    {showFlash && flash?.success && (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <p className="text-sm font-medium">{flash.success}</p>
                            </div>
                            <button onClick={() => setShowFlash(false)} className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Flash Error */}
                    {showFlash && flash?.error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <p className="text-sm font-medium">{flash.error}</p>
                            </div>
                            <button onClick={() => setShowFlash(false)} className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-100 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {children}
                </main>
            </div>

            {/* ── MODAL: CENTRAL DE CONEXÃO WHATSAPP REAL & SAÚDE DO CHIP ── */}
            {whatsappModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                                    whatsappStatus.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base flex items-center gap-2">
                                        Conexão WhatsApp & Anti-Ban
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            whatsappStatus.connected
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            {whatsappStatus.connected ? '🟢 Conectado' : '🔴 Desconectado'}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400">Instância ativa: <b className="text-slate-700">{whatsappStatus.instance}</b></p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setWhatsappModalOpen(false); setQrCodeData(null); }}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 py-4 overflow-y-auto">
                            {/* Card de Saúde do Chip & Disparos */}
                            {whatsappStatus.chip_health && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-bold text-slate-800">Proteção Anti-Ban & Cota de Disparos</span>
                                        </div>
                                        <span className="text-xs font-extrabold text-emerald-600">
                                            {whatsappStatus.chip_health.dispatches_today} / {whatsappStatus.chip_health.daily_limit} hoje
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${whatsappStatus.chip_health.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <span>Restam <b>{whatsappStatus.chip_health.remaining}</b> disparos seguros</span>
                                        <span>{whatsappStatus.chip_health.is_commercial_hour ? '🕒 Horário Comercial 🟢' : '🕒 Fora de Horário ⚠️'}</span>
                                    </div>
                                </div>
                            )}

                            {/* Status da Conexão */}
                            {whatsappStatus.connected ? (
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        WhatsApp Operando com Sucesso!
                                    </div>
                                    <p className="text-emerald-700 leading-relaxed">
                                        A instância <b>{whatsappStatus.instance}</b> está online. Todas as mensagens enviadas ou recebidas são sincronizadas em tempo real com o Alira CRM.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-3">
                                    <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                                        <AlertCircle className="w-5 h-5 text-rose-600" />
                                        WhatsApp Desconectado
                                    </div>
                                    <p className="text-rose-700 leading-relaxed">
                                        Gere o QR Code abaixo e escaneie no aplicativo do WhatsApp (Aparelhos Conectados) do seu celular para ativar o atendimento.
                                    </p>

                                    {/* QR Code Container */}
                                    {qrCodeData?.base64 ? (
                                        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                                            <img
                                                src={qrCodeData.base64}
                                                alt="QR Code WhatsApp"
                                                className="w-48 h-48 mx-auto rounded-xl shadow-sm"
                                            />
                                            <p className="text-[11px] text-slate-500 font-semibold">
                                                Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={fetchQrCode}
                                            disabled={loadingQr}
                                            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            {loadingQr ? 'Gerando QR Code...' : 'Gerar QR Code na Tela'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <a
                                href={`${whatsappStatus.raw?.evolution_api_url || 'https://evolution.aliracrm.site'}/manager`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                            >
                                Abrir Evolution Manager <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                                type="button"
                                onClick={checkWhatsAppStatus}
                                disabled={whatsappStatus.loading}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${whatsappStatus.loading ? 'animate-spin' : ''}`} />
                                Testar Conexão Agora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
