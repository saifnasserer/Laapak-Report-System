'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    LayoutDashboard,
    LogOut,
    Settings,
    User,
    Search,
    Menu,
    X,
    Bell,
    TriangleAlert,
    ShieldCheck,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ScanBarcode,
    CalendarCheck,
    CalendarX,
    Phone,
    Eye,
    Plus,
    Clock,
    FileText,
    Users,
    Calendar,
    ArrowRight,
    CheckCircle2,
    Circle,
    Send
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from '@/i18n/routing';
import api from '@/lib/api';
import { use } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}



export default function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('dashboard.admin');
    const router = useRouter();
    const { user, logout } = useAuth();

    const [stats, setStats] = useState({
        isLoading: true
    });

    const [warrantyAlerts, setWarrantyAlerts] = useState<any[]>([]);
    const [recentReports, setRecentReports] = useState<any[]>([]);
    const [isReportsLoading, setIsReportsLoading] = useState(true);
    const [isWarrantyAlertsOpen, setIsWarrantyAlertsOpen] = useState(false);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; alert: any | null }>({ open: false, alert: null });

    const fetchDashboardData = async () => {
        setStats(prev => ({ ...prev, isLoading: true }));
        setIsReportsLoading(true);
        try {
            // Fetch Warranty Alerts and Recent Reports
            const [warrantyRes, allPendingRes] = await Promise.all([
                api.get('/reports/insights/warranty-alerts').catch(() => ({ data: [] })),
                api.get('/reports?status=pending&limit=50')
            ]);

            // Handle Warranty Data (ensure it's an array)
            const alertsData = Array.isArray(warrantyRes.data) ? warrantyRes.data : [];
            setWarrantyAlerts(alertsData);

            setStats({
                isLoading: false
            });

            // The backend returns the array directly for GET /reports
            const reportsArray = Array.isArray(allPendingRes.data) ? allPendingRes.data : (allPendingRes.data.reports || []);
            // Simple slice for "Recent"
            setRecentReports(reportsArray.slice(0, 5));

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setStats(prev => ({ ...prev, isLoading: false }));
        } finally {
            setIsReportsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleSendReminder = async (alert: any) => {
        try {
            setSendingReminder(alert.report_id);

            await api.post(`/reports/${alert.report_id}/send-warranty-reminder`, {
                warranty_type: alert.warranty_type
            });

            // Refresh dashboard data to update the UI
            await fetchDashboardData();

            setConfirmDialog({ open: false, alert: null });
        } catch (error: any) {
            console.error('Failed to send reminder:', error);
            alert('فشل إرسال التذكير: ' + (error.response?.data?.message || error.message));
        } finally {
            setSendingReminder(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: any = {
            'completed': { label: 'مكتمل', variant: 'success' },
            'pending': { label: 'انتظار', variant: 'warning' },
            'cancelled': { label: 'ملغي', variant: 'destructive' },
            'active': { label: 'نشط', variant: 'primary' },
        };

        const info = statusMap[status] || { label: status, variant: 'secondary' };
        return (
            <Badge variant={info.variant} circular className="px-3 py-1 text-xs">
                {info.label}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                {/* Admin Custom Header */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-black/5 shadow-sm gap-6">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <Image src="/logo.png" alt="Laapak" width={140} height={40} className="h-8 w-auto object-contain" priority />
                        <div className="h-8 w-[1px] bg-black/10 hidden md:block" />
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold tracking-tight">مرحباً، {user?.username}</h1>
                            <p className="text-xs text-secondary font-medium">لوحة تحكم النظام</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <div className="flex items-center gap-3">
                            <Button
                                size="md"
                                icon={<Plus size={20} />}
                                onClick={() => router.push('/dashboard/admin/reports/new')}
                                className="bg-primary text-white hover:scale-105 active:scale-95 transition-all font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                            >
                                إضافة تقرير
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-destructive hover:bg-destructive/5 rounded-xl font-bold px-4 h-12 flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">خروج</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Recent Reports - Row Style */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black flex items-center gap-3 px-2">
                        <Clock size={28} className="text-primary" />
                        أحدث الطلبات المعلقة
                    </h2>

                    {isReportsLoading ? (
                        <div className="p-12 text-center text-secondary/60 font-medium bg-white/40 rounded-[2rem] border border-dashed border-black/10">جاري التحميل...</div>
                    ) : recentReports.length > 0 ? (
                        <div className="space-y-4">
                            {recentReports.map((report) => (
                                <Card
                                    key={report.id}
                                    variant="glass"
                                    className="border-black/5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer rounded-[2rem] bg-white/60 backdrop-blur-sm"
                                    onClick={() => router.push(`/dashboard/admin/reports/${report.id}`)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shrink-0">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-black text-lg text-foreground">{report.client_name}</span>
                                                    <span className="text-sm font-bold text-secondary/40">#{report.order_number}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm font-medium text-secondary/60">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users size={14} />
                                                        {report.device_model}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={14} />
                                                        {new Date(report.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pl-2">
                                            {getStatusBadge(report.status)}
                                            <Button
                                                variant="ghost"
                                                className="rounded-full w-12 h-12 p-0 hover:bg-primary hover:text-white transition-colors text-secondary/40"
                                            >
                                                <ArrowRight size={20} className="rotate-180" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/40 border border-dashed border-black/10 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center text-secondary/20">
                                <FileText size={40} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">لا توجد طلبات معلقة</h3>
                                <p className="text-secondary/60 font-medium">جميع الطلبات تمت معالجتها</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    {/* Warranty Alerts Section */}
                    <Card variant="glass" className="h-full border-black/5 bg-white/60 backdrop-blur-sm">
                        <div
                            className={`flex justify-between items-center cursor-pointer select-none ${isWarrantyAlertsOpen ? 'mb-6' : 'mb-0'}`}
                            onClick={() => setIsWarrantyAlertsOpen(!isWarrantyAlertsOpen)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm border border-amber-500/10">
                                    <TriangleAlert size={24} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-lg m-0 text-amber-950">تنبيهات الضمان</h5>
                                    <p className="text-secondary/60 text-sm m-0 font-medium">العملاء الذين تنتهي ضماناتهم قريباً</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="warning" circular className="text-sm px-4 py-1.5 shadow-sm">
                                    {warrantyAlerts.length}
                                </Badge>
                                {isWarrantyAlertsOpen ? (
                                    <ChevronUp size={20} className="text-secondary/60" />
                                ) : (
                                    <ChevronDown size={20} className="text-secondary/60" />
                                )}
                            </div>
                        </div>

                        {isWarrantyAlertsOpen && (stats.isLoading ? (
                            <div className="flex flex-col gap-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-surface-variant/50 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : warrantyAlerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-4 animate-in zoom-in duration-500">
                                    <ShieldCheck size={32} />
                                </div>
                                <p className="text-lg font-bold text-green-900">لا توجد تنبيهات ضمان</p>
                                <p className="text-secondary/60 text-sm font-medium">جميع الضمانات سارية المفعول لفترة كافية</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Summary Rows */}
                                {/* Alerts List */}
                                <div className="space-y-4">
                                    {/* Sort by days remaining ascending */}
                                    {[...warrantyAlerts].sort((a, b) => a.days_remaining - b.days_remaining).map((alert, idx) => {
                                        const isCritical = alert.days_remaining <= 3;
                                        const isWarning = alert.days_remaining > 3 && alert.days_remaining <= 5;

                                        let colorClass = isCritical ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/30' :
                                            isWarning ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30' :
                                                'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/30';

                                        let badgeVariant: 'destructive' | 'warning' | 'secondary' = isCritical ? 'destructive' : isWarning ? 'warning' : 'secondary';
                                        let badgeLabel = isCritical ? 'عاجل' : isWarning ? 'تحذير' : 'تنبيه';

                                        let iconColor = isCritical ? 'text-red-500' :
                                            isWarning ? 'text-amber-500' :
                                                'text-cyan-500';

                                        return (
                                            <div key={idx} className={`rounded-[1.5rem] p-4 border ${colorClass} transition-all duration-300 hover:shadow-md group`}>
                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Left Side: Checkbox, Icon & Info */}
                                                    <div className="flex items-center gap-4">
                                                        {/* Checkbox Indicator */}
                                                        <div className="shrink-0">
                                                            {alert.is_sent ? (
                                                                <CheckCircle2
                                                                    size={24}
                                                                    className="text-green-600 cursor-pointer hover:text-green-700 transition-colors"
                                                                    strokeWidth={2.5}
                                                                />
                                                            ) : (
                                                                <Circle
                                                                    size={24}
                                                                    className="text-gray-300 cursor-pointer hover:text-gray-400 transition-colors"
                                                                    strokeWidth={2}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/10' : isWarning ? 'bg-amber-500/10' : 'bg-cyan-500/10'}`}>
                                                            <div className={iconColor}>
                                                                {isCritical ? <AlertCircle size={24} /> : <TriangleAlert size={24} />}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h6 className="font-black text-base text-foreground">{alert.client_name || 'عميل غير معروف'}</h6>
                                                                <Badge variant={badgeVariant} className="text-[10px] h-5 px-2">
                                                                    {badgeLabel}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm font-medium text-secondary/60">
                                                                <div className="flex items-center gap-1.5">
                                                                    <ScanBarcode size={14} />
                                                                    {alert.device_model || 'جهاز غير معروف'}
                                                                </div>
                                                                {alert.warranty_end_date && (
                                                                    <div className="flex items-center gap-1.5 text-foreground/80 font-bold">
                                                                        <CalendarX size={14} className="text-destructive/60" />
                                                                        ينتهي: {new Date(alert.warranty_end_date).toLocaleDateString('ar-EG')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Days Remaining & Actions */}
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-sm font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${isCritical ? 'bg-red-50 border-red-100 text-red-700' : 'bg-white border-black/5 text-secondary'}`}>
                                                            <Clock size={14} strokeWidth={2.5} />
                                                            {alert.days_remaining} أيام
                                                        </span>

                                                        {/* Send Reminder Button - only show if not sent */}
                                                        {!alert.is_sent && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmDialog({ open: true, alert });
                                                                }}
                                                                disabled={sendingReminder === alert.report_id}
                                                                className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 hover:border-green-500/40 hover:bg-green-500 hover:text-white text-green-600 transition-all flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="إرسال تذكير"
                                                            >
                                                                {sendingReminder === alert.report_id ? (
                                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Send size={16} />
                                                                )}
                                                            </button>
                                                        )}

                                                        {alert.report_id && (
                                                            <button
                                                                onClick={() => router.push(`/dashboard/admin/reports/${alert.report_id}`)}
                                                                className="w-10 h-10 rounded-full bg-white border border-black/5 hover:border-primary/20 hover:bg-primary hover:text-white text-secondary/40 transition-all flex items-center justify-center shadow-sm"
                                                                title="عرض التقرير"
                                                            >
                                                                <ArrowRight size={20} className="rotate-180" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmDialog.open && confirmDialog.alert && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card variant="glass" className="max-w-md w-full bg-white/95 backdrop-blur-md border-black/10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                                    <Send size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">تأكيد إرسال التذكير</h3>
                                    <p className="text-sm text-secondary/60">هل تريد إرسال رسالة تذكير للعميل؟</p>
                                </div>
                            </div>

                            <div className="bg-surface-variant/30 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-secondary/60" />
                                    <span className="font-bold text-foreground">{confirmDialog.alert.client_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-secondary/60" />
                                    <span className="text-sm text-secondary">{confirmDialog.alert.client_phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ScanBarcode size={16} className="text-secondary/60" />
                                    <span className="text-sm text-secondary">{confirmDialog.alert.device_model}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmDialog({ open: false, alert: null })}
                                    className="flex-1"
                                    disabled={sendingReminder !== null}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleSendReminder(confirmDialog.alert)}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    disabled={sendingReminder !== null}
                                >
                                    {sendingReminder ? 'جاري الإرسال...' : 'إرسال التذكير'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
