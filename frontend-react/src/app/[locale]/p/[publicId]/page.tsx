'use client';

import React, { useState, useEffect, use } from 'react';
import { ShoppingCart, CheckCircle2, Circle, Loader2, Package } from 'lucide-react';
import api from '@/lib/api';
import { clsx } from 'clsx';

export default function PublicShoppingListPage({ params }: { params: Promise<{ publicId: string; locale: string }> }) {
    const { publicId } = use(params);
    const [list, setList] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchList();
    }, [publicId]);

    const fetchList = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/shopping-lists/p/${publicId}`);
            if (res.data.success) {
                setList(res.data.data);
            } else {
                setError('القائمة غير موجودة أو تم حذفها');
            }
        } catch (err) {
            setError('تعذر تحميل القائمة. يرجى التأكد من الرابط');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCheck = async (itemId: number, currentStatus: boolean) => {
        if (!list?.settings?.allowPublicCheck) return;

        // Optimistic update
        setList({
            ...list,
            items: list.items.map((item: any) =>
                item.id === itemId ? { ...item, is_checked: !currentStatus } : item
            )
        });

        try {
            await api.patch(`/shopping-lists/p/${publicId}/check/${itemId}`, {
                is_checked: !currentStatus
            });
        } catch (err) {
            console.error('Failed to update check status:', err);
            // Revert on error
            fetchList();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-secondary/40 font-black text-[10px] uppercase tracking-[0.3em]">جاري تحميل القائمة</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-red-500/5">
                    <ShoppingCart size={48} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-foreground">{error}</h1>
                    <p className="text-secondary/60 font-bold">يرجى التواصل مع المشرف للحصول على رابط صحيح</p>
                </div>
            </div>
        );
    }

    const items = list?.items || [];
    const completedCount = items.filter((i: any) => i.is_checked).length;
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-20 selection:bg-primary/10">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-3xl sticky top-0 z-10 border-b-2 border-black/5 px-6 py-10">
                <div className="max-w-xl mx-auto space-y-8">
                    <div className="flex items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black text-foreground tracking-tight leading-none">{list.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded-md">LAAPAK Shopping List</span>
                            </div>
                        </div>
                        <div className="shrink-0 w-16 h-16 bg-primary/10 rounded-[2.2rem] flex items-center justify-center text-primary shadow-xl shadow-primary/20 transition-transform hover:scale-105">
                            <ShoppingCart size={32} strokeWidth={1.5} />
                        </div>
                    </div>

                    {list.settings?.showCheckboxes && items.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-6 pt-6 border-t border-black/5">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tighter">
                                    <span className="text-secondary/30">الإحصائيات</span>
                                    <div className="flex gap-2">
                                        <span className="text-secondary/40">{completedCount} / {items.length}</span>
                                        <span className="text-primary pr-2 border-r border-black/5">{Math.round(progress)}% Complete</span>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden p-0.5 border border-black/[0.03]">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-sm shadow-primary/40"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="shrink-0 bg-primary/[0.03] p-6 rounded-[2rem] border-2 border-primary/10 flex flex-col justify-center">
                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] mb-1">إجمالي القائمة</p>
                                <p className="text-2xl font-black text-primary">
                                    {(items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0).toLocaleString(list.currency === 'AED' ? 'en-AE' : 'ar-EG')} <span className="text-xs">{list.currency === 'AED' ? 'AED' : 'ج.م'}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-xl mx-auto p-6 space-y-3 mt-6">
                {items.length > 0 ? (
                    items.map((item: any, idx: number) => (
                        <div
                            key={item.id}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => list.settings?.allowPublicCheck && toggleCheck(item.id, item.is_checked)}
                            className={clsx(
                                "group bg-white border-2 rounded-[2.2rem] p-6 flex items-center gap-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2",
                                item.is_checked
                                    ? "border-primary/20 bg-primary/[0.01] opacity-60"
                                    : "border-black/5 active:scale-[0.97] cursor-pointer hover:border-primary/20 hover:shadow-xl hover:shadow-black/[0.02]"
                            )}
                        >
                            {list.settings?.showCheckboxes && (
                                <div className={clsx(
                                    "w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all duration-500 border-2",
                                    item.is_checked
                                        ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30"
                                        : "bg-black/[0.02] border-transparent text-secondary/20 group-hover:bg-primary/5 group-hover:text-primary/40"
                                )}>
                                    {item.is_checked ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={2} />}
                                </div>
                            )}

                            <div className="flex-1 space-y-3 text-right">
                                <div className="flex items-center justify-between">
                                    <span className={clsx(
                                        "text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg",
                                        item.is_checked ? "bg-black/5 text-secondary/40" : "bg-primary/10 text-primary"
                                    )}>
                                        {item.brand}
                                    </span>

                                    {item.price > 0 && (
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest leading-none mb-1">الإجمالي</p>
                                            <p className="text-lg font-black text-primary">
                                                {(item.price * item.quantity).toLocaleString(list.currency === 'AED' ? 'en-AE' : 'ar-EG')} <span className="text-[10px]">{list.currency === 'AED' ? 'AED' : 'ج.م'}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-end justify-between gap-4">
                                    <h3 className={clsx(
                                        "text-xl font-black transition-all duration-500 flex-1",
                                        item.is_checked ? "text-secondary/30 line-through" : "text-foreground group-hover:text-primary"
                                    )}>
                                        {item.model}
                                    </h3>
                                    {item.quantity > 1 && (
                                        <div className="flex items-center gap-1 bg-black/5 px-2.5 py-1 rounded-xl text-xs font-black shrink-0">
                                            <span className="text-[10px] opacity-40 uppercase tracking-widest">Qty</span>
                                            <span>{item.quantity}</span>
                                        </div>
                                    )}
                                </div>
                                {item.price > 0 && (
                                    <p className="text-[11px] font-bold text-secondary/40">سعر القطعة: {item.price.toLocaleString(list.currency === 'AED' ? 'en-AE' : 'ar-EG')} {list.currency === 'AED' ? 'AED' : 'ج.م'}</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 space-y-4 opacity-10">
                        <Package size={96} strokeWidth={1} className="mx-auto" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">قائمة فارغة</p>
                    </div>
                )}
            </div>

            {/* Signature */}
            <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-2">
                <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.4em]">Inventory Intelligence by LAAPAK</p>
                <div className="h-1 w-8 bg-black/[0.03] mx-auto rounded-full" />
            </div>
        </div>
    );
}
