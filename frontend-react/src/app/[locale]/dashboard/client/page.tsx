'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import {
    FileText,
    Receipt,
    Package,
    LogOut,
    Calendar,
    Scan,
    Settings,
    ShieldCheck,
    AlertCircle,
    RefreshCw,
    CheckCircle2,
    ArrowLeft,
    MessageCircle,
} from 'lucide-react';

import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Link } from '@/i18n/routing';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { use } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'قيد الانتظار', className: 'bg-amber-500/10 text-amber-600 border-amber-200/30' },
    processing: { label: 'قيد الفحص', className: 'bg-blue-500/10 text-blue-600 border-blue-200/30' },
    shipped: { label: 'تم الشحن', className: 'bg-blue-500/10 text-blue-600 border-blue-200/30' },
    completed: { label: 'مكتمل', className: 'bg-green-500/10 text-green-600 border-green-200/30' },
    مكتمل: { label: 'مكتمل', className: 'bg-green-500/10 text-green-600 border-green-200/30' },
    'تم الشحن': { label: 'تم الشحن', className: 'bg-blue-500/10 text-blue-600 border-blue-200/30' },
};

function SkeletonCard() {
    return (
        <div className="bg-white/60 border border-black/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] animate-pulse">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-12">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-black/[0.03]" />
                    <div className="space-y-3">
                        <div className="h-5 md:h-7 w-44 bg-black/[0.03] rounded-lg" />
                        <div className="h-4 w-28 bg-black/[0.02] rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="h-11 md:h-14 w-28 rounded-2xl bg-black/[0.03]" />
                    <div className="h-11 md:h-14 w-28 rounded-2xl bg-black/[0.03]" />
                </div>
            </div>
        </div>
    );
}

