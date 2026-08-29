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
} from 'lucide-react';

/* ── Utility: hex → "r g g" for CSS color-mix ── */
function hexToRgb(hex = '#2563eb') {
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

    const accentColor = store?.accent_color || '#2563eb';
    const logoUrl     = store?.logo_url || null;
    const currentUrl  = window.location.pathname;

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
        { name: 'Dashboard',       href: '/',            icon: LayoutDashboard, exact: true },
        { name: 'Funil de Vendas', href: '/funil',       icon: Kanban },
        { name: 'Central WhatsApp',href: '/atendimentos', icon: MessageSquare },
        { name: 'Clientes',        href: '/clientes',    icon: Users },
        { name: 'Vendas & PDV',    href: '/vendas',      icon: ShoppingBag },
        { name: 'Produtos',        href: '/produtos',    icon: Package },
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
                                <span className="truncate">{store?.name || 'Alira CRM'}</span>
                                {!logoUrl && (
                                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md font-sans shrink-0"
                                          style={{ background: `${accentColor}33`, color: accentColor, border: `1px solid ${accentColor}55` }}>
                                        CRM
                                    </span>
                                )}
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

                {/* Workspace Badge & Store Manager */}
                <div className={`px-4 py-3.5 ${sidebarCollapsed ? 'hidden lg:block lg:px-2' : ''}`}>
                    <Link
                        href="/configuracoes/loja"
                        title="Gerenciar / Criar Lojas e Filiais"
                        className={`bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3 flex items-center justify-between gap-3 transition-all shadow-inner group ${sidebarCollapsed ? 'lg:justify-center lg:p-2' : ''}`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md"
                                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
                            >
                                {organization?.name ? organization.name.substring(0, 2).toUpperCase() : 'AL'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-semibold text-white truncate tracking-tight">
                                        {organization?.name || 'Alira Enterprise'}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                        {store?.name || 'Loja Matriz'}
                                    </p>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <span className="text-[10px] bg-slate-700 text-slate-300 group-hover:bg-blue-600 group-hover:text-white px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0">
                                Lojas
                            </span>
                        )}
                    </Link>
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
                                {!sidebarCollapsed && <span className="flex-1">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* PDV Shortcut */}
                <div className={`p-3 mx-3 mb-3 rounded-2xl relative overflow-hidden shadow-lg ${sidebarCollapsed ? 'hidden lg:block lg:mx-2 lg:p-2' : ''}`}
                     style={{ background: `linear-gradient(145deg, ${accentColor}22, ${accentColor}11)`, border: `1px solid ${accentColor}33` }}>
                    <div className="relative z-10 flex flex-col items-center">
                        {!sidebarCollapsed && (
                            <>
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1 w-full"
                                     style={{ color: accentColor }}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Frente de Caixa
                                </div>
                                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed w-full">
                                    Abra o PDV com 1 clique para registrar vendas instantâneas.
                                </p>
                            </>
                        )}
                        <Link
                            href="/vendas/nova"
                            title={sidebarCollapsed ? "Nova Venda (PDV)" : undefined}
                            className={`flex items-center justify-center gap-2 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-md transition-all transform active:scale-95 ${sidebarCollapsed ? 'w-full !px-0' : 'w-full'}`}
                            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, boxShadow: `0 4px 12px rgba(${hexToRgb(accentColor)}, 0.35)` }}
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            {!sidebarCollapsed && <span>+ Nova Venda (PDV)</span>}
                        </Link>
                    </div>
                </div>

                {/* Settings & Store Management link */}
                <div className="px-3 mb-2">
                    <Link
                        href="/configuracoes/loja"
                        onClick={() => setMobileMenuOpen(false)}
                        title={sidebarCollapsed ? "Gerenciar Lojas & Identidade" : undefined}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                            currentUrl.startsWith('/configuracoes')
                                ? 'text-white font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        } ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                        style={currentUrl.startsWith('/configuracoes') ? activeStyle : {}}
                    >
                        <Settings className="w-4 h-4 shrink-0" />
                        {!sidebarCollapsed && <span>Gerenciar Lojas & Marca</span>}
                    </Link>
                </div>

                {/* User Profile & Logout */}
                <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
                    <div className={`flex items-center gap-3 px-2 py-1.5 ${sidebarCollapsed ? 'lg:flex-col lg:justify-center lg:px-0' : 'justify-between'}`}>
                        <div className={`flex items-center gap-2.5 min-w-0 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}>
                            <div
                                className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center ring-2 shrink-0"
                                style={{ background: accentColor, ringColor: `${accentColor}60` }}
                                title={sidebarCollapsed ? auth?.user?.name : undefined}
                            >
                                {auth?.user?.name ? auth.user.name.substring(0, 1).toUpperCase() : 'U'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-200 truncate">
                                        {auth?.user?.name || 'Consultor'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 capitalize truncate">
                                        {auth?.user?.role || 'Vendedor'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sair do sistema"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/90 transition-all duration-300">
                    <div className="flex items-center gap-3 flex-1 max-w-lg">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
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

                    {/* Validation Errors */}
                    {showFlash && Object.keys(errors || {}).length > 0 && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                    <h4 className="text-sm font-semibold">Atenção aos seguintes campos:</h4>
                                </div>
                                <button onClick={() => setShowFlash(false)} className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-100 transition">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <ul className="list-disc list-inside text-xs space-y-1 pl-2 text-rose-700">
                                {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
