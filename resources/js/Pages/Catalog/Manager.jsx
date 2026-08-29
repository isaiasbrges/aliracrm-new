import React, { useState, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Sparkles,
    ShoppingBag,
    Plus,
    Edit3,
    Trash2,
    Eye,
    ExternalLink,
    Search,
    Palette,
    Upload,
    Image,
    Check,
    X,
    Tag,
    Layers,
    SlidersHorizontal,
    Phone,
    CheckCircle2,
    Globe,
    ArrowUpRight,
    Store as StoreIcon,
} from 'lucide-react';

const PRESET_COLORS = [
    { label: 'Hot Pink (Referência)', value: '#ff007f' },
    { label: 'Rosa Dyvinuss',         value: '#db2777' },
    { label: 'Rosa Pink Fúcsia',      value: '#ec4899' },
    { label: 'Rosa Chiclete',         value: '#f43f5e' },
    { label: 'Roxo Fashion',          value: '#7c3aed' },
    { label: 'Preto & Ouro Luxo',     value: '#0f172a' },
    { label: 'Vermelho Paixão',       value: '#dc2626' },
    { label: 'Esmeralda',             value: '#059669' },
    { label: 'Azul Royal',            value: '#2563eb' },
];

export default function CatalogManager({ store, products, categories, live_url }) {
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'branding'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

    // Modais
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Form de Produto / Look
    const {
        data: prodData,
        setData: setProdData,
        post: postProd,
        put: putProd,
        processing: savingProd,
        reset: resetProd,
        errors: prodErrors,
    } = useForm({
        name: '',
        category_id: '',
        price: '',
        original_price: '',
        image_url: '',
        image: null,
        sizes: ['P', 'M', 'G', 'GG'],
        stock: 10,
        status: 'active',
    });

    // Form de Categoria
    const {
        data: catData,
        setData: setCatData,
        post: postCat,
        processing: savingCat,
        reset: resetCat,
    } = useForm({
        name: '',
    });

    // Form de Logo e Cores da Loja (Branding)
    const {
        data: brandData,
        setData: setBrandData,
        post: postBrand,
        processing: savingBrand,
    } = useForm({
        name: store.name || 'Dyvinuss Looks',
        accent_color: store.accent_color || '#ff007f',
        logo_url: store.logo_url || '',
        logo: null,
        remove_logo: false,
    });

    const [logoPreview, setLogoPreview] = useState(store.logo_url || null);
    const [prodImagePreview, setProdImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const prodFileInputRef = useRef(null);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    // Abrir Modal de Novo Look
    const handleOpenCreateProduct = () => {
        setEditingProduct(null);
        resetProd();
        setProdImagePreview(null);
        setIsProductModalOpen(true);
    };

    // Abrir Modal de Edição de Look
    const handleOpenEditProduct = (prod) => {
        setEditingProduct(prod);
        setProdData({
            name: prod.name,
            category_id: prod.category_id || '',
            price: prod.price,
            original_price: prod.original_price || '',
            image_url: prod.image_url || '',
            image: null,
            sizes: prod.variants?.map((v) => v.size) || ['P', 'M', 'G', 'GG'],
            stock: prod.variants?.[0]?.stock || 10,
            status: prod.status || 'active',
        });
        setProdImagePreview(prod.image_url || null);
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = (e) => {
        e.preventDefault();
        if (editingProduct) {
            putProd(`/catalogo/produtos/${editingProduct.id}`, {
                onSuccess: () => {
                    setIsProductModalOpen(false);
                    resetProd();
                },
            });
        } else {
            postProd('/catalogo/produtos', {
                onSuccess: () => {
                    setIsProductModalOpen(false);
                    resetProd();
                },
            });
        }
    };

    const handleDeleteProduct = (prod) => {
        if (confirm(`Tem certeza que deseja excluir o look '${prod.name}' do catálogo?`)) {
            router.delete(`/catalogo/produtos/${prod.id}`);
        }
    };

    const handleSaveCategory = (e) => {
        e.preventDefault();
        postCat('/catalogo/categorias', {
            onSuccess: () => {
                setIsCategoryModalOpen(false);
                resetCat();
            },
        });
    };

    const handleDeleteCategory = (cat) => {
        if (confirm(`Excluir a categoria '${cat.name}'?`)) {
            router.delete(`/catalogo/categorias/${cat.id}`);
        }
    };

    const handleLogoFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setBrandData('logo', file);
            setBrandData('remove_logo', false);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleProdImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setProdData('image', file);
            setProdImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveBranding = (e) => {
        e.preventDefault();
        postBrand('/catalogo/branding');
    };

    // Filtragem dos looks
    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategoryFilter === 'all' || p.category_id === Number(selectedCategoryFilter) || p.category_name === selectedCategoryFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <AppLayout title="Gestor do Catálogo">
            {/* Header da Página */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Gestor do Catálogo Online
                        <span className="p-1 rounded-md bg-pink-100 text-pink-700 text-xs font-sans font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Vitrine Digital
                        </span>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Adicione looks, edite preços, gerencie categorias e personalize a logo e as cores do catálogo público.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Botão Ver Catálogo ao Vivo */}
                    <a
                        href="/catalogo"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                        title="Abrir o catálogo público no navegador"
                    >
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Ver Catálogo ao Vivo</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    <button
                        onClick={handleOpenCreateProduct}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ff007f] hover:bg-[#e11d48] text-white text-xs font-bold shadow-md shadow-pink-600/20 transition active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        + Adicionar Look
                    </button>
                </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex items-center gap-2 border-b border-slate-200 mb-6 text-xs sm:text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 ${
                        activeTab === 'products'
                            ? 'border-[#ff007f] text-[#ff007f] font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Looks do Catálogo ({products.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 ${
                        activeTab === 'categories'
                            ? 'border-[#ff007f] text-[#ff007f] font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Tag className="w-4 h-4" />
                    <span>Categorias da Barra Lateral ({categories.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('branding')}
                    className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 ${
                        activeTab === 'branding'
                            ? 'border-[#ff007f] text-[#ff007f] font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Palette className="w-4 h-4" />
                    <span>Logo & Cores da Loja</span>
                </button>
            </div>

            {/* ── ABA 1: PRODUTOS & LOOKS DO CATÁLOGO ── */}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    {/* Barra de Busca & Filtro de Categorias */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome ou SKU..."
                                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-semibold text-slate-500 shrink-0">Filtrar Categoria:</span>
                            <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#ff007f] transition w-full sm:w-auto"
                            >
                                <option value="all">Todas as Categorias</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.products_count || 0})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grade / Tabela dos Looks */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4">Foto</th>
                                        <th className="py-3 px-4">Nome do Look</th>
                                        <th className="py-3 px-4">Categoria</th>
                                        <th className="py-3 px-4">Preço Promocional</th>
                                        <th className="py-3 px-4">Preço Riscado</th>
                                        <th className="py-3 px-4">Tamanhos</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((prod) => (
                                            <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 px-4">
                                                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                                                        <img
                                                            src={prod.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200'}
                                                            alt={prod.name}
                                                            className="w-full h-full object-cover object-top"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-bold text-slate-900 text-sm capitalize">{prod.name}</p>
                                                    <p className="text-[11px] font-mono text-slate-400">SKU: {prod.sku}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-pink-50 text-[#ff007f] font-semibold text-[11px] border border-pink-100">
                                                        {prod.category_name || 'Sem Categoria'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-[#ff007f] text-sm">
                                                        {formatCurrency(prod.price)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {prod.original_price ? (
                                                        <span className="text-slate-400 line-through text-xs font-mono">
                                                            {formatCurrency(prod.original_price)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1 flex-wrap max-w-[150px]">
                                                        {prod.variants && prod.variants.length > 0 ? (
                                                            prod.variants.map((v) => (
                                                                <span
                                                                    key={v.id}
                                                                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold"
                                                                >
                                                                    {v.size}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400">P, M, G, GG</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {prod.status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            Pausado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleOpenEditProduct(prod)}
                                                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Editar look"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(prod)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                            title="Excluir look"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-400">
                                                Nenhum look encontrado com os filtros aplicados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ABA 2: CATEGORIAS DO CATÁLOGO ── */}
            {activeTab === 'categories' && (
                <div className="max-w-4xl space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Essas categorias aparecem na barra lateral esquerda do seu catálogo público.
                        </p>
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                        >
                            <Plus className="w-3.5 h-3.5" /> + Nova Categoria
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
                        {categories.map((cat) => (
                            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#ff007f] flex items-center justify-center font-bold">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                                        <p className="text-xs text-slate-400 font-mono">slug: {cat.slug}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                        {cat.products_count || 0} looks vinculados
                                    </span>
                                    <button
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                        title="Excluir categoria"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ABA 3: LOGO & CORES DA LOJA (BRANDING) ── */}
            {activeTab === 'branding' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Formulário de Configuração */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
                        <h2 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg mb-1 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-[#ff007f]" />
                            Identidade Visual do Catálogo
                        </h2>
                        <p className="text-xs text-slate-500 mb-6">
                            Personalize o nome da loja, a cor de destaque do cabeçalho e a logo que seus clientes veem.
                        </p>

                        <form onSubmit={handleSaveBranding} className="space-y-6">
                            {/* Nome da Loja */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Nome da Loja no Catálogo *
                                </label>
                                <input
                                    type="text"
                                    value={brandData.name}
                                    onChange={(e) => setBrandData('name', e.target.value)}
                                    required
                                    className="w-full text-xs sm:text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition"
                                />
                            </div>

                            {/* Seletor de Cores da Loja */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                    Cor de Destaque da Loja (Navbar e Botões) *
                                </label>

                                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 mb-3">
                                    {PRESET_COLORS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setBrandData('accent_color', preset.value)}
                                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                                                brandData.accent_color.toLowerCase() === preset.value.toLowerCase()
                                                    ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span
                                                className="w-4 h-4 rounded-full shadow-xs shrink-0"
                                                style={{ backgroundColor: preset.value }}
                                            />
                                            <span className="truncate">{preset.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <input
                                        type="color"
                                        value={brandData.accent_color}
                                        onChange={(e) => setBrandData('accent_color', e.target.value)}
                                        className="w-9 h-9 rounded-xl cursor-pointer border-none p-0 bg-transparent"
                                    />
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold text-slate-700">Cor Hexadecimal Personalizada:</p>
                                        <input
                                            type="text"
                                            value={brandData.accent_color}
                                            onChange={(e) => setBrandData('accent_color', e.target.value)}
                                            className="font-mono text-xs font-bold uppercase text-slate-900 bg-transparent outline-none mt-0.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logo da Loja */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                    Logo da Loja (Imagem)
                                </label>

                                <div className="flex items-start gap-4">
                                    {logoPreview ? (
                                        <div className="w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 shrink-0 shadow-xs relative group">
                                            <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                className="w-full h-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLogoPreview(null);
                                                    setBrandData('logo', null);
                                                    setBrandData('logo_url', '');
                                                    setBrandData('remove_logo', true);
                                                }}
                                                className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition shrink-0 bg-slate-50"
                                        >
                                            <Upload className="w-5 h-5 mb-1" />
                                            <span className="text-[9px] font-bold">Upload</span>
                                        </div>
                                    )}

                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Escolher Arquivo do Computador
                                        </button>
                                        <input
                                            type="url"
                                            value={brandData.logo_url}
                                            onChange={(e) => {
                                                setBrandData('logo_url', e.target.value);
                                                setLogoPreview(e.target.value);
                                            }}
                                            placeholder="Ou cole a URL da imagem da Logo..."
                                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingBrand}
                                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition"
                            >
                                {savingBrand ? 'Salvando...' : 'Salvar Alterações de Logo e Cores'}
                            </button>
                        </form>
                    </div>

                    {/* Preview em Tempo Real do Catálogo */}
                    <div className="lg:col-span-5 space-y-3">
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                            Preview em Tempo Real do Catálogo:
                        </h3>

                        {/* Miniatura do Catálogo */}
                        <div className="rounded-3xl border border-slate-300 overflow-hidden shadow-lg bg-white select-none">
                            {/* Navbar Miniatura com a Cor Escolhida */}
                            <div className="p-3 text-white flex items-center justify-between" style={{ backgroundColor: brandData.accent_color }}>
                                <div className="flex items-center gap-2">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="w-6 h-6 rounded-lg object-contain bg-white p-0.5" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-[9px]">
                                            DY
                                        </div>
                                    )}
                                    <span className="font-bold text-xs truncate max-w-[110px]">{brandData.name}</span>
                                </div>
                                <div className="w-24 h-5 rounded-full bg-white/90 text-slate-400 text-[9px] flex items-center justify-center">
                                    O que procura?
                                </div>
                                <div className="text-[10px] font-bold">🛒 Carrinho</div>
                            </div>

                            {/* Corpo Miniatura */}
                            <div className="p-3 grid grid-cols-3 gap-2 bg-slate-50">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-xl p-1.5 border border-slate-200">
                                        <div className="aspect-3/4 bg-slate-200 rounded-lg mb-1" />
                                        <div className="h-2 w-12 bg-slate-200 rounded mb-1" />
                                        <div className="h-2 w-8 rounded font-bold text-[9px]" style={{ color: brandData.accent_color }}>
                                            R$ 130,00
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400 text-center">
                            Ao clicar em salvar, a cor e logo selecionadas serão aplicadas imediatamente no link público do catálogo.
                        </p>
                    </div>
                </div>
            )}

            {/* ── MODAL: ADICIONAR / EDITAR LOOK DO CATÁLOGO ── */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#ff007f]" />
                                {editingProduct ? `Editar Look: ${editingProduct.name}` : 'Adicionar Novo Look ao Catálogo'}
                            </h3>
                            <button
                                onClick={() => setIsProductModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-4 py-4 overflow-y-auto flex-1">
                            {/* Nome do Look */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nome da Peça / Look *
                                </label>
                                <input
                                    type="text"
                                    value={prodData.name}
                                    onChange={(e) => setProdData('name', e.target.value)}
                                    placeholder="Ex: Vestido musse, Calça cargo..."
                                    required
                                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition"
                                />
                            </div>

                            {/* Categoria */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Categoria do Look
                                </label>
                                <select
                                    value={prodData.category_id}
                                    onChange={(e) => setProdData('category_id', e.target.value)}
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition"
                                >
                                    <option value="">Selecione uma categoria...</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preços */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Preço Promocional (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={prodData.price}
                                        onChange={(e) => setProdData('price', e.target.value)}
                                        placeholder="Ex: 130.00"
                                        required
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition font-bold text-[#ff007f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Preço Original Riscado (R$)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={prodData.original_price}
                                        onChange={(e) => setProdData('original_price', e.target.value)}
                                        placeholder="Ex: 150.00 (Opcional)"
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Foto do Look */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Foto do Look (URL ou Upload)
                                </label>
                                <div className="flex items-center gap-3">
                                    {prodImagePreview ? (
                                        <div className="w-16 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                            <img
                                                src={prodImagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover object-top"
                                            />
                                        </div>
                                    ) : null}

                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="file"
                                            ref={prodFileInputRef}
                                            onChange={handleProdImageFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => prodFileInputRef.current?.click()}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Fazer Upload de Foto
                                        </button>
                                        <input
                                            type="url"
                                            value={prodData.image_url}
                                            onChange={(e) => {
                                                setProdData('image_url', e.target.value);
                                                setProdImagePreview(e.target.value);
                                            }}
                                            placeholder="Ou cole o link direto da imagem..."
                                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            {editingProduct && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Visibilidade no Catálogo
                                    </label>
                                    <select
                                        value={prodData.status}
                                        onChange={(e) => setProdData('status', e.target.value)}
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    >
                                        <option value="active">🟢 Ativo (Exibir na Vitrine)</option>
                                        <option value="inactive">⚪ Pausado (Ocultar da Vitrine)</option>
                                    </select>
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingProd || !prodData.name || !prodData.price}
                                    className="px-5 py-2 rounded-xl bg-[#ff007f] hover:bg-[#e11d48] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                                >
                                    {savingProd ? 'Salvando...' : editingProduct ? 'Atualizar Look' : 'Publicar no Catálogo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: NOVA CATEGORIA ── */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base flex items-center gap-2">
                                <Tag className="w-4 h-4 text-[#ff007f]" />
                                Criar Nova Categoria
                            </h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nome da Categoria *
                                </label>
                                <input
                                    type="text"
                                    value={catData.name}
                                    onChange={(e) => setCatData('name', e.target.value)}
                                    placeholder="Ex: Vestidos de Festa, Moda Praia..."
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ff007f] outline-none transition"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCat || !catData.name.trim()}
                                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                                >
                                    {savingCat ? 'Salvando...' : 'Criar Categoria'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
