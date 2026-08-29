import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ShoppingBag,
    Search,
    Sparkles,
    MessageCircle,
    Phone,
    Check,
    X,
    Plus,
    Minus,
    Share2,
    Heart,
    ArrowRight,
    Tag,
    Star,
    ChevronDown,
    SlidersHorizontal,
    Truck,
    CreditCard,
    ShieldCheck,
    User,
    MapPin,
    CheckCircle2,
    ExternalLink,
} from 'lucide-react';

/* ── Utility: hex → "r g b" for CSS color-mix ── */
function hexToRgb(hex = '#ff007f') {
    const h = (hex || '#ff007f').replace('#', '');
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

export default function PublicCatalog({ store, products, categories, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');
    const [selectedSort, setSelectedSort] = useState(filters?.sort || 'default');
    const [bag, setBag] = useState([]);
    const [isBagOpen, setIsBagOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalSize, setModalSize] = useState('M');
    const [modalQty, setModalQty] = useState(1);

    // Dados do Cliente para o Checkout Integrado
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerCity, setCustomerCity] = useState('');
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);

    // Cor global dinâmica da loja definida no painel
    const brandColor = store?.accent_color || '#ff007f';
    const storeName  = store?.name || 'Dyvinuss Looks';
    const logoUrl    = store?.logo_url || null;

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
            sort: selectedSort,
        }, { preserveState: true });
    };

    const handleCategoryClick = (catNameOrId) => {
        const newCat = selectedCategory === catNameOrId ? '' : catNameOrId;
        setSelectedCategory(newCat);
        router.get(`/loja/${store.slug}/catalogo`, {
            search: searchTerm,
            category: newCat,
            sort: selectedSort,
        }, { preserveState: true });
    };

    const handleSortChange = (newSort) => {
        setSelectedSort(newSort);
        router.get(`/loja/${store.slug}/catalogo`, {
            search: searchTerm,
            category: selectedCategory,
            sort: newSort,
        }, { preserveState: true });
    };

    const openProductModal = (product) => {
        setSelectedProduct(product);
        setModalSize('M');
        setModalQty(1);
    };

    const addToBagFromModal = () => {
        if (!selectedProduct) return;
        const key = `${selectedProduct.id}-${modalSize}`;
        const existing = bag.find((i) => i.key === key);

        if (existing) {
            setBag(
                bag.map((i) =>
                    i.key === key ? { ...i, qty: i.qty + modalQty } : i
                )
            );
        } else {
            setBag([
                ...bag,
                {
                    key,
                    product: selectedProduct,
                    size: modalSize,
                    qty: modalQty,
                    price: selectedProduct.price,
                },
            ]);
        }

        setSelectedProduct(null);
        setIsBagOpen(true);
    };

    const addToBagQuick = (product, e) => {
        e.stopPropagation();
        const key = `${product.id}-M`;
        const existing = bag.find((i) => i.key === key);

        if (existing) {
            setBag(bag.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i)));
        } else {
            setBag([
                ...bag,
                {
                    key,
                    product,
                    size: product.variants?.[0]?.size || 'M',
                    qty: 1,
                    price: product.price,
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

    const bagCount = bag.reduce((sum, item) => sum + item.qty, 0);
    const bagTotal = bag.reduce((sum, item) => sum + item.price * item.qty, 0);

    /* ── Checkout Integrado: Salva Pedido, Lead, Venda e Conversa no CRM ── */
    const handleWhatsAppCheckout = async () => {
        if (bag.length === 0) return;

        setSubmittingOrder(true);
        let orderCode = 'CAT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/catalogo/pedido', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    store_id: store.id,
                    customer_name: customerName || 'Cliente do Catálogo',
                    customer_phone: customerPhone || '',
                    customer_city: customerCity || '',
                    items: bag.map((item) => ({
                        product_id: item.product.id,
                        size: item.size,
                        qty: item.qty,
                        price: item.price,
                    })),
                }),
            });

            if (res.ok) {
                const result = await res.json();
                if (result.order_number) {
                    orderCode = result.order_number;
                }
            }
        } catch (e) {
            console.error('Erro ao integrar pedido com o CRM:', e);
        } finally {
            setSubmittingOrder(false);
        }

        // Montar mensagem para o WhatsApp com Código do Pedido do CRM
        let message = `Olá, ${storeName}! ✨\n\nAcabei de montar meu pedido no catálogo online:\n`;
        message += `📋 *Pedido:* #${orderCode}\n`;
        if (customerName) message += `👤 *Nome:* ${customerName}\n`;
        if (customerCity) message += `📍 *Cidade:* ${customerCity}\n`;
        message += `\n*Looks Escolhidos:*\n`;

        bag.forEach((item, index) => {
            message += `${index + 1}. *${item.product.name}*\n`;
            message += `   • Tamanho: ${item.size}\n`;
            message += `   • Quantidade: ${item.qty}x\n`;
            message += `   • Valor: ${formatCurrency(item.price * item.qty)}\n\n`;
        });

        message += `🛍️ *Total do Pedido:* ${formatCurrency(bagTotal)}\n\n`;
        message += `Como podemos prosseguir com o pagamento e envio? 💖`;

        const phone = store.whatsapp ? store.whatsapp.replace(/\D/g, '') : '5511999999999';
        const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

        setOrderSuccess({ orderCode, bagTotal, bagCount });
        window.open(url, '_blank');
    };

    // Categorias dinâmicas
    const sidebarCategories = (categories && categories.length > 0)
        ? categories.map(c => c.name)
        : [
            'Body', 'Saia', 'Cropped', 'Macacão', 'Calça', 'Vestido',
            'Conjunto', 'Body | Maiô', 'Biquíni', 'Shorts', 'Shorts saia',
            'Blusinha', 'T-shirt', 'Teddy', 'Tricô', 'Blusa moletom',
            'Camisa', 'Macaquinho', 'Tênis', 'Jaqueta'
        ];

    return (
        <div
            className="min-h-screen bg-white text-slate-900 font-sans"
            style={{
                '--brand': brandColor,
                '--brand-rgb': hexToRgb(brandColor),
            }}
        >
            <Head title={`${storeName} - Catálogo de Looks Exclusivos`} />

            {/* ── HEADER GLOBAL DA LOJA COM COR DINÂMICA ── */}
            <header
                className="sticky top-0 z-40 shadow-md transition-colors duration-300"
                style={{ background: brandColor }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
                    {/* Logo / Emblema da Loja */}
                    <div className="flex items-center gap-3 shrink-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={storeName}
                                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 shadow-md border border-white/40"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center text-white shadow-inner">
                                <span className="font-['Space_Grotesk'] font-black text-sm tracking-wider leading-none">
                                    {storeName.substring(0, 2).toUpperCase()}
                                </span>
                                <span className="text-[7px] uppercase tracking-widest font-bold mt-0.5">Looks</span>
                            </div>
                        )}
                        <div className="hidden sm:block text-white">
                            <h1 className="font-['Space_Grotesk'] font-extrabold text-base tracking-tight leading-tight">
                                {storeName}
                            </h1>
                            <p className="text-[10px] text-white/80 font-medium tracking-wide">
                                Moda Feminina & Tendências
                            </p>
                        </div>
                    </div>

                    {/* Barra de Pesquisa Central Arredondada (Pill) */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="O que você procura?"
                            className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-full outline-none shadow-sm text-center focus:ring-2 focus:ring-white/50 transition"
                        />
                        <button
                            type="submit"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:opacity-80 transition p-1"
                            style={{ color: brandColor }}
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Botão Carrinho / Sacola */}
                    <button
                        onClick={() => { setIsBagOpen(true); setOrderSuccess(null); }}
                        className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2.5 rounded-full transition shadow-xs shrink-0 active:scale-95"
                    >
                        <div className="relative">
                            <ShoppingBag className="w-5 h-5" />
                            {bagCount > 0 && (
                                <span
                                    className="absolute -top-2 -right-2 bg-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                                    style={{ color: brandColor }}
                                >
                                    {bagCount}
                                </span>
                            )}
                        </div>
                        <span className="hidden md:inline">Carrinho</span>
                    </button>
                </div>
            </header>

            {/* ── CORPO PRINCIPAL: 2 COLUNAS (CATEGORIAS NA ESQUERDA + GRADE DE LOOKS) ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* COLUNA ESQUERDA: TODAS AS CATEGORIAS (SIDEBAR) */}
                    <aside className="lg:col-span-3">
                        <div className="sticky top-28 bg-white pr-4">
                            <h2
                                className="font-bold font-['Space_Grotesk'] text-lg sm:text-xl mb-4 tracking-tight"
                                style={{ color: brandColor }}
                            >
                                Todas as Categorias
                            </h2>

                            <nav className="space-y-1.5 text-xs sm:text-sm">
                                <button
                                    onClick={() => handleCategoryClick('')}
                                    className={`w-full text-left py-1.5 px-3 rounded-xl transition font-medium ${
                                        selectedCategory === ''
                                            ? 'font-bold text-white shadow-xs'
                                            : 'text-slate-600 hover:translate-x-1'
                                    }`}
                                    style={selectedCategory === '' ? { background: brandColor } : {}}
                                >
                                    Todos os Looks
                                </button>

                                {sidebarCategories.map((cName, idx) => {
                                    const isSelected = selectedCategory === cName;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleCategoryClick(cName)}
                                            className={`w-full text-left py-1.5 px-3 rounded-xl transition font-medium block ${
                                                isSelected
                                                    ? 'font-bold text-white shadow-xs'
                                                    : 'text-slate-600 hover:translate-x-1'
                                            }`}
                                            style={isSelected ? { background: brandColor } : {}}
                                        >
                                            {cName}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* COLUNA DIREITA: ORDENAÇÃO + GRADE DE PRODUTOS */}
                    <section className="lg:col-span-9">
                        {/* Barra Superior: Ordenar Por */}
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">
                                Exibindo <strong>{products?.length || 0}</strong> peças encontradas
                            </span>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                                    Ordenar por
                                </span>
                                <select
                                    value={selectedSort}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none transition cursor-pointer"
                                >
                                    <option value="default">Destaques</option>
                                    <option value="lowest_price">Menor Preço</option>
                                    <option value="highest_price">Maior Preço</option>
                                    <option value="newest">Mais Recentes</option>
                                </select>
                            </div>
                        </div>

                        {/* GRADE DE LOOKS (4 COLUNAS EXATAMENTE COMO NO PRINT) */}
                        {products && products.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                {products.map((product) => {
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => openProductModal(product)}
                                            className="group cursor-pointer flex flex-col transition text-left"
                                        >
                                            {/* Container da Foto com Cantos Arredondados */}
                                            <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-slate-100 shadow-2xs border border-slate-100 group-hover:shadow-md transition duration-300">
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                                                    loading="lazy"
                                                />

                                                {/* Botão Rápido Flutuante de Adicionar */}
                                                <button
                                                    onClick={(e) => addToBagQuick(product, e)}
                                                    className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0 active:scale-95"
                                                    style={{ color: brandColor }}
                                                    title="Adicionar à sacola"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Informações do Produto (Abaixo da Imagem) */}
                                            <div className="pt-2.5 px-0.5">
                                                <h3 className="font-semibold text-xs sm:text-sm text-slate-800 truncate capitalize">
                                                    {product.name}
                                                </h3>

                                                {/* Preços (Riscado + Preço com a Cor Global da Loja) */}
                                                <div className="flex flex-col mt-0.5">
                                                    {product.original_price && (
                                                        <span className="text-[11px] text-slate-400 line-through">
                                                            {formatCurrency(product.original_price)}
                                                        </span>
                                                    )}
                                                    <span
                                                        className="text-xs sm:text-sm font-bold"
                                                        style={{ color: brandColor }}
                                                    >
                                                        {formatCurrency(product.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-16 text-center bg-slate-50 rounded-3xl border border-slate-200">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white"
                                    style={{ background: brandColor }}
                                >
                                    <ShoppingBag className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-base">
                                    Nenhum look encontrado nesta categoria
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    Tente buscar por outro termo ou clique em "Todos os Looks" ao lado.
                                </p>
                                <button
                                    onClick={() => handleCategoryClick('')}
                                    className="mt-4 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs"
                                    style={{ background: brandColor }}
                                >
                                    Ver Todos os Looks
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* ── MODAL: DETALHES DO LOOK & ESCOLHA DE TAMANHO ── */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Imagem do Look */}
                        <div className="aspect-3/4 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                            <img
                                src={selectedProduct.image_url}
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover object-top"
                            />
                        </div>

                        {/* Detalhes & Seletores */}
                        <div className="flex flex-col justify-between">
                            <div>
                                <span
                                    className="text-[11px] font-bold uppercase tracking-wider"
                                    style={{ color: brandColor }}
                                >
                                    {storeName}
                                </span>
                                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 capitalize mt-1">
                                    {selectedProduct.name}
                                </h2>

                                <div className="flex items-center gap-2 mt-2 mb-4">
                                    {selectedProduct.original_price && (
                                        <span className="text-xs text-slate-400 line-through">
                                            {formatCurrency(selectedProduct.original_price)}
                                        </span>
                                    )}
                                    <span
                                        className="text-xl font-extrabold"
                                        style={{ color: brandColor }}
                                    >
                                        {formatCurrency(selectedProduct.price)}
                                    </span>
                                </div>

                                {/* Seletor de Tamanhos */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                        Selecione o Tamanho:
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {['P', 'M', 'G', 'GG'].map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setModalSize(size)}
                                                className={`w-11 h-11 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                                                    modalSize === size
                                                        ? 'text-white shadow-md'
                                                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                                style={modalSize === size ? { background: brandColor, boxShadow: `0 4px 12px rgba(${hexToRgb(brandColor)}, 0.35)` } : {}}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quantidade */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                        Quantidade:
                                    </label>
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1.5 w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                                            className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-xs font-bold px-2 font-mono">{modalQty}</span>
                                        <button
                                            type="button"
                                            onClick={() => setModalQty(modalQty + 1)}
                                            className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Botão Adicionar à Sacola */}
                            <button
                                type="button"
                                onClick={addToBagFromModal}
                                className="w-full py-3 rounded-2xl text-white text-xs font-bold shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
                                style={{
                                    background: brandColor,
                                    boxShadow: `0 6px 20px rgba(${hexToRgb(brandColor)}, 0.35)`
                                }}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Adicionar à Sacola · {formatCurrency(selectedProduct.price * modalQty)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── GAVETA LATERAL DO CARRINHO (SLIDE-OVER BAG INTEGRADA COM CRM) ── */}
            {isBagOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header do Carrinho */}
                        <div
                            className="p-4 text-white flex items-center justify-between shadow-xs"
                            style={{ background: brandColor }}
                        >
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                <h3 className="font-bold font-['Space_Grotesk'] text-base">
                                    Minha Sacola ({bagCount})
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsBagOpen(false)}
                                className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tela de Pedido Concluído / Enviado */}
                        {orderSuccess ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                                    <CheckCircle2 className="w-9 h-9" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg">
                                        Pedido Aberto com Sucesso!
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Código de Rastreio do CRM: <strong className="text-slate-800 font-mono">#{orderSuccess.orderCode}</strong>
                                    </p>
                                </div>
                                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 max-w-xs">
                                    Uma nova conversa foi iniciada no seu WhatsApp para confirmar o pagamento e combinar a entrega.
                                </p>
                                <button
                                    onClick={() => { setBag([]); setOrderSuccess(null); setIsBagOpen(false); }}
                                    className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md"
                                    style={{ background: brandColor }}
                                >
                                    Continuar Comprando
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Itens da Sacola */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
                                    {bag.length > 0 ? (
                                        bag.map((item) => (
                                            <div key={item.key} className="pt-3 first:pt-0 flex items-center gap-3">
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="w-16 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-xs text-slate-800 truncate capitalize">
                                                        {item.product.name}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500">
                                                        Tamanho: <span className="font-bold text-slate-700">{item.size}</span>
                                                    </p>
                                                    <p
                                                        className="text-xs font-bold mt-1"
                                                        style={{ color: brandColor }}
                                                    >
                                                        {formatCurrency(item.price * item.qty)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateQty(item.key, -1)}
                                                        className="w-6 h-6 rounded bg-white text-slate-600 shadow-2xs flex items-center justify-center"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="text-xs font-bold px-1.5">{item.qty}</span>
                                                    <button
                                                        onClick={() => updateQty(item.key, 1)}
                                                        className="w-6 h-6 rounded bg-white text-slate-600 shadow-2xs flex items-center justify-center"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                            <ShoppingBag className="w-12 h-12 text-slate-200 mb-2" />
                                            <p className="text-xs">Sua sacola está vazia.</p>
                                            <button
                                                onClick={() => setIsBagOpen(false)}
                                                className="mt-4 px-4 py-2 text-white text-xs font-bold rounded-xl"
                                                style={{ background: brandColor }}
                                            >
                                                Explorar Looks
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Footer do Carrinho com Dados do Cliente + Botão WhatsApp Integrado */}
                                {bag.length > 0 && (
                                    <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
                                        {/* Mini Formulário de Identificação do Lead */}
                                        <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                Seus Dados de Contato:
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    placeholder="Seu Nome"
                                                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                                />
                                                <input
                                                    type="tel"
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    placeholder="WhatsApp (com DDD)"
                                                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                                            <span>Total:</span>
                                            <span
                                                className="text-lg font-extrabold"
                                                style={{ color: brandColor }}
                                            >
                                                {formatCurrency(bagTotal)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleWhatsAppCheckout}
                                            disabled={submittingOrder}
                                            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
                                        >
                                            <MessageCircle className="w-5 h-5 fill-white" />
                                            <span>{submittingOrder ? 'Registrando Pedido...' : 'Pedir no WhatsApp Agora'}</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── FOOTER DA LOJA ── */}
            <footer className="bg-slate-900 text-white mt-20 py-10 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 space-y-2">
                    <p className="font-bold text-slate-200 text-sm">{storeName} · Moda Feminina Exclusiva</p>
                    <p>Atendimento e Vendas Diretas pelo WhatsApp</p>
                    <p className="text-[11px] text-slate-500">© 2026 Alira CRM & Catálogo Digital. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
