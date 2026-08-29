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
    Copy,
    RefreshCw,
    AlertCircle,
    Server,
    ShieldCheck,
    HelpCircle,
    Info,
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

export default function CatalogManager({ store, products, categories, live_url, dns_info }) {
    // Parâmetro de URL ou padrão
    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = searchParams.get('tab') || 'products';

    const [activeTab, setActiveTab] = useState(initialTab); // 'products' | 'categories' | 'branding' | 'domain'
    const [activeDnsProvider, setActiveDnsProvider] = useState('registrobr'); // 'registrobr' | 'cloudflare' | 'hostinger' | 'godaddy'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

    // Modais
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Teste de DNS
    const [verifyingDns, setVerifyingDns] = useState(false);
    const [dnsCheckResult, setDnsCheckResult] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

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

    // Form de Domínio Próprio
    const {
        data: domainData,
        setData: setDomainData,
        post: postDomain,
        processing: savingDomain,
    } = useForm({
        custom_domain: store.custom_domain || '',
    });

    const [logoPreview, setLogoPreview] = useState(store.logo_url || null);
    const [prodImagePreview, setProdImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const serverHost = dns_info?.server_host || 'aliracrm.site';
    const serverIp = dns_info?.server_ip || '185.173.111.45';

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
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

    const handleSaveBranding = (e) => {
        e.preventDefault();
        postBrand('/catalogo/branding', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleSaveDomain = (e) => {
        e.preventDefault();
        postDomain('/catalogo/dominio', {
            preserveScroll: true,
        });
    };

    const handleVerifyDns = async () => {
        setVerifyingDns(true);
        setDnsCheckResult(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/catalogo/dominio/verificar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });
            const data = await res.json();
            setDnsCheckResult(data);
        } catch (e) {
            setDnsCheckResult({
                success: false,
                message: 'Erro ao se comunicar com o verificador de DNS.',
            });
        } finally {
            setVerifyingDns(false);
        }
    };

    // Filtrar Produtos
    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat =
            selectedCategoryFilter === 'all' ||
            String(p.category_id) === String(selectedCategoryFilter);
        return matchesSearch && matchesCat;
    });

    const currentBrandColor = store.accent_color || '#ff007f';

    return (
        <AppLayout title="Gerenciador do Catálogo & Looks">
            {/* ── Top Bar ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-slate-900 flex items-center gap-2.5">
                        <Sparkles className="w-6 h-6" style={{ color: currentBrandColor }} />
                        Gerenciador do Catálogo
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                            Vitrine Ativa
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Gerencie looks, fotos, categorias da barra lateral, identidade visual e seu próprio domínio.
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
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition active:scale-95"
                        style={{ background: currentBrandColor }}
                    >
                        <Plus className="w-4 h-4" />
                        + Adicionar Look
                    </button>
                </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex items-center gap-2 border-b border-slate-200 mb-6 text-xs sm:text-sm font-semibold overflow-x-auto">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'products'
                            ? 'font-bold border-current'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    style={activeTab === 'products' ? { color: currentBrandColor } : {}}
                >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Looks do Catálogo ({products.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'categories'
                            ? 'font-bold border-current'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    style={activeTab === 'categories' ? { color: currentBrandColor } : {}}
                >
                    <Tag className="w-4 h-4" />
                    <span>Categorias ({categories.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('branding')}
                    className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'branding'
                            ? 'font-bold border-current'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    style={activeTab === 'branding' ? { color: currentBrandColor } : {}}
                >
                    <Palette className="w-4 h-4" />
                    <span>Logo & Cores da Loja</span>
                </button>

                <button
                    onClick={() => setActiveTab('domain')}
                    className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'domain'
                            ? 'font-bold border-current'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    style={activeTab === 'domain' ? { color: currentBrandColor } : {}}
                >
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>Domínio Próprio & DNS</span>
                    {store.custom_domain && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    )}
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
                                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-semibold text-slate-500 shrink-0">Filtrar Categoria:</span>
                            <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none transition w-full sm:w-auto"
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
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                                        <th className="py-3 px-4">Foto</th>
                                        <th className="py-3 px-4">Nome do Look</th>
                                        <th className="py-3 px-4">Categoria</th>
                                        <th className="py-3 px-4">Preço Promocional</th>
                                        <th className="py-3 px-4">Preço Original</th>
                                        <th className="py-3 px-4">Tamanhos / Estoque</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((prod) => (
                                            <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 px-4">
                                                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                                        <img
                                                            src={prod.image_url}
                                                            alt={prod.name}
                                                            className="w-full h-full object-cover object-top"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-bold text-slate-900 capitalize text-sm">{prod.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{prod.sku}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                                        {prod.category_name || 'Sem Categoria'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-extrabold text-sm" style={{ color: currentBrandColor }}>
                                                    {formatCurrency(prod.price)}
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 line-through">
                                                    {prod.original_price ? formatCurrency(prod.original_price) : '—'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {prod.variants?.map((v) => (
                                                            <span
                                                                key={v.id}
                                                                className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold"
                                                            >
                                                                {v.size}: {v.stock}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            prod.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {prod.status === 'active' ? '● Ativo' : '○ Inativo'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
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
                                    <div
                                        className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center font-bold"
                                        style={{ color: currentBrandColor }}
                                    >
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
                            <Palette className="w-5 h-5" style={{ color: currentBrandColor }} />
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
                                    className="w-full text-xs sm:text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition"
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

                                <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={brandData.accent_color.startsWith('#') && brandData.accent_color.length === 7 ? brandData.accent_color : '#ff007f'}
                                            onChange={(e) => {
                                                let clean = (e.target.value || '').trim();
                                                if (clean && !clean.startsWith('#')) clean = '#' + clean;
                                                setBrandData('accent_color', clean);
                                            }}
                                            className="w-11 h-11 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs"
                                            title="Clique para abrir a paleta de cores"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Código Hexadecimal:
                                        </label>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-slate-800 transition">
                                            <span className="text-xs font-mono font-bold text-slate-400">#</span>
                                            <input
                                                type="text"
                                                value={brandData.accent_color.replace(/^#/, '')}
                                                onChange={(e) => {
                                                    let clean = (e.target.value || '').trim();
                                                    if (clean && !clean.startsWith('#')) clean = '#' + clean;
                                                    setBrandData('accent_color', clean);
                                                }}
                                                placeholder="ff007f"
                                                maxLength={7}
                                                className="w-full font-mono text-xs font-bold uppercase text-slate-900 bg-transparent outline-none tracking-wider"
                                            />
                                        </div>
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

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
                            {/* Simulação do Header do Catálogo */}
                            <div
                                className="p-4 flex items-center justify-between text-white transition-colors duration-300"
                                style={{ backgroundColor: brandData.accent_color }}
                            >
                                <div className="flex items-center gap-2.5">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Logo"
                                            className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                                            {brandData.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="font-extrabold text-xs font-['Space_Grotesk'] truncate max-w-[120px]">
                                        {brandData.name}
                                    </span>
                                </div>

                                <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold">
                                    Sacola (3)
                                </div>
                            </div>

                            {/* Simulação do Corpo */}
                            <div className="p-4 bg-slate-50 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-xs font-bold"
                                        style={{ color: brandData.accent_color }}
                                    >
                                        Todas as Categorias
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                                        <div className="aspect-3/4 bg-slate-100 rounded-lg mb-2 relative">
                                            <div
                                                className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs text-xs font-bold"
                                                style={{ color: brandData.accent_color }}
                                            >
                                                +
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 truncate">Vestido Musse</p>
                                        <p className="text-xs font-extrabold" style={{ color: brandData.accent_color }}>
                                            R$ 89,90
                                        </p>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                                        <div className="aspect-3/4 bg-slate-100 rounded-lg mb-2 relative">
                                            <div
                                                className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs text-xs font-bold"
                                                style={{ color: brandData.accent_color }}
                                            >
                                                +
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 truncate">Calça Cargo</p>
                                        <p className="text-xs font-extrabold" style={{ color: brandData.accent_color }}>
                                            R$ 109,90
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ABA 4: DOMÍNIO PRÓPRIO & DNS (TUTORIAL COMPLETO) ── */}
            {activeTab === 'domain' && (
                <div className="space-y-6 max-w-5xl">
                    {/* Card de Status do Domínio */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg flex items-center gap-2">
                                            Domínio Próprio do Catálogo
                                            {store.custom_domain ? (
                                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                    store.custom_domain_status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {store.custom_domain_status === 'active' ? '🟢 Conectado' : '🟡 Apontamento Pendente'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    ⚪ Não Configurado
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Use seu próprio endereço (ex: <code className="text-slate-800 font-bold">loja.suamarca.com.br</code> ou <code className="text-slate-800 font-bold">suamarca.com.br</code>) para seus clientes acessarem a vitrine.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {store.custom_domain && (
                                <button
                                    onClick={handleVerifyDns}
                                    disabled={verifyingDns}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 shrink-0"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${verifyingDns ? 'animate-spin' : ''}`} />
                                    <span>{verifyingDns ? 'Verificando DNS...' : 'Testar Apontamento Agora'}</span>
                                </button>
                            )}
                        </div>

                        {/* Resultado do Teste de DNS */}
                        {dnsCheckResult && (
                            <div className={`mt-4 p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in ${
                                dnsCheckResult.success
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                                {dnsCheckResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">{dnsCheckResult.message}</p>
                                    <p className="text-[11px] opacity-90">
                                        IP Resolvido: <strong>{dnsCheckResult.resolved_ip || 'Nenhum'}</strong> · IP do Servidor Alira: <strong>{dnsCheckResult.server_ip}</strong>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Formulário para Inserir o Domínio */}
                        <form onSubmit={handleSaveDomain} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Digite seu Domínio ou Subdomínio:
                                </label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
                                    <div className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-slate-800 focus-within:bg-white transition">
                                        <span className="text-xs text-slate-400 font-mono select-none">https://</span>
                                        <input
                                            type="text"
                                            value={domainData.custom_domain}
                                            onChange={(e) => setDomainData('custom_domain', e.target.value)}
                                            placeholder="loja.suamarca.com.br ou suamarca.com.br"
                                            className="w-full text-xs font-semibold text-slate-900 bg-transparent outline-none ml-1 placeholder-slate-400"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={savingDomain}
                                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0"
                                    >
                                        {savingDomain ? 'Salvando...' : 'Salvar Domínio'}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    💡 <strong>Dica recomendada:</strong> Use um subdomínio como <code>loja.seusite.com.br</code> ou <code>catalogo.seusite.com.br</code>.
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* ── TUTORIAL COMPLETO DE CONFIGURAÇÃO DNS ── */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base flex items-center gap-2">
                                <Server className="w-5 h-5 text-indigo-600" />
                                Como Apontar seu Domínio (Tabela de Registros DNS)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Acesse o painel onde você comprou o domínio (Registro.br, Cloudflare, Hostinger, GoDaddy) e adicione <strong>um dos registros abaixo</strong> na Zona DNS:
                            </p>
                        </div>

                        {/* Tabela de Registros DNS com Botões de Copiar */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                                        <th className="py-3 px-4">Tipo</th>
                                        <th className="py-3 px-4">Nome / Host</th>
                                        <th className="py-3 px-4">Destino / Valor</th>
                                        <th className="py-3 px-4">TTL</th>
                                        <th className="py-3 px-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                    {/* Opção 1: CNAME Subdomínio (Recomendado) */}
                                    <tr className="hover:bg-slate-50/70 transition bg-emerald-50/20">
                                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                                            CNAME <span className="text-[10px] font-sans text-emerald-600 font-bold ml-1 bg-emerald-100 px-1.5 py-0.5 rounded">Recomendado</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800">
                                            loja <span className="font-sans text-[11px] text-slate-400 font-normal">(ou catalogo)</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                            {serverHost}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500 font-sans">
                                            Automático / 3600
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-sans">
                                            <button
                                                onClick={() => copyToClipboard(serverHost, 'cname')}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                            >
                                                {copiedField === 'cname' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                                <span>{copiedField === 'cname' ? 'Copiado!' : 'Copiar Destino'}</span>
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Opção 2: Tipo A (Domínio Raiz) */}
                                    <tr className="hover:bg-slate-50/70 transition">
                                        <td className="py-3.5 px-4 font-bold text-blue-700">
                                            A <span className="text-[10px] font-sans text-slate-500 font-normal ml-1">(Domínio Raiz)</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800">
                                            @ <span className="font-sans text-[11px] text-slate-400 font-normal">(ou deixe em branco)</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                            {serverIp}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500 font-sans">
                                            Automático / 3600
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-sans">
                                            <button
                                                onClick={() => copyToClipboard(serverIp, 'ip')}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                            >
                                                {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                                <span>{copiedField === 'ip' ? 'Copiado!' : 'Copiar IP'}</span>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* ── GUIAS PASSO A PASSO POR PROVEDOR (ABAS) ── */}
                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Escolha onde você comprou o domínio para ver o passo a passo:
                            </h4>

                            <div className="flex flex-wrap items-center gap-2">
                                {[
                                    { id: 'registrobr', label: '🇧🇷 Registro.br' },
                                    { id: 'cloudflare', label: '☁️ Cloudflare' },
                                    { id: 'hostinger',  label: '🌐 Hostinger' },
                                    { id: 'godaddy',    label: '🟢 GoDaddy' },
                                ].map((prov) => (
                                    <button
                                        key={prov.id}
                                        type="button"
                                        onClick={() => setActiveDnsProvider(prov.id)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                                            activeDnsProvider === prov.id
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {prov.label}
                                    </button>
                                ))}
                            </div>

                            {/* Conteúdo do Tutorial Registro.br */}
                            {activeDnsProvider === 'registrobr' && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
                                    <h5 className="font-bold text-slate-900 text-sm">Passo a passo no Registro.br:</h5>
                                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                                        <li>Acesse sua conta no <strong>registro.br</strong> e clique sobre o seu domínio.</li>
                                        <li>Role a página até a seção <strong>"DNS"</strong> e clique em <strong>"Configurar Endereçamento"</strong> (ou <strong>"Modificar Zona DNS"</strong>).</li>
                                        <li>Clique no botão <strong>"+ Registro"</strong>.</li>
                                        <li>No campo <strong>Tipo</strong>, selecione <strong>CNAME</strong>.</li>
                                        <li>No campo <strong>Nome</strong>, digite <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">loja</code> (para ficar <code>loja.seudominio.com.br</code>).</li>
                                        <li>No campo <strong>Dados / Destino</strong>, cole <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">{serverHost}</code>.</li>
                                        <li>Clique em <strong>Salvar Alterações</strong>. Pronto! O apontamento é propagado em cerca de 10 a 30 minutos.</li>
                                    </ol>
                                </div>
                            )}

                            {/* Conteúdo do Tutorial Cloudflare */}
                            {activeDnsProvider === 'cloudflare' && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
                                    <h5 className="font-bold text-slate-900 text-sm">Passo a passo no Cloudflare:</h5>
                                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                                        <li>Acesse o painel do <strong>Cloudflare</strong> e selecione o seu domínio.</li>
                                        <li>No menu lateral, clique em <strong>DNS</strong> &rarr; <strong>Registros (Records)</strong>.</li>
                                        <li>Clique em <strong>"Adicionar Registro" (Add record)</strong>.</li>
                                        <li>Escolha <strong>Type: CNAME</strong>.</li>
                                        <li>No campo <strong>Name</strong>, digite <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">loja</code>.</li>
                                        <li>No campo <strong>Target</strong>, cole <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">{serverHost}</code>.</li>
                                        <li>Deixe o <strong>Status de Proxy</strong> ativado (Nuvem Laranja 🟠) ou DNS Only.</li>
                                        <li>Clique em <strong>Salvar</strong>. No Cloudflare a propagação ocorre em menos de 2 minutos!</li>
                                    </ol>
                                </div>
                            )}

                            {/* Conteúdo do Tutorial Hostinger */}
                            {activeDnsProvider === 'hostinger' && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
                                    <h5 className="font-bold text-slate-900 text-sm">Passo a passo na Hostinger:</h5>
                                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                                        <li>Acesse o hPanel da <strong>Hostinger</strong> e vá em <strong>Domínios</strong>.</li>
                                        <li>Clique em <strong>Gerenciar</strong> no seu domínio e depois na aba <strong>DNS / Servidores de Nomes</strong>.</li>
                                        <li>Em <strong>Gerenciar Registros DNS</strong>:</li>
                                        <li>Selecione <strong>Tipo: CNAME</strong>.</li>
                                        <li>Nome: <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">loja</code>.</li>
                                        <li>Objeto (Aponta para): <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">{serverHost}</code>.</li>
                                        <li>TTL: 14400 (Padrão).</li>
                                        <li>Clique em <strong>Adicionar Registro</strong>.</li>
                                    </ol>
                                </div>
                            )}

                            {/* Conteúdo do Tutorial GoDaddy */}
                            {activeDnsProvider === 'godaddy' && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
                                    <h5 className="font-bold text-slate-900 text-sm">Passo a passo na GoDaddy:</h5>
                                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                                        <li>Faça login na <strong>GoDaddy</strong> e acesse <strong>Meus Produtos</strong> &rarr; <strong>Domínios</strong>.</li>
                                        <li>Clique em <strong>DNS</strong> ao lado do domínio desejado.</li>
                                        <li>Clique em <strong>"Adicionar Novo Registro"</strong>.</li>
                                        <li>Selecione o Tipo <strong>CNAME</strong>.</li>
                                        <li>Nome: <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">loja</code>.</li>
                                        <li>Valor: <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">{serverHost}</code>.</li>
                                        <li>Clique em <strong>Salvar</strong>.</li>
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* Alerta sobre Certificado SSL Automático */}
                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm">Segurança & Certificado SSL (HTTPS Gratuito)</p>
                                <p className="mt-0.5 text-indigo-800 leading-relaxed">
                                    Assim que você realizar o apontamento DNS e o tráfego chegar ao servidor do Alira CRM, o certificado SSL com cadeado de segurança (Let's Encrypt HTTPS) será emitido automaticamente para o seu domínio sem custo adicional.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DE PRODUTO / LOOK ── */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                {editingProduct ? 'Editar Look do Catálogo' : '+ Adicionar Novo Look'}
                            </h3>
                            <button
                                onClick={() => setIsProductModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-4 py-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Nome do Look *
                                </label>
                                <input
                                    type="text"
                                    value={prodData.name}
                                    onChange={(e) => setProdData('name', e.target.value)}
                                    placeholder="Ex: Vestido Longo Musse Fenda"
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                        Categoria *
                                    </label>
                                    <select
                                        value={prodData.category_id}
                                        onChange={(e) => setProdData('category_id', e.target.value)}
                                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition"
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                        Status
                                    </label>
                                    <select
                                        value={prodData.status}
                                        onChange={(e) => setProdData('status', e.target.value)}
                                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition"
                                    >
                                        <option value="active">Ativo no Catálogo</option>
                                        <option value="inactive">Oculto / Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                        Preço Promocional (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={prodData.price}
                                        onChange={(e) => setProdData('price', e.target.value)}
                                        placeholder="89.90"
                                        required
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition font-mono font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                        Preço Riscado / Original (R$)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={prodData.original_price}
                                        onChange={(e) => setProdData('original_price', e.target.value)}
                                        placeholder="129.90"
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition font-mono"
                                    />
                                </div>
                            </div>

                            {/* Foto do Look */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Foto do Look
                                </label>

                                <div className="flex items-start gap-3">
                                    {prodImagePreview ? (
                                        <div className="w-16 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 relative group">
                                            <img
                                                src={prodImagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover object-top"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => document.getElementById('prodFile')?.click()}
                                            className="w-16 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer bg-slate-50 shrink-0"
                                        >
                                            <Upload className="w-4 h-4 mb-0.5" />
                                            <span className="text-[8px] font-bold">Foto</span>
                                        </div>
                                    )}

                                    <div className="flex-1 space-y-1.5">
                                        <input
                                            id="prodFile"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setProdData('image', file);
                                                    setProdImagePreview(URL.createObjectURL(file));
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('prodFile')?.click()}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Upload do Computador
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

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={savingProd}
                                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition"
                                >
                                    {savingProd ? 'Salvando Look...' : editingProduct ? 'Salvar Alterações' : '+ Cadastrar Look no Catálogo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL DE NOVA CATEGORIA ── */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                                + Nova Categoria
                            </h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="space-y-4 py-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Nome da Categoria *
                                </label>
                                <input
                                    type="text"
                                    value={catData.name}
                                    onChange={(e) => setCatData('name', e.target.value)}
                                    placeholder="Ex: Vestidos, Conjuntos, Body..."
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={savingCat}
                                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition"
                            >
                                {savingCat ? 'Criando...' : 'Criar Categoria'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