export default function ClientDashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('dashboard.client');
    const { user, logout } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const [reportsRes, invoicesRes] = await Promise.all([
                    api.get('/reports/client/me'),
                    api.get('/invoices/client')
                ]);

                setReports(reportsRes.data.data || []);
                setInvoices(invoicesRes.data || []);
            } catch (err) {
                console.error('Error fetching client dashboard data:', err);
                setError('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const dueInvoices = invoices.filter(inv => inv.paymentStatus !== 'completed' && inv.paymentStatus !== 'paid');

    const totalWarrantyDays = 180 + 14 + 180 + 180;
    const warrantySummaries = reports
        .filter(r => r.status === 'completed' || r.status === 'مكتمل')
        .map(r => {
            const start = new Date(r.inspection_date);
            const end = addDays(start, totalWarrantyDays);
            const remaining = Math.max(0, differenceInDays(end, new Date()));
            return { report: r, remaining, isActive: remaining > 0, endDate: end };
        });
    const activeWarranties = warrantySummaries.filter(w => w.isActive);
    const activeWarrantyCount = activeWarranties.length;
    const minWarrantyDays = activeWarranties.length > 0 ? Math.min(...activeWarranties.map(w => w.remaining)) : 0;

    const totalDueAmount = dueInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || inv.amount || 0), 0);

    const maintenanceReminders = reports
        .filter(r => r.status === 'completed' || r.status === 'مكتمل')
        .map(r => {
            const start = new Date(r.inspection_date);
            const now = new Date();
            const maint1End = addDays(start, 180);
            const maint2Start = maint1End;
            const maint2End = addDays(start, 360);
            let phase, remaining, endDate;
            if (now < maint1End) {
                phase = 'الدورية الأولى';
                remaining = differenceInDays(maint1End, now);
                endDate = maint1End;
            } else if (now < maint2End) {
                phase = 'الدورية الثانية';
                remaining = differenceInDays(maint2End, now);
                endDate = maint2End;
            } else {
                return null;
            }
            return { report: r, phase, remaining: Math.max(0, remaining), endDate };
        })
        .filter(Boolean);

    const handlePrint = (id: string) => {
        const token = localStorage.getItem('token');
        const printUrl = `/api/invoices/${id}/print?token=${token}`;
        window.open(printUrl, '_blank');
    };

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-secondary">تعذّر تحميل البيانات</h3>
                        <p className="text-sm text-secondary/50 font-medium">تحقق من اتصالك بالإنترنت وحاول مجدداً</p>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        className="rounded-full h-11 px-6 font-black gap-2"
                    >
                        <RefreshCw size={16} />
                        إعادة المحاولة
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-8 pb-12">
                    <div className="flex items-center justify-center bg-white/50 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-black/5 relative">
                        <Image src="/logo.png" alt="Laapak" width={140} height={40} className="h-8 md:h-10 w-auto object-contain" priority />
                        <div className="absolute left-4 md:left-6">
                            <div className="w-10 h-10 rounded-xl bg-black/[0.03] animate-pulse" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex-1 h-20 rounded-2xl bg-white/40 animate-pulse" />
                        ))}
                    </div>
                    <div className="space-y-4">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                {/* Header */}
                <div className="flex items-center justify-center bg-white/50 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-black/5 relative">
                    <div className="absolute right-4 md:right-6 hidden md:flex items-center gap-4 md:gap-6">
                        <div className="hidden lg:block">
                            <h1 className="text-xl font-bold tracking-tight text-right">اهلاً بيك، {user?.username}</h1>
                            <p className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-30 text-right">لوحة التحكم</p>
                        </div>
                    </div>

                    <Image src="/logo.png" alt="Laapak" width={140} height={40} className="h-8 md:h-10 w-auto object-contain" priority />

                    <div className="absolute left-4 md:left-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-destructive hover:bg-destructive/5 rounded-xl font-bold px-3 md:px-4 h-10 md:h-11 flex items-center gap-2 group transition-all active:scale-95"
                        >
                            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                            <span className="hidden sm:inline">تسجيل الخروج</span>
                        </Button>
                    </div>
                </div>

                {/* Stats Banner — only show when there's data */}
                {reports.length > 0 && <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {[
                        {
                            delay: 0,
                            icon: <FileText size={16} />,
                            iconBg: 'bg-primary/5 text-primary',
                            value: reports.length,
                            label: 'تقارير',
                        },
                        {
                            delay: 0.08,
                            icon: <ShieldCheck size={16} />,
                            iconBg: 'bg-green-500/10 text-green-600',
                            value: activeWarrantyCount > 0 ? minWarrantyDays : 0,
                            label: activeWarrantyCount > 0 ? 'يوم ضمان' : 'منتهي',
                        },
                        {
                            delay: 0.16,
                            icon: <Receipt size={16} />,
                            iconBg: 'bg-amber-500/5 text-amber-500',
                            value: dueInvoices.length,
                            label: 'فواتير',
                        },
                    ].map((kbi, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: kbi.delay }}
                            className="flex flex-col items-center gap-1.5 px-2 py-3 md:flex-row md:items-center md:gap-3 md:px-5 rounded-2xl bg-white/60 border border-black/5 text-center md:text-right"
                        >
                            <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 mx-auto md:mx-0", kbi.iconBg)}>
                                {kbi.icon}
                            </div>
                            <div>
                                <p className="text-lg md:text-2xl font-black tabular-nums leading-none">{kbi.value}</p>
                                <p className="text-[9px] md:text-[10px] font-bold text-secondary/40 mt-0.5">{kbi.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>}

                {/* Invoice Alert */}
                {dueInvoices.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-50/80 border border-amber-200/40"
                    >
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <Receipt size={16} />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-sm font-bold text-amber-800">
                                عندك {dueInvoices.length} {dueInvoices.length === 1 ? 'فاتورة' : 'فواتير'} مستحقة
                            </p>
                            <p className="text-[11px] text-amber-600/70 font-medium">إجمالي المستحق: {totalDueAmount.toLocaleString()} ج.م</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const inv = dueInvoices[0];
                                if (inv) handlePrint(inv.id);
                            }}
                            className="rounded-xl h-9 px-4 bg-amber-100/50 text-amber-700 hover:bg-amber-200/50 font-bold text-xs"
                        >
                            عرض
                        </Button>
                    </motion.div>
                )}

                {/* Reports List */}
                <div className="space-y-6">
                    {reports.length > 0 ? (
                        <div className="space-y-4">
                            {reports.map((report, idx) => {
                                const invoice = invoices.find(inv =>
                                    inv.id === report.invoice_id ||
                                    inv.reportId === report.id ||
                                    inv.report_id === report.id ||
                                    (inv.relatedReports && inv.relatedReports.some((r: any) => r.id === report.id))
                                );

                                const status = statusConfig[report.status] || statusConfig[report.status?.toLowerCase()];

                                return (
                                    <motion.div
                                        key={report.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white/60 backdrop-blur-sm border border-black/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
                                            {/* Report Info */}
                                            <div className="flex items-center gap-4 md:gap-12">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500 shrink-0">
                                                    <FileText className="w-6 h-6 md:w-8 md:h-8" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <h3 className="text-lg md:text-2xl font-black">{report.device_model}</h3>
                                                        {status && (
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-black border",
                                                                status.className
                                                            )}>
                                                                {status.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-1">
                                                        <div className="flex items-center gap-2 text-secondary/60 font-bold text-sm">
                                                            <Calendar size={16} />
                                                            {report.inspection_date ? format(new Date(report.inspection_date), 'dd MMMM yyyy', { locale: ar }) : 'غير محدد'}
                                                        </div>
                                                        {report.serial_number && (
                                                            <div className="flex items-center gap-2 text-secondary/60 font-bold text-sm">
                                                                <span className="text-secondary/30 font-black">S/N:</span> {report.serial_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                                <Link href={`/dashboard/client/reports/${report.id}`} className="flex-1 sm:flex-initial">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full sm:w-auto rounded-full h-11 md:h-12 px-5 md:px-6 font-black bg-primary text-white hover:bg-primary/90 shadow-sm gap-2 text-sm"
                                                    >
                                                        <FileText size={16} />
                                                        التقرير
                                                    </Button>
                                                </Link>

                                                <Link href={`/dashboard/client/warranty?id=${report.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-black/10 hover:bg-primary/5 text-secondary/50 hover:text-primary transition-all"
                                                    >
                                                        <ShieldCheck size={16} />
                                                    </Button>
                                                </Link>

                                                {invoice ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handlePrint(invoice.id)}
                                                        className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-black/10 hover:bg-amber-500/5 text-secondary/50 hover:text-amber-600 transition-all"
                                                    >
                                                        <Receipt size={16} />
                                                    </Button>
                                                ) : (
                                                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-black/5 flex items-center justify-center text-secondary/30">
                                                        <Receipt size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4" dir="rtl">
                            {/* Welcome hero */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-primary/10 to-primary/5 border border-primary/10 p-6 md:p-10 text-right">
                                <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">مرحباً بك في لابك</p>
                                <h2 className="text-2xl md:text-3xl font-black text-secondary mb-2">
                                    أهلاً، {user?.username} 👋
                                </h2>
                                <p className="text-sm text-secondary/60 font-medium max-w-sm leading-relaxed">
                                    لسه مفيش تقارير لجهازك. بمجرد ما بنفحص جهازك هيظهر تقريره هنا مع كل التفاصيل.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                    <a href="https://wa.me/201013148007" target="_blank" rel="noreferrer">
                                        <Button className="rounded-full h-12 px-6 font-black gap-2 shadow-sm w-full sm:w-auto">
                                            <MessageCircle size={16} />
                                            تواصل معنا على واتساب
                                        </Button>
                                    </a>
                                    <Link href="/reports/scan">
                                        <Button variant="outline" className="rounded-full h-12 px-6 font-black gap-2 w-full sm:w-auto">
                                            <Scan size={16} />
                                            مسح QR الجهاز
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* How it works */}
                            <div className="bg-white/60 border border-black/5 rounded-3xl p-6 md:p-8">
                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] mb-5">إزاي بتشتغل لابك</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { step: '01', icon: <Package size={20} />, title: 'بتجيب جهازك', desc: 'بتبعتلنا جهازك أو بتيجي بنفسك لنقطة الاستلام' },
                                        { step: '02', icon: <ShieldCheck size={20} />, title: 'بنعمل فحص شامل', desc: 'فحص كامل للهاردوير والسوفتوير وكل مكونات الجهاز' },
                                        { step: '03', icon: <FileText size={20} />, title: 'بتاخد تقريرك', desc: 'تقرير فني مفصل مع ضمان وخطة صيانة مجانية' },
                                    ].map((item) => (
                                        <div key={item.step} className="flex gap-4 items-start p-4 rounded-2xl bg-surface-variant/5 border border-black/[0.03]">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-0.5">{item.step}</p>
                                                <p className="text-sm font-black text-secondary">{item.title}</p>
                                                <p className="text-[11px] text-secondary/50 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Value props */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { icon: <ShieldCheck size={18} />, label: 'ضمان سنة كاملة', color: 'text-green-600 bg-green-500/10' },
                                    { icon: <CheckCircle2 size={18} />, label: 'تقرير فني مفصل', color: 'text-primary bg-primary/5' },
                                    { icon: <Calendar size={18} />, label: 'صيانة دورية مجانية', color: 'text-blue-600 bg-blue-500/10' },
                                    { icon: <ArrowLeft size={18} />, label: 'متابعة لحظية للطلب', color: 'text-amber-600 bg-amber-500/10' },
                                ].map((prop, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/60 border border-black/5 text-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${prop.color}`}>
                                            {prop.icon}
                                        </div>
                                        <p className="text-xs font-bold text-secondary leading-snug">{prop.label}</p>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}
                </div>

                {/* Maintenance Reminders */}
                {maintenanceReminders.length > 0 && (
                    <div className="space-y-5 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                                <Calendar className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                                مواعيد الصيانة
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {maintenanceReminders.map((reminder: any, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-white/60 border border-black/5 hover:border-primary/10 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                            <Settings size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm md:text-base font-black">{reminder.report.device_model}</p>
                                            <p className="text-[11px] text-secondary/50 font-bold">
                                                {reminder.phase} · {reminder.remaining} يوم متبقي
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-secondary/30">تنتهي</p>
                                        <p className="text-xs font-bold text-secondary">
                                            {format(reminder.endDate, 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Google Review */}
                <div className="bg-white/60 border border-black/5 rounded-3xl p-6 text-center space-y-4" dir="rtl">
                    <div className="flex justify-center gap-1">
                        {[1,2,3,4,5].map(s => (
                            <svg key={s} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#FBBF24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        ))}
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-black text-secondary">رأيك يفرق معانا</p>
                        <p className="text-xs text-secondary/50 font-medium leading-relaxed max-w-xs mx-auto">
                            لو تجربتك مع لابك كانت كويسة، ياريت تشاركها مع الناس على جوجل — بيساعدنا كتير!
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                        <a
                            href="https://g.page/r/CeaVhntazvwDEBM/review"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button className="rounded-full h-10 px-5 font-black text-xs gap-2 shadow-sm w-full sm:w-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                اكتب تقييمك
                            </Button>
                        </a>
                        <a
                            href="https://g.page/r/CeaVhntazvwDEBM"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" className="rounded-full h-10 px-5 font-black text-xs gap-2 w-full sm:w-auto">
                                شوف آراء العملاء
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Social Media Links */}
                <div className="bg-white/60 border border-black/5 rounded-3xl p-6 text-center">
                    <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] mb-5">تابعنا على منصات التواصل الاجتماعي</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { name: 'Facebook', url: 'https://www.facebook.com/LaapakOfficial/', color: '#1877F2', icon: <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /> },
                            { name: 'Instagram', url: 'https://www.instagram.com/laapak.eg', color: '#E1306C', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /> },
                            { name: 'TikTok', url: 'https://www.tiktok.com/@laapak', color: '#000000', icon: <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /> },
                            { name: 'YouTube', url: 'https://www.youtube.com/@laapak', color: '#FF0000', icon: <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /> },
                        ].map((social) => (
                            <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 rounded-full bg-surface-variant/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm border border-black/5"
                                style={{ color: social.color }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">{social.icon}</svg>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
