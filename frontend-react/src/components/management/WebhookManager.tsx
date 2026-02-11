'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Activity,
    Trash2,
    Loader2,
    Search,
    X,
    Clock,
    Globe,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import WebhookSubscriptions from './WebhookSubscriptions';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function WebhookManager() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superadmin';
    const [activeTab, setActiveTab] = useState<'logs' | 'subscriptions'>('logs');
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/settings/webhooks/logs');
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch webhook logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (logId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isSuperAdmin) return;
        if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

        try {
            await api.delete(`/settings/webhooks/logs/${logId}`);
            setLogs(prev => prev.filter(l => l.id !== logId));
        } catch (err) {
            console.error('Failed to delete log:', err);
            alert('فشل في حذف السجل');
        }
    };

    const handleClearAll = async () => {
        if (!isSuperAdmin) return;
        if (!confirm('هل أنت متأكد من مسح جميع السجلات؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        try {
            await api.delete('/settings/webhooks/logs');
            setLogs([]);
        } catch (err) {
            console.error('Failed to clear logs:', err);
            alert('فشل في مسح السجلات');
        }
    };

    const filteredLogs = logs.filter(l =>
        l.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.errorMessage && l.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleExpand = (id: number) => {
        setExpandedLogId(expandedLogId === id ? null : id);
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
            {/* Tab Navigation */}
            <div className="flex p-1.5 bg-secondary/5 rounded-2xl w-fit mx-auto mb-8">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                        "px-8 py-2.5 rounded-xl text-sm font-black transition-all",
                        activeTab === 'logs'
                            ? "bg-white text-primary shadow-sm"
                            : "text-secondary/40 hover:text-secondary/60"
                    )}
                >
                    سجلات الطلبات (Incoming)
                </button>
                <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={cn(
                        "px-8 py-2.5 rounded-xl text-sm font-black transition-all",
                        activeTab === 'subscriptions'
                            ? "bg-white text-primary shadow-sm"
                            : "text-secondary/40 hover:text-secondary/60"
                    )}
                >
                    الاشتراكات (Outgoing)
                </button>
            </div>

            {activeTab === 'logs' ? (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground">مدير الـ Webhooks</h3>
                                <p className="text-sm text-secondary/60 font-medium">مراقبة الطلبات الواردة من الأنظمة الخارجية</p>
                            </div>
                        </div>
                        {isSuperAdmin && logs.length > 0 && (
                            <Button
                                onClick={handleClearAll}
                                variant="destructive"
                                className="rounded-2xl px-6 h-12 font-bold"
                                icon={<Trash2 size={20} />}
                            >
                                مسح الكل
                            </Button>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40" size={18} />
                        <input
                            type="text"
                            placeholder="بحث في المصدر أو الحدث أو الأخطاء..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-black/5 rounded-2xl pr-12 pl-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </>
            ) : null}

            {activeTab === 'logs' ? (
                /* Logs List */
                <div className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden">
                    <div className="divide-y divide-black/5">
                        {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                            <div key={log.id} className="transition-colors group">
                                <div
                                    className="p-4 md:p-6 cursor-pointer hover:bg-primary/[0.02]"
                                    onClick={() => toggleExpand(log.id)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center border border-black/5",
                                                log.status === 'success' ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                            )}>
                                                {log.status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-black text-foreground truncate">{log.source}</h4>
                                                    <Badge
                                                        variant={log.status === 'success' ? 'success' : 'destructive'}
                                                        className="text-[10px] py-0 px-2 rounded-lg font-black uppercase tracking-wider h-5"
                                                    >
                                                        {log.event}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-bold text-secondary/40">
                                                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-secondary/20" />{new Date(log.created_at).toLocaleString('ar-EG')}</span>
                                                    <span className="flex items-center gap-1.5"><Activity size={12} className="text-secondary/20" />{log.ipAddress || 'Unknown IP'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8">
                                            {log.errorMessage && (
                                                <span className="text-xs font-bold text-destructive truncate max-w-[200px]">
                                                    {log.errorMessage}
                                                </span>
                                            )}

                                            <div className="flex gap-2">
                                                <button className="text-secondary/40">
                                                    {expandedLogId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={(e) => handleDelete(log.id, e)}
                                                        className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-secondary/40 hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Component: Payload View */}
                                {expandedLogId === log.id && (
                                    <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="bg-surface-variant/50 rounded-3xl p-6 border border-black/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="text-xs font-black uppercase tracking-[0.2em] text-secondary/40">Payload (Data)</h5>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
                                                        alert('تم نسخ البيانات');
                                                    }}
                                                    className="text-[10px] font-black text-primary hover:underline"
                                                >
                                                    نسخ البيانات
                                                </button>
                                            </div>
                                            <pre className="text-[11px] font-mono text-secondary/80 overflow-x-auto p-4 bg-white rounded-2xl border border-black/5 leading-relaxed">
                                                {JSON.stringify(log.payload, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="p-12 text-center text-secondary/40 font-bold">
                                لا يوجد سجلات مطابقة للبحث
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <WebhookSubscriptions />
            )}
        </div>
    );
}
