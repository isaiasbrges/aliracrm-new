import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    Kanban,
    MessageSquare,
    Package,
    Settings,
    Menu,
    X,
    ChevronDown,
    LogOut,
    PlusCircle,
    Search,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Calendar,
    Globe,
    ExternalLink,
    Store as StoreIcon,
} from 'lucide-react';

/* ── Utility: hex → "r g b" for CSS color-mix ── */
function hexToRgb(hex = '#ff007f') {
    const h = hex.replace('#', '');
    if (h.length === 3) {
        const r = parseInt(h[0] + h[0], 16);
        const g = parseInt(h[1] + h[1], 16);
        const b = parseInt(h[2] + h[2], 16);
        return `${r} ${g} ${b}`;
    }
    const r = parseInt(h.slice(0, 2), 16) || 255;
    const g = parseInt(h.slice(2, 4), 16) || 0;
    const b = parseInt(h.slice(4, 6), 16) || 127;
    return `${r} ${g} ${b}`;
}

export default function AppLayout({ title, children }) {
    const { auth, organization, store, flash, errors } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFlash, setShowFlash] = useState(true);

    const accentColor = store?.accent_color || '#ff007f';
    const logoUrl     = store?.logo_url || null;
    const currentUrl  = window.location.pathname;

    /* ── Inject brand color as CSS custom property globally ── */
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

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.get('/clientes', { search: searchQuery.trim() });
        }
    };

    const navItems = [
        { name: 'Dashboard',        href: '/',                  icon: LayoutDashboard, exact: true },
        { name: 'Funil de Vendas',  href: '/funil',             icon: Kanban },
        { name: 'Central WhatsApp', href: '/atendimentos',       icon: MessageSquare },
        { name: 'Catálogo Online',  href: '/catalogo/gerenciar', icon: Sparkles },
        { name: 'Clientes',         href: '/clientes',          icon: Users },
        { name: 'Vendas & PDV',     href: '/vendas',            icon: ShoppingBag },
        { name: 'Produtos',         href: '/produtos',          icon: Package },
        { name: 'Configurações',    href: '/configuracoes/loja', icon: Settings },
    ];

    const isActive = (item) =>
        item.exact ? currentUrl === item.href : currentUrl.startsWith(item.href);

    const activeStyle = { backgroundColor: accentColor, color: '#fff' };
    const activeRingStyle = { boxShadow: `0 4px 14px rgba(${hexToRgb(accentColor)}, 0.35)` };

    return (
        <div
            className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased selection:text-white"
            style={{
                '--brand': accentColor,
                '--brand-rgb': hexToRgb(accentColor),
            }}
        >
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

                {/* Store Branding Box & Quick Link to Public Catalog */}
                <div className={`px-4 py-3.5 ${sidebarCollapsed ? 'hidden lg:block lg:px-2' : ''}`}>
                    <a
                        href="/catalogo"
                        target="_blank"
                        rel="noreferrer"
                        className={`bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner transition group ${sidebarCollapsed ? 'lg:justify-center lg:p-2' : ''}`}
                        title="Abrir Catálogo Público da Loja"
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
                                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5 group-hover:text-pink-300 transition">
                                        <Globe className="w-3 h-3 text-emerald-400" />
                                        <span>Ver Catálogo Online</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition shrink-0" />
                        )}
                    </a>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                style={active ? { ...activeStyle, ...activeRingStyle } : {}}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                                    active
                                        ? 'shadow-md font-bold'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                <item.icon
                                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                                        active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                                    }`}
                                />
                                {!sidebarCollapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-3 border-t border-slate-800/60">
                    <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-700/40 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <div
                            className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                            style={{ background: accentColor }}
                        >
                            {auth?.user?.name ? auth.user.name.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">
                                    {auth?.user?.name || 'Administrador'}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                    {auth?.user?.email || 'admin@alira.local'}
                                </p>
                            </div>
                        )}
                        {!sidebarCollapsed && (
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition"
                                title="Sair do Sistema"
                            >
                                <LogOut className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main Layout Column ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
                    <div className="flex items-center gap-3 flex-1 max-w-xl">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            title="Recolher Menu Lateral"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar clientes por nome, telefone ou e-mail..."
                                className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 rounded-xl border border-slate-200/80 focus:outline-none transition-all"
                                onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 4px ${accentColor}15`; }}
                                onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                                ⌘K
                            </span>
                        </form>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href="/catalogo"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold transition border border-slate-200/80 shadow-2xs"
                            title="Abrir vitrine pública do catálogo em nova aba"
                        >
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ver Catálogo</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>

                        <Link
                            href="/atendimentos"
                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition relative"
                            title="Central WhatsApp"
                            onMouseEnter={e => { e.currentTarget.style.color = accentColor; }}
                            onMouseLeave={e => { e.currentTarget.style.color = ''; }}
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
        </div>
    );
}
