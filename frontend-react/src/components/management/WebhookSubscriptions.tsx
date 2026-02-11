'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Plus,
    Trash2,
    Loader2,
    Globe,
    AlertCircle,
    CheckCircle2,
    Settings,
    Shield,
    Link,
    Send,
    Eye,
    EyeOff
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function WebhookSubscriptions() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superadmin';
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showSecretId, setShowSecretId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        url: '',
        events: ['report.created'],
        status: 'active'
    });

    const availableEvents = [
        { id: 'report.created', label: 'إنشاء تقرير' },
        { id: 'report.updated', label: 'تحديث تقرير' },
        { id: 'invoice.created', label: 'إنشاء فاتورة' }
    ];

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/settings/webhooks/outgoing');
            setSubscriptions(res.data);
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSuperAdmin) return;
        setIsSaving(true);

        try {
            const res = await api.post('/settings/webhooks/outgoing', formData);
            setSubscriptions([res.data, ...subscriptions]);
            setIsAdding(false);
            setFormData({ name: '', url: '', events: ['report.created'], status: 'active' });
        } catch (err: any) {
            console.error('Failed to create subscription:', err);
            alert(err.response?.data?.message || 'فشل في إضافة الاشتراك');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!isSuperAdmin) return;
        if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;

        try {
            await api.delete(`/settings/webhooks/outgoing/${id}`);
            setSubscriptions(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to delete subscription:', err);
            alert('فشل في حذف الاشتراك');
        }
    };

    const handleTest = async (id: number) => {
        try {
            const res = await api.post(`/settings/webhooks/outgoing/${id}/test`);
            if (res.data.success) {
                alert('تم إرسال تجريبي بنجاح! كود الاستجابة: ' + res.data.response_code);
            } else {
                alert('فشل الإرسال التجريبي: ' + (res.data.error || 'خطأ غير معروف'));
            }
            fetchSubscriptions(); // Refresh to see last_triggered_at
        } catch (err) {
            console.error('Test failed:', err);
            alert('فشل في إرسال الاختبار');
        }
    };

    const toggleEvent = (eventId: string) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.includes(eventId)
                ? prev.events.filter(e => e !== eventId)
                : [...prev.events, eventId]
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                        <Send size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground">الاشتراكات (Outgoing)</h3>
                        <p className="text-sm text-secondary/60 font-medium">إرسال تنبيهات للأنظمة الخارجية عند حدوث حركات في النظام</p>
                    </div>
                </div>
                {isSuperAdmin && !isAdding && (
                    <Button
                        onClick={() => setIsAdding(true)}
                        variant="primary"
                        className="rounded-2xl px-6 h-12 font-bold"
                        icon={<Plus size={20} />}
                    >
                        إضافة اشتراك جديد
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card variant="glass" className="border-primary/20 bg-primary/[0.02] rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-6 md:p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black">إضافة اشتراك جديد</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-full w-8 h-8 p-0">
                                <Plus className="rotate-45" size={20} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-secondary/60 pr-2">اسم الوجهة</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: n8n Workflow, CRM..."
                                        className="w-full bg-white border border-black/5 rounded-2xl px-6 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-secondary/60 pr-2">رابط الـ Webhook (URL)</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://your-api.com/webhook"
                                        className="w-full bg-white border border-black/5 rounded-2xl px-6 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-wider text-secondary/60 pr-2">الأحداث المشترك بها</label>
                                <div className="flex flex-wrap gap-3">
                                    {availableEvents.map(event => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() => toggleEvent(event.id)}
                                            className={cn(
                                                "px-6 py-3 rounded-2xl text-xs font-black transition-all border",
                                                formData.events.includes(event.id)
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                    : "bg-white text-secondary/60 border-black/5 hover:border-primary/40"
                                            )}
                                        >
                                            {event.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="rounded-2xl px-8 h-12 font-bold">
                                    إلغاء
                                </Button>
                                <Button type="submit" variant="primary" isLoading={isSaving} className="rounded-2xl px-12 h-12 font-bold">
                                    حفظ الاشتراك
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {subscriptions.length > 0 ? subscriptions.map((sub) => (
                    <Card key={sub.id} variant="glass" className="border-black/5 bg-white/60 hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5 transition-all group-hover:scale-105",
                                        sub.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                    )}>
                                        <Link size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-black text-lg text-foreground truncate">{sub.name}</h4>
                                            <Badge variant={sub.status === 'active' ? 'success' : 'destructive'} className="h-6 px-3 rounded-full text-[10px] font-black uppercase">
                                                {sub.status === 'active' ? 'نشط' : 'معطل'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-secondary/40">
                                            <Globe size={14} className="text-secondary/20" />
                                            <span className="truncate max-w-[300px]">{sub.url}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                    <button
                                        onClick={() => handleTest(sub.id)}
                                        className="h-10 px-6 rounded-2xl bg-primary/5 text-primary text-xs font-black hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <Send size={14} />
                                        إرسال تجريبي
                                    </button>
                                    {isSuperAdmin && (
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-secondary/40 hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-black/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30">الأحداث</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {sub.events.map((e: string) => (
                                            <span key={e} className="px-2 py-0.5 rounded-lg bg-secondary/5 text-secondary/60 text-[10px] font-bold">
                                                {e}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30">مفتاح السر</span>
                                    <div className="flex items-center gap-2 bg-secondary/[0.03] rounded-xl px-3 py-1.5 border border-black/5">
                                        <Shield size={12} className="text-secondary/20" />
                                        <span className="font-mono text-[10px] text-secondary/60 flex-1 truncate">
                                            {showSecretId === sub.id ? sub.secret : '••••••••••••••••••••••••••••••••'}
                                        </span>
                                        <button onClick={() => setShowSecretId(showSecretId === sub.id ? null : sub.id)} className="text-secondary/30 hover:text-primary">
                                            {showSecretId === sub.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30">آخر استجابة</span>
                                    <div className="flex items-center gap-2">
                                        {sub.last_response_code ? (
                                            <>
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    sub.last_response_code >= 200 && sub.last_response_code < 300 ? "bg-green-500" : "bg-destructive"
                                                )} />
                                                <span className="text-[10px] font-black text-secondary/60">{sub.last_response_code}</span>
                                                <span className="text-[10px] font-bold text-secondary/30">{sub.last_triggered_at ? new Date(sub.last_triggered_at).toLocaleString('ar-EG') : ''}</span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] font-bold text-secondary/30">لم يتم الإرسال بعد</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="p-16 text-center bg-white/40 border-2 border-dashed border-black/5 rounded-[3rem]">
                        <div className="w-16 h-16 bg-secondary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-secondary/20">
                            <Send size={32} />
                        </div>
                        <h5 className="text-lg font-black text-secondary/40 mb-2">لا يوجد اشتراكات نشطة</h5>
                        <p className="text-sm font-medium text-secondary/30 mb-8 max-w-xs mx-auto">أضف رابط Webhook لاستلام إشعارات فورية عند حدوث تغييرات في النظام</p>
                        {isSuperAdmin && (
                            <Button onClick={() => setIsAdding(true)} variant="primary" className="rounded-2xl px-8 h-12 font-bold focus:ring-4 focus:ring-primary/20">
                                إنشاء أول اشتراك
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
