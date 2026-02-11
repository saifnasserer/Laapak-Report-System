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
    EyeOff,
    Clock,
    History,
    ChevronLeft,
    Activity,
    FileText,
    ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ViewMode = 'list' | 'history' | 'details';

export default function WebhookSubscriptions() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superadmin';
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedSub, setSelectedSub] = useState<any | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

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

    const fetchLogs = async (id: number) => {
        setIsLoadingLogs(true);
        try {
            const res = await api.get(`/settings/webhooks/outgoing/${id}/logs`);
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const navigateToHistory = (sub: any) => {
        setSelectedSub(sub);
        setViewMode('history');
        fetchLogs(sub.id);
    };

    const navigateToDetails = (sub: any) => {
        setSelectedSub(sub);
        setViewMode('details');
    };

    const navigateBack = () => {
        setViewMode('list');
        setSelectedSub(null);
        setLogs([]);
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

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isSuperAdmin) return;
        if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;

        try {
            await api.delete(`/settings/webhooks/outgoing/${id}`);
            setSubscriptions(prev => prev.filter(s => s.id !== id));
            if (viewMode !== 'list') navigateBack();
        } catch (err) {
            console.error('Failed to delete subscription:', err);
            alert('فشل في حذف الاشتراك');
        }
    };

    const handleTest = async (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const res = await api.post(`/settings/webhooks/outgoing/${id}/test`);
            if (res.data.success) {
                alert('تم إرسال تجريبي بنجاح! كود الاستجابة: ' + res.data.response_code);
            } else {
                alert('فشل الإرسال التجريبي: ' + (res.data.error || 'خطأ غير معروف'));
            }
            if (viewMode === 'history') fetchLogs(id);
            fetchSubscriptions();
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
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    {viewMode !== 'list' ? (
                        <button
                            onClick={navigateBack}
                            className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center text-secondary/60 hover:bg-secondary/10 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                            <Send size={24} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-xl font-black text-foreground">
                            {viewMode === 'list' && 'الاشتراكات (Outgoing)'}
                            {viewMode === 'history' && `سجل إرسال: ${selectedSub?.name}`}
                            {viewMode === 'details' && `تفاصيل: ${selectedSub?.name}`}
                        </h3>
                        <p className="text-sm text-secondary/60 font-medium">
                            {viewMode === 'list' && 'إرسال تنبيهات للأنظمة الخارجية عند حدوث حركات في النظام'}
                            {viewMode !== 'list' && selectedSub?.url}
                        </p>
                    </div>
                </div>
                {viewMode === 'list' && isSuperAdmin && !isAdding && (
                    <Button
                        onClick={() => setIsAdding(true)}
                        variant="primary"
                        className="rounded-full px-8 h-12 font-bold shadow-none"
                        icon={<Plus size={20} />}
                    >
                        إضافة اشتراك
                    </Button>
                )}
            </div>

            {viewMode === 'list' && isAdding && (
                <Card variant="glass" className="border-primary/20 bg-primary/[0.02] rounded-[3rem] shadow-none overflow-hidden mb-8">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black">إضافة اشتراك جديد</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-full w-8 h-8 p-0">
                                <Plus className="rotate-45" size={20} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-secondary/60 pr-2">اسم الوجهة</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: n8n Workflow, CRM..."
                                        className="w-full bg-white border border-black/5 rounded-2xl px-6 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-none"
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
                                        className="w-full bg-white border border-black/5 rounded-2xl px-6 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-none"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-wider text-secondary/60 pr-2">الأحداث المشترك بها</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableEvents.map(event => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() => toggleEvent(event.id)}
                                            className={cn(
                                                "px-6 py-2.5 rounded-full text-[10px] font-black transition-all border shadow-none",
                                                formData.events.includes(event.id)
                                                    ? "bg-primary text-white border-primary"
                                                    : "bg-white text-secondary/60 border-black/5 hover:border-primary/40"
                                            )}
                                        >
                                            {event.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="rounded-full px-8 h-12 font-bold shadow-none">
                                    إلغاء
                                </Button>
                                <Button type="submit" variant="primary" isLoading={isSaving} className="rounded-full px-12 h-12 font-bold shadow-none">
                                    حفظ الاشتراك
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {viewMode === 'list' && (
                <div className="grid grid-cols-1 gap-3">
                    {subscriptions.length > 0 ? subscriptions.map((sub) => (
                        <div
                            key={sub.id}
                            className="bg-white/60 border border-black/5 rounded-full p-3 pl-6 hover:bg-white transition-all group flex items-center justify-between shadow-none"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-black/5",
                                    sub.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                )}>
                                    <Link size={18} />
                                </div>
                                <div className="min-w-0 flex items-center gap-3">
                                    <h4 className="font-black text-sm text-foreground truncate">{sub.name}</h4>
                                    <Badge variant={sub.status === 'active' ? 'success' : 'destructive'} className="h-5 px-2 rounded-full text-[9px] font-black uppercase shadow-none border-none">
                                        {sub.status === 'active' ? 'نشط' : 'معطل'}
                                    </Badge>
                                    <span className="hidden md:block text-[10px] font-bold text-secondary/30 truncate max-w-[200px]">
                                        {sub.url}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => navigateToHistory(sub)}
                                    className="p-2 text-secondary/40 hover:text-primary transition-all hover:bg-primary/5 rounded-full"
                                    title="السجلات"
                                >
                                    <History size={18} />
                                </button>
                                <button
                                    onClick={() => navigateToDetails(sub)}
                                    className="p-2 text-secondary/40 hover:text-primary transition-all hover:bg-primary/5 rounded-full"
                                    title="الإعدادات"
                                >
                                    <Settings size={18} />
                                </button>
                                <button
                                    onClick={() => handleTest(sub.id)}
                                    className="px-4 py-1.5 rounded-full text-[10px] font-black bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-none"
                                >
                                    تجربة
                                </button>
                                {isSuperAdmin && (
                                    <button
                                        onClick={(e) => handleDelete(sub.id, e)}
                                        className="p-2 text-secondary/20 hover:text-destructive transition-all rounded-full"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="p-16 text-center bg-white/40 border-2 border-dashed border-black/5 rounded-[3rem]">
                            <div className="w-16 h-16 bg-secondary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-secondary/20">
                                <Send size={32} />
                            </div>
                            <h5 className="text-lg font-black text-secondary/40 mb-2">لا يوجد اشتراكات نشطة</h5>
                            <button onClick={() => setIsAdding(true)} className="text-sm font-black text-primary hover:underline">أضف أول اشتراك من هنا</button>
                        </div>
                    )}
                </div>
            )}

            {viewMode === 'history' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 gap-3">
                        {isLoadingLogs ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : logs.length > 0 ? logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-center gap-4 p-4 px-6 bg-white/60 border border-black/5 rounded-full hover:bg-white transition-all shadow-none group/log"
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    log.status === 'success' ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                )}>
                                    {log.status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-black text-foreground">{log.event}</span>
                                        <Badge variant={log.status === 'success' ? 'success' : 'destructive'} className="text-[8px] h-4 px-1.5 uppercase font-black border-none shadow-none">
                                            {log.response_code || 'Err'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-secondary/40">
                                        <span className="flex items-center gap-1"><Clock size={10} className="text-secondary/20" />{new Date(log.created_at).toLocaleString('ar-EG')}</span>
                                        <span className="flex items-center gap-1"><Activity size={10} className="text-secondary/20" />{log.duration}ms</span>
                                    </div>
                                </div>

                                {log.error_message && (
                                    <div className="hidden md:block max-w-[200px]">
                                        <p className="text-[10px] font-bold text-destructive truncate">{log.error_message}</p>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-16 bg-secondary/5 rounded-[3rem] text-secondary/30 font-bold italic border-2 border-dashed border-black/5">
                                لا يوجد سجلات إرسال لهذا الاشتراك حتى الآن
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'details' && selectedSub && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    <Card variant="glass" className="rounded-[3rem] shadow-none border-black/5 bg-white/60 overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                إعدادات الاشتراك
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/30 pr-2">الأحداث المشترك بها</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(typeof selectedSub.events === 'string' ? JSON.parse(selectedSub.events) : selectedSub.events).map((e: string) => {
                                        const label = availableEvents.find(ae => ae.id === e)?.label || e;
                                        return (
                                            <span key={e} className="px-4 py-1.5 rounded-full bg-secondary/5 text-secondary/60 text-[10px] font-black">
                                                {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/30">مفتاح السر (Signature Key)</span>
                                    <button onClick={() => setShowSecret(!showSecret)} className="text-primary text-[10px] font-black hover:underline">
                                        {showSecret ? 'إخفاء' : 'إظهار مأمن'}
                                    </button>
                                </div>
                                <div className="bg-secondary/[0.03] rounded-2xl px-5 py-4 border border-black/5 font-mono text-xs text-secondary/60 break-all leading-relaxed">
                                    {showSecret ? selectedSub.secret : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass" className="rounded-[3rem] shadow-none border-black/5 bg-white/60 overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <Activity size={18} className="text-primary" />
                                حالة الإرسال الأخيرة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4 py-12">
                            {selectedSub.last_response_code ? (
                                <>
                                    <div className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black mb-2",
                                        selectedSub.last_response_code >= 200 && selectedSub.last_response_code < 300 ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                    )}>
                                        {selectedSub.last_response_code}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-foreground">آخر محاولة إرسال</p>
                                        <p className="text-xs font-bold text-secondary/40">{new Date(selectedSub.last_triggered_at).toLocaleString('ar-EG')}</p>
                                    </div>
                                    <button
                                        onClick={() => handleTest(selectedSub.id)}
                                        className="mt-4 px-10 py-3 rounded-full bg-primary text-white text-xs font-black shadow-none hover:opacity-90 transition-all"
                                    >
                                        إعادة الاختبار الآن
                                    </button>
                                </>
                            ) : (
                                <div className="py-8">
                                    <div className="w-16 h-16 bg-secondary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary/20">
                                        <Send size={24} />
                                    </div>
                                    <p className="text-sm font-black text-secondary/40">لم يتم إرسال أي بيانات لهذه الوجهة بعد</p>
                                    <button onClick={() => handleTest(selectedSub.id)} className="mt-4 text-xs font-black text-primary hover:underline">إرسال طلب تجريبي الآن</button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
