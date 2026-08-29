import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    ShoppingBag,
    Search,
    Plus,
    Minus,
    Trash2,
    CheckCircle2,
    User,
    UserPlus,
    X,
    ChevronDown,
    CreditCard,
    DollarSign,
    QrCode,
    Banknote,
    Sparkles,
    ArrowLeft,
    Phone,
    Mail,
    CheckCheck,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Modal: Cadastro Rápido de Cliente
   ───────────────────────────────────────────── */
function NewCustomerModal({ csrfToken, onCreated, onClose }) {
    const [form, setForm] = useState({ name: '', whatsapp: '', email: '', whatsapp_consent: true });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const nameRef = useRef(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const res = await fetch('/clientes/pdv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify(form),
            });

            const json = await res.json();

            if (!res.ok) {
                setErrors(json.errors || { name: 'Erro ao cadastrar.' });
                setSaving(false);
                return;
            }

            onCreated(json.customer, json.already_exists);
        } catch {
            setErrors({ name: 'Falha de conexão. Tente novamente.' });
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-[fadeInScale_0.2s_ease-out]">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 font-['Space_Grotesk'] text-lg leading-tight">
                                Novo Cliente
                            </h2>
                            <p className="text-xs text-slate-500">Cadastro rápido do balcão</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nome */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Nome Completo *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={nameRef}
                                type="text"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Ex: Maria Silva"
                                className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${
                                    errors.name ? 'border-rose-400 focus:border-rose-400' : 'border-slate-200 focus:border-blue-500'
                                }`}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            WhatsApp * <span className="font-normal text-slate-400">(com DDD)</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={form.whatsapp}
                                onChange={(e) => handleChange('whatsapp', e.target.value)}
                                placeholder="11 9 9999-0000"
                                className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${
                                    errors.whatsapp ? 'border-rose-400 focus:border-rose-400' : 'border-slate-200 focus:border-blue-500'
                                }`}
                            />
                        </div>
                        {errors.whatsapp && (
                            <p className="text-xs text-rose-500 mt-1">{errors.whatsapp}</p>
                        )}
                    </div>

                    {/* Email (opcional) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            E-mail <span className="font-normal text-slate-400">(opcional)</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="cliente@email.com"
                                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                            />
                        </div>
                    </div>

                    {/* Consentimento WhatsApp */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={form.whatsapp_consent}
                            onChange={(e) => handleChange('whatsapp_consent', e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-800 transition">
                            Cliente autoriza contato via WhatsApp para promoções e novidades.
                        </span>
                    </label>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                'Salvando...'
                            ) : (
                                <>
                                    <CheckCheck className="w-4 h-4" />
                                    Salvar Cliente
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Seletor de Cliente com busca inline
   ───────────────────────────────────────────── */
function CustomerSelector({ customers, selectedId, onSelect, csrfToken, onNewCustomer }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const ref = useRef(null);

    const selected = customers.find((c) => String(c.id) === String(selectedId));

    const filtered = useMemo(() => {
        if (!search.trim()) return customers;
        const q = search.toLowerCase();
        return customers.filter(
            (c) => c.name.toLowerCase().includes(q) || c.whatsapp?.includes(q)
        );
    }, [customers, search]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCreated = (customer, alreadyExists) => {
        setShowModal(false);
        onNewCustomer(customer);
        onSelect(String(customer.id));
        // Optional: small flash feedback handled by parent
    };

    return (
        <>
            <div ref={ref} className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cliente
                </label>

                {/* Trigger button */}
                <button
                    type="button"
                    onClick={() => setOpen((p) => !p)}
                    className={`w-full flex items-center gap-2 text-left text-xs px-3 py-2.5 border rounded-xl transition focus:outline-none ${
                        open
                            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
                            : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                >
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className={`flex-1 truncate ${selected ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                        {selected ? `${selected.name}  ·  ${selected.whatsapp}` : '— Balcão (cliente não identificado) —'}
                    </span>
                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="absolute z-40 w-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        {/* Search inside dropdown */}
                        <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar cliente por nome ou WhatsApp..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <ul className="max-h-52 overflow-y-auto">
                            {/* Balcão option */}
                            <li>
                                <button
                                    type="button"
                                    onClick={() => { onSelect(''); setOpen(false); setSearch(''); }}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition ${
                                        !selectedId ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-500'
                                    }`}
                                >
                                    <User className="w-3.5 h-3.5" />
                                    — Balcão (cliente não identificado) —
                                </button>
                            </li>

                            {filtered.length > 0 ? (
                                filtered.map((c) => (
                                    <li key={c.id}>
                                        <button
                                            type="button"
                                            onClick={() => { onSelect(String(c.id)); setOpen(false); setSearch(''); }}
                                            className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 transition ${
                                                String(c.id) === String(selectedId)
                                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                                    : 'text-slate-800'
                                            }`}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold truncate">{c.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{c.whatsapp}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="px-3 py-4 text-center text-xs text-slate-400">
                                    Nenhum cliente encontrado.
                                </li>
                            )}
                        </ul>

                        {/* New customer shortcut */}
                        <div className="border-t border-slate-100 p-2">
                            <button
                                type="button"
                                onClick={() => { setOpen(false); setShowModal(true); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition"
                            >
                                <div className="p-1 bg-blue-100 rounded-lg">
                                    <UserPlus className="w-3.5 h-3.5" />
                                </div>
                                + Cadastrar Novo Cliente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Customer Modal */}
            {showModal && (
                <NewCustomerModal
                    csrfToken={csrfToken}
                    onCreated={handleCreated}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}

/* ─────────────────────────────────────────────
   Página Principal: PDV / Frente de Caixa
   ───────────────────────────────────────────── */
export default function SalesCreate({ products, customers: initialCustomers, selectedCustomerId, csrf_token }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [customerList, setCustomerList] = useState(initialCustomers || []);
    const [newCustomerFlash, setNewCustomerFlash] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: selectedCustomerId || '',
        payment_method: 'pix',
        items: [],
    });

    const formatCurrency = (val) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    // Flatten all variants from products
    const allVariants = useMemo(() => {
        const list = [];
        (products || []).forEach((product) => {
            (product.variants || []).forEach((variant) => {
                list.push({
                    variant_id: variant.id,
                    product_id: product.id,
                    name: product.name,
                    sku: variant.sku || product.sku,
                    size: variant.size,
                    color: variant.color,
                    price: parseFloat(variant.price || product.price || 0),
                    stock: variant.stock,
                });
            });
        });
        return list;
    }, [products]);

    // Filter variants based on search
    const filteredVariants = useMemo(() => {
        if (!searchTerm.trim()) return allVariants;
        const q = searchTerm.toLowerCase();
        return allVariants.filter(
            (v) =>
                v.name.toLowerCase().includes(q) ||
                v.sku.toLowerCase().includes(q) ||
                v.color.toLowerCase().includes(q) ||
                v.size.toLowerCase().includes(q)
        );
    }, [allVariants, searchTerm]);

    const addToCart = (variant) => {
        setCart((prev) => {
            const existingIndex = prev.findIndex((item) => item.variant_id === variant.variant_id);
            if (existingIndex > -1) {
                const currentQty = prev[existingIndex].quantity;
                if (currentQty >= variant.stock) {
                    alert(`Estoque máximo disponível atingido (${variant.stock} un.).`);
                    return prev;
                }
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], quantity: currentQty + 1 };
                return updated;
            } else {
                return [
                    ...prev,
                    {
                        variant_id: variant.variant_id,
                        name: `${variant.name} (${variant.size}/${variant.color})`,
                        price: variant.price,
                        quantity: 1,
                        max_stock: variant.stock,
                    },
                ];
            }
        });
    };

    const updateQuantity = (variant_id, delta) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.variant_id === variant_id) {
                        const newQty = item.quantity + delta;
                        if (newQty > item.max_stock) {
                            alert(`Estoque máximo disponível atingido (${item.max_stock} un.).`);
                            return item;
                        }
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const removeFromCart = (variant_id) =>
        setCart((prev) => prev.filter((item) => item.variant_id !== variant_id));

    const cartTotal = useMemo(
        () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
        [cart]
    );

    const handleCheckout = (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert('Adicione ao menos um produto ao carrinho antes de finalizar a venda.');
            return;
        }
        const itemsPayload = cart.map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
        }));

        router.post('/vendas', {
            customer_id: data.customer_id ? parseInt(data.customer_id, 10) : null,
            payment_method: data.payment_method,
            items: itemsPayload,
        }, {
            preserveScroll: true,
        });
    };

    // Called when a new customer is created from the modal
    const handleNewCustomer = (customer) => {
        setCustomerList((prev) => {
            const exists = prev.find((c) => c.id === customer.id);
            return exists ? prev : [customer, ...prev];
        });
        setNewCustomerFlash(customer.name);
        setTimeout(() => setNewCustomerFlash(null), 4000);
    };

    return (
        <AppLayout title="Frente de Caixa · PDV">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <Link
                        href="/vendas"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Voltar para Histórico de Vendas
                    </Link>
                    <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight flex items-center gap-2">
                        Frente de Caixa · PDV
                        <span className="p-1 rounded-md bg-blue-100 text-blue-600 text-xs font-sans font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Venda Rápida
                        </span>
                    </h1>
                </div>
            </div>

            {/* ── New customer toast ── */}
            {newCustomerFlash && (
                <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-semibold shadow-sm animate-[fadeInScale_0.2s_ease-out]">
                    <CheckCheck className="w-4 h-4 shrink-0" />
                    Cliente <span className="font-bold">{newCustomerFlash}</span> cadastrado e selecionado com sucesso!
                </div>
            )}

            {/* ── PDV Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── Product Catalog (7 cols) ── */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome do produto, SKU, tamanho ou cor..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                        {filteredVariants.length > 0 ? (
                            filteredVariants.map((item) => (
                                <div
                                    key={item.variant_id}
                                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                {item.sku}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Estoque: {item.stock}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{item.name}</h4>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                                            <span>Tam: <b className="text-slate-800">{item.size}</b></span>
                                            <span>•</span>
                                            <span>Cor: <b className="text-slate-800">{item.color}</b></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                                        <span className="text-sm font-extrabold text-slate-900 font-['Space_Grotesk']">
                                            {formatCurrency(item.price)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => addToCart(item)}
                                            className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 hover:border-blue-600 transition active:scale-95"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                                Nenhum produto encontrado com estoque.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Checkout & Cart Panel (5 cols) ── */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm sticky top-20">
                        {/* Cart header */}
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                                Carrinho de Compras
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                {cart.reduce((a, b) => a + b.quantity, 0)} itens
                            </span>
                        </div>

                        {/* ── Customer Selector ── */}
                        <div className="mb-4">
                            <CustomerSelector
                                customers={customerList}
                                selectedId={data.customer_id}
                                onSelect={(id) => setData('customer_id', id)}
                                csrfToken={csrf_token}
                                onNewCustomer={handleNewCustomer}
                            />
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-4 divide-y divide-slate-100">
                            {cart.length > 0 ? (
                                cart.map((item) => (
                                    <div key={item.variant_id} className="pt-2.5 flex items-center justify-between gap-3 text-xs">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                                            <p className="text-[11px] text-slate-400 font-mono">
                                                {formatCurrency(item.price)} un.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.variant_id, -1)}
                                                className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition shadow-2xs"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center font-bold text-slate-900 font-['Space_Grotesk'] text-xs">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.variant_id, 1)}
                                                className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition shadow-2xs"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="font-extrabold text-slate-900 font-['Space_Grotesk'] text-right min-w-[70px]">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item.variant_id)}
                                            className="text-slate-300 hover:text-rose-500 p-1 rounded transition"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    Seu carrinho está vazio.<br />Clique em <b>+ Adicionar</b> em um produto ao lado.
                                </div>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="mb-4 pt-3 border-t border-slate-100">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Forma de Pagamento *
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                    { id: 'pix', label: 'Pix', icon: QrCode, color: 'text-emerald-600' },
                                    { id: 'credit', label: 'Crédito', icon: CreditCard, color: 'text-blue-600' },
                                    { id: 'debit', label: 'Débito', icon: CreditCard, color: 'text-indigo-600' },
                                    { id: 'cash', label: 'Dinheiro', icon: Banknote, color: 'text-amber-600' },
                                ].map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = data.payment_method === method.id;
                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setData('payment_method', method.id)}
                                            className={`py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                                isSelected
                                                    ? 'bg-blue-50 text-blue-700 border-blue-500 ring-2 ring-blue-500/20'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${method.color}`} />
                                            <span>{method.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 mb-4">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200 font-['Space_Grotesk']">
                                <span>Total a Pagar</span>
                                <span className="text-emerald-600 text-lg">{formatCurrency(cartTotal)}</span>
                            </div>
                        </div>

                        {/* Finalize */}
                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={processing || cart.length === 0}
                            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                'Processando Venda...'
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Concluir Venda ({formatCurrency(cartTotal)})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
