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

    useEffect(() => {
        fetchLists();
    }, []);

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
            await api.patch(`/shopping-lists/${listId}`, { currency });

            setLists(lists.map(l => l.id === listId ? { ...l, currency } : l));

            if (selectedList && selectedList.id === listId) {
                setSelectedList({ ...selectedList, currency });
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
                        </div>
                        {!selectedList && (
                            <p className="text-secondary/60 font-bold text-sm mr-12">إدارة قوائم المشتريات والطلبيات الخاصة بك</p>
                        )}
                    </div>

                    {!selectedList && (
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="rounded-2xl h-14 w-full sm:w-auto px-8 font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105"
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
                            <div key={i} className="h-64 bg-white/50 border-2 border-black/5 rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : selectedList ? (
                    /* Detailed Item View */
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-primary/[0.03] p-8 rounded-[2.5rem] border-2 border-primary/10">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-foreground">{selectedList.name}</h2>
                                <div className="flex items-center gap-4">
                                    <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest">
                                        {selectedList.items?.length || 0} صنف في القائمة
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {['EGP', 'AED'].map((curr) => (
                                            <button
                                                key={curr}
                                                onClick={() => handleUpdateListCurrency(selectedList.id, curr)}
                                                className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black transition-all",
                                                    selectedList.currency === curr
                                                        ? "bg-primary text-white"
                                                        : "bg-black/5 text-secondary/40 hover:bg-black/10"
                                                )}
                                            >
                                                {curr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-0.5">إجمالي القائمة</p>
                                    <p className="text-2xl font-black text-primary">
                                        {(selectedList.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0).toLocaleString(selectedList.currency === 'AED' ? 'en-AE' : 'ar-EG')} <span className="text-xs">{selectedList.currency === 'AED' ? 'AED' : 'ج.م'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selectedList.items?.length > 0 ? (
                                selectedList.items.map((item: any, idx: number) => (
                                    <div
                                        key={item.id}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                        className={clsx(
                                            "bg-white/80 backdrop-blur-xl border-2 rounded-[2.5rem] p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 group transition-all",
                                            item.is_checked ? "border-primary/20 bg-primary/[0.01] opacity-70" : "border-black/5 hover:border-black/10"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleToggleItemCheck(item.id, item.is_checked)}
                                                    className={clsx(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                                        item.is_checked
                                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                            : "bg-black/5 text-secondary/20 hover:bg-black/10"
                                                    )}
                                                >
                                                    {item.is_checked ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                                </button>

                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-black uppercase text-secondary/30">{item.brand}</span>
                                                    <p className={clsx(
                                                        "text-xl font-black leading-tight",
                                                        item.is_checked ? "text-secondary/40 line-through" : "text-foreground"
                                                    )}>{item.model}</p>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isDeletingItem === item.id}
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 transition-all shrink-0"
                                            >
                                                {isDeletingItem === item.id ? <Loader2 size={16} className="animate-spin" /> : <X size={20} />}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest px-1 block text-right">الكمية</label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                        className="h-10 rounded-xl font-bold text-center bg-black/[0.02]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest px-1 block text-right">السعر</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                                    className="h-10 rounded-xl font-bold text-center bg-black/[0.02]"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">الإجمالي</span>
                                            <span className="text-lg font-black text-primary">
                                                {(item.price * item.quantity).toLocaleString(selectedList.currency === 'AED' ? 'en-AE' : 'ar-EG')} <span className="text-[10px]">{selectedList.currency === 'AED' ? 'AED' : 'ج.م'}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center opacity-20">
                                    <ShoppingCart size={64} strokeWidth={1} className="mx-auto mb-4" />
                                    <p className="font-black uppercase text-xs tracking-widest">القائمة فارغة حالياً</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : lists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lists.map((list) => (
                            <div
                                key={list.id}
                                className="group relative bg-white/80 backdrop-blur-xl border-2 border-black/5 rounded-[2.5rem] p-8 hover:border-primary/20 transition-all duration-500 hover:translate-y-[-4px]"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                                                {list.name}
                                            </h3>
                                            <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest">
                                                {new Date(list.created_at).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="secondary" className="rounded-full bg-black/5 border-none font-black px-3 py-1.5 flex items-center gap-2 shrink-0">
                                                <ShoppingCart size={14} className="opacity-40" />
                                                {list.items?.length || 0} قطع
                                            </Badge>
                                            <Badge className={clsx(
                                                "rounded-full font-black px-3 py-1 border-none text-[10px]",
                                                list.currency === 'AED' ? "bg-blue-500/10 text-blue-600" : "bg-primary/10 text-primary"
                                            )}>
                                                {list.currency}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-4">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 rounded-xl font-bold gap-2 h-11 bg-black/5 hover:bg-black/10 text-secondary/70 border-none px-2 text-xs md:text-sm"
                                            onClick={() => copyLink(list.public_id)}
                                        >
                                            {copiedId === list.public_id ? <Check size={16} /> : <Copy size={16} />}
                                            <span>{copiedId === list.public_id ? 'تم النسخ' : 'نسخ الرابط'}</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-11 h-11 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            onClick={() => handleDelete(list.id)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>

                                    <Button
                                        variant="primary"
                                        onClick={() => setSelectedList(list)}
                                        className="w-full rounded-xl font-black h-12 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border-none"
                                    >
                                        <ExternalLink size={18} className="ml-2" />
                                        <span>عرض المحتويات</span>
                                    </Button>
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
