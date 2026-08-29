import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ShoppingBag, Search, Sparkles, MessageCircle, Phone,
    Check, X, Plus, Minus, Share2, Heart, ArrowRight,
    Tag, Star, ShieldCheck, Truck, CreditCard
} from 'lucide-react';

export default function PublicCatalog({ store, products, categories, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');
    const [bag, setBag] = useState([]);
    const [isBagOpen, setIsBagOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const accentColor = store?.accent_color || '#db2777';
    const storeName = store?.name || 'Dyvinuss Looks';

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(`/loja/${store.slug}/catalogo`, {
            search: searchTerm,
            category: selectedCategory,
        }, { preserveState: true });
    };

    const handleCategorySelect = (catId) => {
        setSelectedCategory(catId);
        router.get(`/loja/${store.slug}/catalogo`, {
            search: searchTerm,
            category: catId,
        }, { preserveState: true });
    };

    const addToBag = (product, variant = null) => {
        const itemKey = `${product.id}-${variant?.id || 'default'}`;
        const existing = bag.find((i) => i.key === itemKey);

        if (existing) {
            setBag(bag.map((i) => i.key === itemKey ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setBag([
                ...bag,
                {
                    key: itemKey,
                    productId: product.id,
                    variantId: variant?.id,
                    name: product.name,
                    size: variant?.size || 'Único',
                    color: variant?.color || 'Padrão',
                    price: variant?.price || product.price,
                    qty: 1,
                },
            ]);
        }
        setIsBagOpen(true);
    };

    const updateQty = (key, delta) => {
        setBag(
            bag
                .map((i) => {
                    if (i.key === key) {
                        const newQty = i.qty + delta;
                        return newQty > 0 ? { ...i, qty: newQty } : null;
                    }
                    return i;
                })
                .filter(Boolean)
        );
    };

    const totalBagValue = bag.reduce((acc, i) => acc + i.price * i.qty, 0);
    const totalBagItems = bag.reduce((acc, i) => acc + i.qty, 0);

    const handleCheckoutWhatsApp = () => {
        if (bag.length === 0) return;

        let msg = `🛍️ *Novo Pedido via Catálogo Online - ${storeName}*\n\n`;
        bag.forEach((item, index) => {
            msg += `${index + 1}. *${item.name}*\n`;
            msg += `   • Tamanho: ${item.size} | Cor: ${item.color}\n`;
            msg += `   • Quantidade: ${item.qty}x (${formatCurrency(item.price)} un.)\n`;
            msg += `   • Subtotal: *${formatCurrency(item.price * item.qty)}*\n\n`;
        });

        msg += `💰 *Valor Total:* ${formatCurrency(totalBagValue)}\n\n`;
        msg += `Olá! Gostaria de confirmar a disponibilidade e finalizar este pedido. Como podemos combinar o pagamento e entrega? ✨`;

        const cleanPhone = (store.whatsapp || '5511999999999').replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    };

    const handleShareCatalog = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-pink-600 selection:text-white">
            <Head title={`Catálogo Digital · ${storeName}`} />

            {/* ── HEADER VIP ── */}
            <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg border-b border-slate-800">
                <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0"
                            style={{ background: `linear-gradient(135deg, ${accentColor}, #f43f5e)` }}
                        >
                            DY
                        </div>
                        <div>
                            <h1 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                                {storeName}
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            </h1>
                            <p className="text-[11px] text-slate-400">Catálogo Oficial & Pedidos Online</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShareCatalog}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                            title="Compartilhar Catálogo"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
                        </button>

                        <button
                            onClick={() => setIsBagOpen(true)}
                            className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md transition transform active:scale-95 relative"
                            style={{ background: `linear-gradient(135deg, ${accentColor}, #f43f5e)` }}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span className="hidden sm:inline">Sacola</span>
                            {totalBagItems > 0 && (
                                <span className="w-5 h-5 rounded-full bg-white text-pink-600 font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                                    {totalBagItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search & Category Filter Bar */}
                <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 py-2.5">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <form onSubmit={handleSearch} className="relative w-full sm:max-w-xs">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar looks, vestidos, conjuntos..."
                                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-pink-500 focus:outline-none transition"
                            />
                        </form>

                        {/* Category Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                            <button
                                onClick={() => handleCategorySelect('')}
                                className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
                                    !selectedCategory
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                Todas as Peças
                            </button>
                            {categories &&
                                categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySelect(cat.id)}
                                        className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
                                            selectedCategory == cat.id
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── HERO BANNER ── */}
            <div className="bg-gradient-to-r from-slate-900 via-[#2d0f2b] to-slate-900 text-white py-8 px-4 border-b border-pink-500/20">
                <div className="max-w-6xl mx-auto text-center space-y-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                        <Sparkles className="w-3.5 h-3.5 fill-pink-400" /> Coleção Exclusiva {storeName}
                    </span>
                    <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold text-white">
                        Looks Perfeitos para Você Brilhar
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
                        Escolha suas peças favoritas, selecione seu tamanho e envie seu pedido direto no nosso WhatsApp com 1 clique!
                    </p>
                </div>
            </div>

            {/* ── PRODUCT GRID ── */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => {
                            return (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                                >
                                    {/* Product Visual Top */}
                                    <div className="h-48 bg-gradient-to-br from-pink-50/50 via-slate-50 to-purple-50 flex items-center justify-center p-4 relative border-b border-slate-100">
                                        <div
                                            className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-white shadow-lg text-lg group-hover:scale-110 transition-transform duration-300"
                                            style={{ background: `linear-gradient(135deg, ${accentColor}, #f43f5e)` }}
                                        >
                                            <ShoppingBag className="w-10 h-10" />
                                        </div>
                                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/90 backdrop-blur-sm text-slate-700 shadow-2xs border border-slate-200">
                                            {product.sku || 'Look VIP'}
                                        </span>
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-pink-600 transition-colors">
                                                {product.name}
                                            </h3>

                                            {/* Size / Variants Pills */}
                                            {product.variants && product.variants.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2.5">
                                                    {product.variants.map((v) => (
                                                        <span
                                                            key={v.id}
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                                                        >
                                                            {v.size || 'U'}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="text-xs text-slate-400">À vista no PIX</div>
                                                <div className="text-base font-extrabold text-slate-900 font-['Space_Grotesk']">
                                                    {formatCurrency(product.price)}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => addToBag(product, product.variants?.[0])}
                                                className="py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition transform active:scale-95"
                                                style={{ background: `linear-gradient(135deg, ${accentColor}, #f43f5e)` }}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Pedir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-800 text-base">Nenhuma peça encontrada</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Tente buscar com outros termos ou selecione outra categoria.
                        </p>
                    </div>
                )}
            </main>

            {/* ── FLOATING BAG BUTTON (Mobile & Desktop) ── */}
            {totalBagItems > 0 && !isBagOpen && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <button
                        onClick={() => setIsBagOpen(true)}
                        className="px-6 py-3.5 rounded-full text-white font-bold text-sm shadow-2xl flex items-center gap-3 transform hover:scale-105 transition-all"
                        style={{
                            background: `linear-gradient(135deg, ${accentColor}, #f43f5e)`,
                            boxShadow: `0 15px 30px -5px ${accentColor}88`,
                        }}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Ver Sacola ({totalBagItems} {totalBagItems === 1 ? 'peça' : 'peças'})</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono">
                            {formatCurrency(totalBagValue)}
                        </span>
                    </button>
                </div>
            )}

            {/* ── SACOLA DRAWER / MODAL ── */}
            {isBagOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm text-sm"
                                    style={{ background: `linear-gradient(135deg, ${accentColor}, #f43f5e)` }}
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                        Sua Sacola de Looks
                                    </h3>
                                    <p className="text-xs text-slate-400">{totalBagItems} itens selecionados</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsBagOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-3 space-y-2">
                            {bag.length > 0 ? (
                                bag.map((item) => (
                                    <div key={item.key} className="pt-2 flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                                            <p className="text-[11px] text-slate-500">
                                                Tam: <b>{item.size}</b> · {formatCurrency(item.price)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => updateQty(item.key, -1)}
                                                    className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="px-2 text-xs font-bold text-slate-800">{item.qty}</span>
                                                <button
                                                    onClick={() => updateQty(item.key, 1)}
                                                    className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="text-xs font-bold text-slate-900 min-w-[60px] text-right font-['Space_Grotesk']">
                                                {formatCurrency(item.price * item.qty)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    Sua sacola está vazia. Adicione looks para pedir!
                                </div>
                            )}
                        </div>

                        {/* Total & Checkout Button */}
                        {bag.length > 0 && (
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-700">Total do Pedido:</span>
                                    <span className="font-extrabold text-lg text-slate-900 font-['Space_Grotesk']">
                                        {formatCurrency(totalBagValue)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleCheckoutWhatsApp}
                                    className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition transform active:scale-95"
                                    style={{
                                        background: `linear-gradient(135deg, #059669, #10b981)`,
                                        boxShadow: `0 10px 20px -5px rgba(16, 185, 129, 0.4)`,
                                    }}
                                >
                                    <MessageCircle className="w-4 h-4 fill-white" />
                                    <span>Pedir no WhatsApp Agora</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
