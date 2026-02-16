'use client';

import React, { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
    ShoppingCart,
    Plus,
    Link as LinkIcon,
    Trash2,
    ExternalLink,
    Loader2,
    ChevronRight,
    Copy,
    Check,
    X,
    ChevronLeft,
    Circle,
    CheckCircle2
} from 'lucide-react';
import api from '@/lib/api';
import { clsx } from 'clsx';
import { AddToListModal } from '@/components/analysis/AddToListModal';

export default function ShoppingListsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [lists, setLists] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedList, setSelectedList] = useState<any | null>(null);
    const [isDeletingItem, setIsDeletingItem] = useState<number | null>(null);
    const [manualModel, setManualModel] = useState('');
    const [manualQuantity, setManualQuantity] = useState(1);
    const [manualPrice, setManualPrice] = useState(0);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);

    useEffect(() => {
        fetchLists();
        fetchExchangeRate();
    }, []);

    const fetchExchangeRate = async () => {
        try {
            const res = await api.get('/currency/rate/AED/EGP');
            if (res.data.success) {
                setExchangeRate(res.data.rate);
            }
        } catch (err) {
            console.error('Failed to fetch exchange rate:', err);
        }
    };

    const fetchLists = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/shopping-lists');
            if (res.data.success) {
                setLists(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch lists:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualAdd = async () => {
        if (!selectedList || !manualModel) return;

        // Simple heuristic to split brand and model if space exists
        let brand = 'Hardware';
        let model = manualModel;

        const parts = manualModel.split(' ');
        if (parts.length > 1) {
            brand = parts[0];
            model = parts.slice(1).join(' ');
        }

        setIsAddingItem(true);
        try {
            const res = await api.post(`/shopping-lists/${selectedList.id}/items`, {
                brand: brand,
                model: model,
                quantity: manualQuantity,
                price: manualPrice
            });
            if (res.data.success) {
                const newItem = res.data.data;
                const updatedLists = lists.map(l => l.id === selectedList.id ? {
                    ...l,
                    items: [...(l.items || []), newItem]
                } : l);
                setLists(updatedLists);
                setSelectedList({
                    ...selectedList,
                    items: [...(selectedList.items || []), newItem]
                });
                setManualModel('');
                setManualQuantity(1);
                setManualPrice(0);
            }
        } catch (err) {
            console.error('Failed to add item:', err);
        } finally {
            setIsAddingItem(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه القائمة؟')) return;
        try {
            await api.delete(`/shopping-lists/${id}`);
            setLists(lists.filter(l => l.id !== id));
        } catch (err) {
            console.error('Failed to delete list:', err);
        }
    };

    const copyLink = (publicId: string) => {
        const url = `${window.location.origin}/${locale}/p/${publicId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(publicId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
        setIsDeletingItem(itemId);
        try {
            await api.delete(`/shopping-lists/items/${itemId}`);
            // Refresh logic: update both the main list and the selected list
            const updatedLists = lists.map(l => ({
                ...l,
                items: l.items.filter((i: any) => i.id !== itemId)
            }));
            setLists(updatedLists);
            if (selectedList) {
                setSelectedList({
                    ...selectedList,
                    items: selectedList.items.filter((i: any) => i.id !== itemId)
                });
            }
        } catch (err) {
            console.error('Failed to delete item:', err);
        } finally {
            setIsDeletingItem(null);
        }
    };

    const handleToggleItemCheck = async (itemId: number, currentStatus: boolean) => {
        try {
            await api.patch(`/shopping-lists/items/${itemId}`, {
                is_checked: !currentStatus
            });

            const updatedLists = lists.map((l: any) => ({
                ...l,
                items: l.items?.map((i: any) =>
                    i.id === itemId ? { ...i, is_checked: !currentStatus } : i
                )
            }));
            setLists(updatedLists);

            if (selectedList) {
                setSelectedList({
                    ...selectedList,
                    items: selectedList.items.map((i: any) =>
                        i.id === itemId ? { ...i, is_checked: !currentStatus } : i
                    )
                });
            }
        } catch (err) {
            console.error('Failed to toggle item check:', err);
        }
    };

    const handleUpdateItem = async (itemId: number, updates: any) => {
        try {
            await api.patch(`/shopping-lists/items/${itemId}`, updates);

            const updateLogic = (i: any) => i.id === itemId ? { ...i, ...updates } : i;

            setLists(lists.map(l => ({
                ...l,
                items: l.items?.map(updateLogic)
            })));

            if (selectedList) {
                setSelectedList({
                    ...selectedList,
                    items: selectedList.items.map(updateLogic)
                });
            }
        } catch (err) {
            console.error('Failed to update item:', err);
        }
    };

    const handleUpdateListCurrency = async (listId: number, currency: string) => {
        try {
            const res = await api.patch(`/shopping-lists/${listId}`, { currency });

            if (res.data.success) {
                const updatedListData = res.data.data;
                setLists(lists.map(l => l.id === listId ? updatedListData : l));

                if (selectedList && selectedList.id === listId) {
                    setSelectedList(updatedListData);
                }
            }
        } catch (err) {
            console.error('Failed to update list currency:', err);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                        {selectedList ? (
                            <button
                                onClick={() => setSelectedList(null)}
                                className="flex items-center gap-2 text-primary font-black text-sm hover:translate-x-[-4px] transition-transform mb-2"
                            >
                                <ChevronRight size={16} />
                                <span>العودة للقوائم</span>
                            </button>
                        ) : null}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <ShoppingCart size={28} className="text-primary" />
                            </div>
                            <h1 className="text-[28px] md:text-3xl font-black tracking-tight text-foreground">
                                {selectedList ? selectedList.name : 'قوائم الطلبات'}
                            </h1>
                            {selectedList && (
                                <div className="flex items-center gap-4 border-r border-black/10 pr-4 mr-2">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-0.5">الإجمالي</p>
                                        <div className="flex items-baseline gap-1.5">
                                            <p className="text-xl font-black text-primary">
                                                {(selectedList.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0).toLocaleString(selectedList.currency === 'AED' ? 'en-AE' : 'ar-EG')}
                                            </p>
                                            <span className="text-[10px] font-black text-primary/60">{selectedList.currency === 'AED' ? 'AED' : 'ج.م'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full">
                                            {['EGP', 'AED'].map((curr) => (
                                                <button
                                                    key={curr}
                                                    onClick={() => handleUpdateListCurrency(selectedList.id, curr)}
                                                    className={clsx(
                                                        "px-3 py-1 rounded-full text-[10px] font-black transition-all",
                                                        selectedList.currency === curr
                                                            ? "bg-primary text-white"
                                                            : "text-secondary/40 hover:text-secondary"
                                                    )}
                                                >
                                                    {curr}
                                                </button>
                                            ))}
                                        </div>
                                        {exchangeRate && (
                                            <span className="text-[9px] font-black text-secondary/30 uppercase tracking-tighter">
                                                1 AED = {exchangeRate.toFixed(2)} EGP
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {!selectedList && (
                            <p className="text-secondary/60 font-bold text-sm mr-12">إدارة قوائم المشتريات والطلبيات الخاصة بك</p>
                        )}
                    </div>

                    {!selectedList && (
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="rounded-2xl h-14 w-full sm:w-auto px-8 font-black gap-2 transition-all hover:scale-105 border border-black/5"
                        >
                            <Plus size={20} />
                            <span>إنشاء قائمة جديدة</span>
                        </Button>
                    )}
                </div>

                <div className="w-full h-px bg-black/[0.03]" />

                {/* Lists Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-64 bg-white/50 border border-black/5 rounded-[2rem] animate-pulse" />
                        ))}
                    </div>
                ) : selectedList ? (
                    /* Detailed Item View */
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Manual entry form */}
                        <div className="bg-white/50 backdrop-blur-md rounded-[2rem] border border-black/5 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                                <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                                    <label className="text-[10px] font-black uppercase text-secondary/40 px-2 tracking-widest">اسم الجهاز / الصنف</label>
                                    <Input
                                        placeholder="مثلاً: HP EliteBook 840 G5"
                                        value={manualModel}
                                        onChange={(e) => setManualModel(e.target.value)}
                                        className="h-12 rounded-xl bg-white border border-black/5 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-secondary/40 px-2 tracking-widest">الكمية</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={manualQuantity}
                                        onChange={(e) => setManualQuantity(parseInt(e.target.value) || 1)}
                                        className="h-12 rounded-xl bg-white border border-black/5 focus:ring-primary/20 text-center font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5 relative">
                                    <label className="text-[10px] font-black uppercase text-secondary/40 px-2 tracking-widest">السعر</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={manualPrice}
                                        onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                                        className="h-12 rounded-xl bg-white border border-black/5 focus:ring-primary/20 text-center font-bold pl-12"
                                    />
                                    <span className="absolute left-4 bottom-3.5 text-[10px] font-black text-secondary/30 uppercase">{selectedList.currency}</span>
                                </div>
                                <Button
                                    onClick={handleManualAdd}
                                    disabled={isAddingItem || !manualModel}
                                    className="h-12 rounded-xl font-black gap-2 w-full"
                                >
                                    {isAddingItem ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    <span>إضافة صنف</span>
                                </Button>
                            </div>
                        </div>

                        {/* Items List - Row Based */}
                        <div className="space-y-3">
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30">
                                <div className="col-span-1 text-center">الحالة</div>
                                <div className="col-span-5">الصنف / الموديل</div>
                                <div className="col-span-2 text-center">الكمية</div>
                                <div className="col-span-2 text-center">السعر</div>
                                <div className="col-span-1 text-center font-mono">الإجمالي</div>
                                <div className="col-span-1 text-center">إجراءات</div>
                            </div>

                            {selectedList.items?.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {selectedList.items.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className={clsx(
                                                "grid grid-cols-1 lg:grid-cols-12 items-center gap-4 lg:gap-0 bg-white/60 backdrop-blur-sm border border-black/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] transition-all duration-500 group",
                                                item.is_checked
                                                    ? "border-primary/10 bg-primary/[0.01] opacity-60 grayscale-[0.5]"
                                                    : "hover:border-primary/10 hover:translate-x-[4px]"
                                            )}
                                        >
                                            {/* Status Checkbox */}
                                            <div className="lg:col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => handleToggleItemCheck(item.id, item.is_checked)}
                                                    className={clsx(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                                        item.is_checked
                                                            ? "bg-primary text-white"
                                                            : "bg-black/5 text-secondary/10 hover:bg-black/10 hover:text-primary/40"
                                                    )}
                                                >
                                                    {item.is_checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </button>
                                            </div>

                                            {/* Item Info */}
                                            <div className="lg:col-span-5 px-4 lg:px-0 text-center lg:text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-secondary/30 mb-0.5 tracking-tighter">
                                                        {item.brand}
                                                    </span>
                                                    <p className={clsx(
                                                        "text-lg lg:text-base font-black truncate",
                                                        item.is_checked ? "text-secondary/40 line-through" : "text-foreground"
                                                    )}>
                                                        {item.model}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="lg:col-span-2 flex justify-center px-4 md:px-12 lg:px-4">
                                                <div className="flex items-center gap-2 bg-black/[0.03] rounded-xl px-2">
                                                    <span className="text-[10px] font-bold text-secondary/30 lg:hidden">الكمية:</span>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                        className="h-9 w-16 bg-transparent border-none text-center font-bold text-sm focus:ring-0"
                                                    />
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="lg:col-span-2 flex justify-center px-4 md:px-12 lg:px-4">
                                                <div className="flex items-center gap-2 bg-black/[0.03] rounded-xl px-2">
                                                    <span className="text-[10px] font-bold text-secondary/30 lg:hidden">السعر:</span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.price}
                                                        onChange={(e) => handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                                        className="h-9 w-24 bg-transparent border-none text-center font-bold text-sm focus:ring-0"
                                                    />
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="lg:col-span-1 text-center lg:text-right px-4">
                                                <div className="flex flex-col items-center lg:items-end">
                                                    <span className="text-[10px] font-bold text-secondary/30 lg:hidden uppercase tracking-widest mb-1">الإجمالي</span>
                                                    <span className="text-base font-black text-primary font-mono">
                                                        {(item.price * item.quantity).toLocaleString(selectedList.currency === 'AED' ? 'en-AE' : 'ar-EG')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="lg:col-span-1 flex justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isDeletingItem === item.id}
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="w-10 h-10 rounded-xl text-secondary/20 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    {isDeletingItem === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={18} />}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center bg-white/30 backdrop-blur-md border border-dashed border-black/10 rounded-[2.5rem]">
                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                        <ShoppingCart size={64} strokeWidth={1} />
                                        <div className="space-y-1">
                                            <p className="font-black uppercase text-sm tracking-[0.2em]">القائمة فارغة حالياً</p>
                                            <p className="text-xs font-bold">ابدأ بإضافة الأجهزة يدوياً أو من صفحة التحليل</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : lists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lists.map((list) => (
                            <div
                                key={list.id}
                                className="group relative bg-white/60 backdrop-blur-sm border border-black/5 rounded-[2rem] p-8 hover:border-primary/20 transition-all duration-500 hover:translate-y-[-4px]"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-stretch justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                                                {list.name}
                                            </h3>
                                            <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest">
                                                {new Date(list.created_at || new Date()).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end justify-between self-stretch">
                                            <Badge variant="secondary" className="rounded-full bg-black/5 border-none font-black px-3 py-1.5 flex items-center gap-2 shrink-0">
                                                <ShoppingCart size={14} className="opacity-40" />
                                                {list.items?.length || 0} قطع
                                            </Badge>
                                            <div className="flex items-center gap-1.5">
                                                <Badge className={clsx(
                                                    "rounded-full font-black px-3 py-1 border-none text-[10px]",
                                                    list.currency === 'AED' ? "bg-blue-500/10 text-blue-600" : "bg-primary/10 text-primary"
                                                )}>
                                                    {list.currency}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(list.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Link and Open Actions */}
                                    <div className="flex items-center gap-2 pt-4">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="flex-1 rounded-2xl h-11 bg-black/5 hover:bg-black/10 text-secondary/70 border-none transition-all px-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyLink(list.public_id);
                                            }}
                                            title={copiedId === list.public_id ? 'تم النسخ' : 'نسخ الرابط'}
                                        >
                                            {copiedId === list.public_id ? <Check size={18} /> : <Copy size={18} />}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="icon"
                                            onClick={() => setSelectedList(list)}
                                            className="flex-1 rounded-2xl h-11 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border-none px-0"
                                            title="عرض المحتويات"
                                        >
                                            <ExternalLink size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-30">
                        <ShoppingCart size={80} strokeWidth={1} />
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-black uppercase tracking-widest">لا توجد قوائم طلبات</h3>
                            <p className="text-sm font-bold">ابدأ بإنشاء قائمة جديدة لتنظيم طلبياتك</p>
                        </div>
                    </div>
                )}

                <AddToListModal
                    isOpen={isCreating}
                    onClose={() => {
                        setIsCreating(false);
                        fetchLists();
                    }}
                    item={null} // Passing null means we're just creating a list
                />
            </div>
        </DashboardLayout>
    );
}
