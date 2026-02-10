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
    ShoppingCart,
    Send,
    CheckCircle,
    Trash2,
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
    const [newOrders, setNewOrders] = useState<any[]>([]);
    const [isReportsLoading, setIsReportsLoading] = useState(true);

    const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        try {
            await api.delete(`/reports/${reportId}`);
            setNewOrders(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            console.error('Failed to delete report:', err);
            alert('فشل في حذف التقرير');
        }
    };

    const [isWarrantyAlertsOpen, setIsWarrantyAlertsOpen] = useState(false);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; alert: any | null; message: string }>({
        open: false,
        alert: null,
        message: ''
    });

    const fetchDashboardData = async () => {
        setStats(prev => ({ ...prev, isLoading: true }));
        setIsReportsLoading(true);
        try {
            // Fetch Warranty Alerts and Recent Reports
            const [warrantyRes, allPendingRes, newOrdersRes] = await Promise.all([
                api.get('/reports/insights/warranty-alerts').catch(() => ({ data: [] })),
                api.get('/reports?status=pending&limit=50&exclude_inventory=true'),
                api.get('/reports?status=new_order&limit=20')
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

            setNewOrders(Array.isArray(newOrdersRes.data) ? newOrdersRes.data : []);

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

    const handleSendReminder = async (alert: any, message: string) => {
        try {
            setSendingReminder(alert.report_id);

            await api.post(`/reports/${alert.report_id}/send-warranty-reminder`, {
                warranty_type: alert.warranty_type,
                message: message
            });

            // Refresh dashboard data to update the UI
            await fetchDashboardData();

            setConfirmDialog({ open: false, alert: null, message: '' });
        } catch (error: any) {
            console.error('Failed to send reminder:', error);
            const errorMsg = error.response?.data?.message || error.message;
            const errorDetails = error.response?.data?.details?.message || '';
            alert(`فشل إرسال التذكير: ${errorMsg}${errorDetails ? '\n\nالتفاصيل: ' + errorDetails : ''}`);
        } finally {
            setSendingReminder(null);
        }
    };

    const handleSendReminderClick = (alert: any) => {
        const inspectionDate = new Date(alert.inspection_date);
        let warrantyEndDate = new Date(inspectionDate);
        let wTypeArabic = '';

        if (alert.warranty_type === 'maintenance_6months') {
            warrantyEndDate.setMonth(warrantyEndDate.getMonth() + 6);
            wTypeArabic = 'صيانة كل 6 أشهر';
        } else {
            warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);
            wTypeArabic = 'صيانة سنوية';
        }

        const dateString = warrantyEndDate.toISOString().split('T')[0];

        const defaultMessage = `🛠️ *تذكير بالصيانة الدورية*\n\n` +
            `أهلاً ${alert.client_name || 'عميلنا العزيز'}،\n\n` +
            `نود تذكيركم بموعد *${wTypeArabic}* لجهازكم (*${alert.device_model}*) في تاريخ *${dateString}*.\n\n` +
            `الصيانة الدورية تضمن بقاء جهازك في حالة ممتازة وتطيل عمره الافتراضي. يرجى التواصل معنا لترتيب الموعد.\n\n` +
            `_مع تحيات فريق عمل لابك_`;

        setConfirmDialog({
            open: true,
            alert,
            message: defaultMessage
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: any = {
            'completed': { label: 'مكتمل', variant: 'success' },
            'pending': { label: 'انتظار', variant: 'warning' },
            'new_order': { label: 'طلب خارجي', variant: 'primary' },
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
            <div className="space-y-8 pb-12 pt-4">
                {/* Content starts below global header */}

                {/* New External Orders - High Priority Section */}
                {newOrders.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <ShoppingCart size={28} className="text-primary" />
                                </div>
                                طلبات خارجية جديدة
                            </h2>
                            <Badge variant="primary" circular className="h-8 px-4 text-sm shadow-sm animate-pulse">
                                {newOrders.length} طلبات بحاجة للتنسيق
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {newOrders.map((order) => (
                                <Card
                                    key={order.id}
                                    variant="glass"
                                    className="border-primary/20 bg-primary/[0.02] hover:bg-primary/[0.05] transition-all duration-300 group cursor-pointer rounded-3xl p-4 md:p-6 border-2"
                                    onClick={() => router.push(`/dashboard/admin/reports/${order.id}/edit`)}
                                >
                                    <div className="flex items-center gap-3 md:gap-6">
                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                            <ShoppingCart size={20} className="md:w-6 md:h-6" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-0.5 md:mb-1">
                                                <span className="font-black text-base md:text-lg text-foreground truncate">{order.client_name}</span>
                                                <Badge variant="primary" className="text-[10px] h-5 px-2">طلب جديد</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-sm font-medium text-secondary/60">
                                                <div className="flex items-center gap-1 md:gap-1.5 truncate">
                                                    <FileText size={12} className="text-primary" />
                                                    <span className="truncate">{order.device_model}</span>
                                                </div>
                                                <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
                                                    <Clock size={12} className="text-primary" />
                                                    <span>{new Date(order.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                            <Button
                                                variant="destructive"
                                                className="hidden md:flex rounded-2xl font-bold text-xs h-10 shadow-lg shadow-destructive/20 px-6"
                                                onClick={(e) => handleDeleteReport(order.id, e)}
                                            >
                                                حذف الطلب
                                            </Button>
                                            <div
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-all duration-300 pointer-events-auto"
                                                onClick={(e) => handleDeleteReport(order.id, e)}
                                            >
                                                <X size={16} className="md:w-5 md:h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}


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
                                    className="border-black/5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer rounded-3xl bg-white/60 backdrop-blur-sm p-4 md:p-6"
                                    onClick={() => router.push(`/dashboard/admin/reports/${report.id}`)}
                                >
                                    <div className="flex items-center gap-3 md:gap-6">
                                        {/* Icon - Smaller on mobile */}
                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shrink-0">
                                            <FileText size={20} className="md:w-6 md:h-6" />
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-0.5 md:mb-1">
                                                <span className="font-black text-base md:text-lg text-foreground truncate">{report.client_name}</span>
                                                <span className="text-[10px] md:text-sm font-bold text-secondary/40 shrink-0">#{report.order_number}</span>
                                            </div>
                                            <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-sm font-medium text-secondary/60">
                                                <div className="flex items-center gap-1 md:gap-1.5 truncate">
                                                    <Users size={12} className="md:w-3.5 md:h-3.5" />
                                                    <span className="truncate">{report.device_model}</span>
                                                </div>
                                                <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
                                                    <Calendar size={12} className="md:w-3.5 md:h-3.5" />
                                                    {new Date(report.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions & Status - Integrated */}
                                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                            <div className="hidden sm:block">
                                                {getStatusBadge(report.status)}
                                            </div>
                                            <div className="sm:hidden scale-75 origin-left">
                                                {getStatusBadge(report.status)}
                                            </div>
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center text-secondary/40 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                                                <ArrowRight size={16} className="md:w-5 md:h-5 rotate-180" />
                                            </div>
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

                                        let colorClass = alert.is_sent ? 'bg-green-500/10 border-green-500/20 hover:border-green-500/30' :
                                            isCritical ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/30' :
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
                                                                    handleSendReminderClick(alert);
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

                            <div className="bg-surface-variant/30 rounded-xl p-4 space-y-3">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-secondary/60" />
                                            <span className="font-bold text-foreground">{confirmDialog.alert?.client_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-secondary/60" />
                                            <span className="text-sm text-secondary font-medium">{confirmDialog.alert?.client_phone}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-black/5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-secondary/40 mb-2 block">
                                            نص الرسالة
                                        </label>
                                        <textarea
                                            className="w-full bg-white/50 border border-black/5 rounded-xl p-3 text-sm text-secondary leading-relaxed min-h-[150px] focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/30 transition-all resize-none"
                                            value={confirmDialog.message}
                                            onChange={(e) => setConfirmDialog(prev => ({ ...prev, message: e.target.value }))}
                                            dir="rtl"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmDialog({ open: false, alert: null, message: '' })}
                                    className="flex-1 rounded-2xl h-12 font-bold"
                                    disabled={sendingReminder !== null}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleSendReminder(confirmDialog.alert, confirmDialog.message)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 rounded-2xl h-12 font-bold text-white shadow-lg shadow-green-500/20 border-none"
                                    disabled={sendingReminder !== null}
                                >
                                    {sendingReminder ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>جاري الإرسال...</span>
                                        </div>
                                    ) : (
                                        'إرسال التذكير'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
