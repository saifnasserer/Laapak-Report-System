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
    Cpu
} from 'lucide-react';
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
                    <div className="flex items-center justify-between px-2 md:px-4">
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                            <Package size={28} className="text-primary" />
                            سجل التقارير والأجهزة
                        </h2>
                    </div>

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
                                                        حالة الضمان
                                                    </Button>
                                                </Link>

                                                <Link href={`/dashboard/client/reports/${report.id}`} className="flex-1 sm:flex-initial">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full sm:w-auto rounded-2xl h-11 md:h-14 px-4 md:px-8 font-black bg-surface-variant/50 hover:bg-surface-variant gap-3"
                                                    >
                                                        <FileText size={20} />
                                                        تقرير الفحص
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {[
                            {
                                title: 'مساحة التخزين',
                                // value: 'مثالية',
                                icon: <Cpu />,
                                tip: 'خليك فاكر تسيب مساحة فاضية على الهارد، بلاش تملاه للآخر لأن المساحة الفاضية بتفرق في سرعة الجهاز وأداؤه.',
                                color: 'blue'
                            },
                            {
                                title: 'صحة البطارية',
                                // value: 'ممتازة',
                                icon: <Battery />,
                                tip: 'افتكر إن البطارية ليها عمر، بلاش تسيب اللابتوب على الشاحن 24 ساعة وحاول تشحنه من 20٪ لـ 80٪ على قد ما تقدر.',
                                color: 'amber'
                            },
                            {
                                title: 'تهوية الجهاز',
                                // value: 'جيدة',
                                icon: <Thermometer />,
                                tip: 'خلي بالك من التهوية، ما تحطش اللابتوب على سرير أو مخدة وخليه دايمًا على سطح ناشف علشان ميسخنش.',
                                color: 'green'
                            },
                            {
                                title: 'نظافة الجهاز',
                                // value: 'مستمرة',
                                icon: <Sparkles />,
                                tip: 'خليك فاكر تنظف اللابتوب كل أسبوع بفوطة ناعمة أو منديل، ومترشش أي سوايل مباشرة على الكيبورد أو الشاشة نهائيًا.',
                                color: 'purple'
                            }
                        ].map((item, i) => (
                            <Card key={i} className="overflow-hidden border border-black/[0.03] shadow-none bg-white/30 backdrop-blur-sm rounded-2xl md:rounded-[2rem] transition-all">
                                <CardContent className="p-5 md:p-8">
                                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                                        {/* Icon & Status */}
                                        <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-4 shrink-0 w-full md:w-40 border-b md:border-b-0 md:border-l border-black/[0.03] pb-6 md:pb-0 md:pl-8">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                item.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
                                                    item.color === 'amber' ? "bg-amber-500/10 text-amber-600" :
                                                        item.color === 'green' ? "bg-green-500/10 text-green-600" : "bg-purple-500/10 text-purple-600"
                                            )}>
                                                {item.icon}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base md:text-lg font-black text-secondary leading-none">{item.title}</h3>
                                                {/* <Badge variant="outline" className={cn(
                                                    "rounded-full px-2 py-0 border-none text-[8px] font-black uppercase tracking-tighter",
                                                    item.color === 'blue' ? "bg-blue-500/10 text-blue-700" :
                                                        item.color === 'amber' ? "bg-amber-500/10 text-amber-700" :
                                                            item.color === 'green' ? "bg-green-500/10 text-green-700" : "bg-purple-500/10 text-purple-700"
                                                )}>
                                                    {item.value}
                                                </Badge> */}
                                            </div>
                                        </div>

                                        {/* Tip Content */}
                                        <div className="space-y-4 flex-1">
                                            {/* <div className="flex items-center gap-2 text-primary/30 font-black text-[9px] uppercase tracking-[0.2em]">
                                                <Zap size={12} strokeWidth={3} className="text-primary/40" />
                                                نصيحة ذكية
                                            </div> */}
                                            <p className="text-sm md:text-base font-bold text-secondary/70 leading-relaxed italic">
                                                "{item.tip}"
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
