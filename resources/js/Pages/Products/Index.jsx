import React, { useState } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Package,
    Plus,
    Search,
    AlertTriangle,
    CheckCircle2,
    DollarSign,
    Layers,
    X,
    Sparkles,
    ShoppingBag
} from 'lucide-react';

export default function ProductsIndex({ products, metrics, search }) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        sku: '',
        price: '',
        size: 'U',
        color: 'Padrão',
        stock: 10,
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val || 0);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/produtos', { search: searchTerm }, { preserveState: true });
    };

    const handleCreateProduct = (e) => {
        e.preventDefault();
        post('/produtos', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout title="Produtos & Estoque">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Catálogo de Produtos & Estoque
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Gerencie preços, variantes (tamanho/cor), grades e níveis de estoque.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all transform active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    + Novo Produto
                </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Produtos Ativos
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
                        {metrics?.total_products || 0}
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Unidades em Estoque
                    </span>
                    <h3 className="text-2xl font-extrabold text-blue-600 font-['Space_Grotesk'] mt-1">
                        {metrics?.total_units || 0} un.
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Valor Total em Estoque
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
                        {formatCurrency(metrics?.total_value)}
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Estoque Crítico (≤ 5 un.)
                    </span>
                    <h3 className="text-2xl font-extrabold text-amber-600 font-['Space_Grotesk'] mt-1 flex items-center gap-1.5">
                        {metrics?.low_stock || 0} itens
                        {metrics?.low_stock > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </h3>
                </div>
            </div>

            {/* Products Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome do produto ou SKU..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                        />
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-3 px-4">Produto</th>
                                <th className="py-3 px-4">SKU Base</th>
                                <th className="py-3 px-4">Variantes (Tam / Cor)</th>
                                <th className="py-3 px-4 text-right">Preço Unitário</th>
                                <th className="py-3 px-4 text-center">Estoque</th>
                                <th className="py-3 px-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products?.data && products.data.length > 0 ? (
                                products.data.map((product) => {
                                    const totalStock = product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
                                    const isLowStock = totalStock <= 5;
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{product.name}</p>
                                                        <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                                                            {product.status === 'active' ? 'Ativo no Catálogo' : 'Inativo'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                                                {product.sku}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {product.variants?.map((v) => (
                                                        <span
                                                            key={v.id}
                                                            className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-medium"
                                                        >
                                                            {v.size} / {v.color} ({v.stock} un.)
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-['Space_Grotesk'] text-sm">
                                                {formatCurrency(product.price)}
                                            </td>

                                            <td className="py-3.5 px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                        isLowStock
                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    }`}
                                                >
                                                    {totalStock} unidades
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <Link
                                                    href="/vendas/nova"
                                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold p-1 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5" />
                                                    Vender
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-400">
                                        Nenhum produto cadastrado ou encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products?.links && products.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Mostrando {products.from || 0} a {products.to || 0} de {products.total || 0} produtos
                        </span>
                        <div className="flex items-center gap-1">
                            {products.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 rounded-lg border text-xs transition ${
                                        link.active
                                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Novo Produto */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg">
                                    Cadastrar Novo Produto
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nome do Produto *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Vestido Midi Floral Elegance"
                                    required
                                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Código SKU *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value.toUpperCase())}
                                        placeholder="VEST-MIDI-01"
                                        required
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-mono uppercase"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Preço de Venda (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="0,00"
                                        required
                                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-['Space_Grotesk']"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Tamanho *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.size}
                                        onChange={(e) => setData('size', e.target.value)}
                                        placeholder="P, M, G, 38..."
                                        required
                                        className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition uppercase"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Cor *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        placeholder="Azul Marinho"
                                        required
                                        className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Estoque Inicial *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.stock}
                                        onChange={(e) => setData('stock', e.target.value)}
                                        required
                                        className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition font-['Space_Grotesk']"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Salvando...' : 'Cadastrar Produto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
