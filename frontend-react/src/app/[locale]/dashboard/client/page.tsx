'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    FileText,
    Receipt,
    ExternalLink,
    ShieldCheck,
    Package,
    ArrowRight,
    Loader2,
    LogOut,
    User,
    Calendar,
    Sparkles,
    Zap,
    Thermometer,
    Monitor,
    Battery,
    Cpu,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Link } from '@/i18n/routing';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { use } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ClientDashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('dashboard.client');
    const { user, logout } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openTipIndex, setOpenTipIndex] = useState<number | null>(0);

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
    const activeWarranty = reports.some(r => r.status === 'completed');

    const handlePrint = (id: string) => {
        const token = localStorage.getItem('token');
        const printUrl = `/api/invoices/${id}/print?token=${token}`;
        window.open(printUrl, '_blank');
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-secondary font-medium animate-pulse">جاري تحميل بياناتك...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                {/* Client Custom Header */}
                <div className="flex items-center justify-center bg-white/50 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-black/5 mb-8 relative">
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

                {/* Reports List - Row Based */}
                <div className="space-y-6">
                    {/* <div className="flex items-center justify-between px-2 md:px-4">
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                            <Package size={28} className="text-primary" />
                            سجل التقارير والأجهزة
                        </h2>
                    </div> */}

                    {reports.length > 0 ? (
                        <div className="space-y-4">
                            {reports.map((report) => {
                                // Find associated invoice if any
                                const invoice = invoices.find(inv => inv.reportId === report.id || inv.report_id === report.id);

                                return (
                                    <div key={report.id} className="bg-white/60 backdrop-blur-sm border border-black/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                                            {/* Report Basic Info */}
                                            <div className="flex items-center gap-4 md:gap-12">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500 shrink-0">
                                                    <FileText className="w-6 h-6 md:w-8 md:h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-lg md:text-2xl font-black">{report.device_model}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-1">
                                                        {/* <div className="flex items-center gap-2 text-secondary/60 font-bold text-sm">
                                                            <span className="text-secondary/30">ID:</span> {report.id}
                                                        </div> */}
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
                                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                                <Link href={`/dashboard/client/warranty?id=${report.id}`} className="flex-1 sm:flex-initial">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full sm:w-auto rounded-2xl h-11 md:h-14 px-4 md:px-8 font-black border-primary/20 hover:bg-primary/5 gap-3"
                                                    >
                                                        <ShieldCheck size={20} className="text-primary" />
                                                        الضمان
                                                    </Button>
                                                </Link>

                                                <Link href={`/dashboard/client/reports/${report.id}`} className="flex-1 sm:flex-initial">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full sm:w-auto rounded-2xl h-11 md:h-14 px-4 md:px-8 font-black bg-surface-variant/50 hover:bg-surface-variant gap-3"
                                                    >
                                                        <FileText size={20} />
                                                        تقرير
                                                    </Button>
                                                </Link>

                                                {invoice ? (
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handlePrint(invoice.id)}
                                                        className="w-full sm:w-auto rounded-2xl h-11 md:h-14 px-4 md:px-8 font-black shadow-lg shadow-primary/20 gap-3"
                                                    >
                                                        <Receipt size={20} />
                                                        عرض الفاتورة
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        disabled
                                                        className="w-full sm:w-auto rounded-2xl h-11 md:h-14 px-4 md:px-8 font-black opacity-30 gap-3 border border-black/5"
                                                    >
                                                        <Receipt size={20} />
                                                        لا توجد فاتورة
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white/40 border border-dashed border-black/10 rounded-2xl md:rounded-[3rem] py-16 md:py-32 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center text-secondary/20">
                                <Package size={48} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold">لا توجد تقارير حالياً</h3>
                                <p className="text-secondary/60 font-medium">سوف تظهر تقارير الفحص الفني لأجهزتك هنا فور صدورها</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Device Care Section */}
                <div className="space-y-6 pt-8">
                    <div className="flex items-center justify-between px-2 md:px-4">
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-primary animate-pulse" />
                            حافظ علي جهازك !
                        </h2>
                    </div>

                    <div className="flex flex-col gap-4">
                        {[
                            {
                                title: 'مساحة التخزين',
                                icon: <Cpu />,
                                tip: 'خليك فاكر تسيب مساحة فاضية على الهارد، بلاش تملاه للآخر لأن المساحة الفاضية بتفرق في سرعة الجهاز وأداؤه.',
                                color: '#3B82F6' // blue-500
                            },
                            {
                                title: 'صحة البطارية',
                                icon: <Battery />,
                                tip: 'افتكر إن البطارية ليها عمر، بلاش تسيب اللابتوب على الشاحن 24 ساعة وحاول تشحنه من 20٪ لـ 80٪ على قد ما تقدر.',
                                color: '#F59E0B' // amber-500
                            },
                            {
                                title: 'تهوية الجهاز',
                                icon: <Thermometer />,
                                tip: 'خلي بالك من التهوية، ما تحطش اللابتوب على سرير أو مخدة وخليه دايمًا على سطح ناشف علشان ميسخنش.',
                                color: '#10B981' // green-500
                            },
                            {
                                title: 'نظافة الجهاز',
                                icon: <Sparkles />,
                                tip: 'خليك فاكر تنظف اللابتوب كل أسبوع بفوطة ناعمة أو منديل، ومترشش أي سوايل مباشرة على الكيبورد أو الشاشة نهائيًا.',
                                color: '#A855F7' // purple-500
                            }
                        ].map((item, i) => {
                            const isOpen = openTipIndex === i;
                            return (
                                <div
                                    key={i}
                                    className="relative group rounded-[3.2rem] p-1 transition-all duration-300 bg-white/40 hover:bg-white/60"
                                >
                                    <div className={cn(
                                        "flex flex-col overflow-hidden rounded-[3rem] bg-white/60 backdrop-blur-sm border transition-all duration-500",
                                        isOpen ? "border-primary/30 shadow-xl shadow-primary/5" : "border-black/5"
                                    )}>
                                        {/* Header / Trigger */}
                                        <button
                                            onClick={() => setOpenTipIndex(isOpen ? null : i)}
                                            className="flex items-center justify-between p-6 md:p-8 w-full text-right group/btn"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div
                                                    className="w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover/btn:scale-110 duration-500"
                                                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                                                >
                                                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 24 })}
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <h3 className="text-lg md:text-xl font-black text-secondary">{item.title}</h3>
                                                    <p className="text-[10px] text-secondary/30 font-black uppercase tracking-widest">Device Care Advice</p>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "w-10 h-10 rounded-full bg-black/[0.03] flex items-center justify-center text-secondary/20 transition-all duration-500",
                                                isOpen ? "rotate-180 bg-primary/10 text-primary" : "group-hover/btn:text-secondary/40"
                                            )}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </button>

                                        {/* Content */}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                                >
                                                    <div className="px-8 pb-8 pt-2">
                                                        <div className="p-6 rounded-[2rem] bg-black/[0.02] border border-black/[0.03] relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                                            <p className="text-secondary/70 text-base md:text-lg font-bold leading-relaxed italic relative z-10">
                                                                "{item.tip}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
