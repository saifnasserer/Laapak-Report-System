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
    ChevronUp,
    ArrowLeft,
    Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Link, useRouter } from '@/i18n/routing';
import api from '@/lib/api';
import { use } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ClientViewAsAdmin({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id: clientId } = use(params);
    const [client, setClient] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openTipIndex, setOpenTipIndex] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const [clientRes, reportsRes, invoicesRes] = await Promise.all([
                    api.get(`/clients/${clientId}`),
                    api.get(`/reports?client_id=${clientId}&fetch_mode=all_reports`),
                    api.get(`/invoices?client_id=${clientId}`)
                ]);

                setClient(clientRes.data.client);
                // The reports endpoint returns results directly or in a reports property
                setReports(Array.isArray(reportsRes.data) ? reportsRes.data : reportsRes.data.reports || []);
                setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data.invoices || []);
            } catch (err) {
                console.error('Error fetching client dashboard data:', err);
                setError('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [clientId]);

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
                    <p className="text-secondary font-medium animate-pulse">جاري تحميل بيانات العميل...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!client) {
        return (
            <DashboardLayout>
                <div className="p-12 text-center">
                    <h2 className="text-2xl font-bold text-destructive">العميل غير موجود</h2>
                    <Button onClick={() => router.back()} className="mt-4">العودة</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                {/* Admin View Banner */}
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-primary uppercase tracking-widest">عرض لوحة تحكم العميل</p>
                            <h2 className="font-bold text-lg">{client.name}</h2>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-primary/10 text-primary font-bold"
                    >
                        <ArrowLeft size={18} className="ml-2" />
                        العودة لقائمة العملاء
                    </Button>
                </div>

                {/* Client Custom Header - Simplified for Admin View */}
                <div className="flex items-center justify-center bg-white/50 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-black/5 mb-8 relative">
                    <Image src="/logo.png" alt="Laapak" width={140} height={40} className="h-8 md:h-10 w-auto object-contain" priority />
                </div>

                {/* Reports List - Row Based */}
                <div className="space-y-6">
                    {reports.length > 0 ? (
                        <div className="space-y-4">
                            {reports.map((report) => {
                                const invoice = invoices.find(inv =>
                                    inv.id === report.invoice_id ||
                                    inv.reportId === report.id ||
                                    inv.report_id === report.id ||
                                    (inv.relatedReports && inv.relatedReports.some((r: any) => r.id === report.id))
                                );

                                return (
                                    <div key={report.id} className="bg-white/60 backdrop-blur-sm border border-black/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                                            <div className="flex items-center gap-4 md:gap-12">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500 shrink-0">
                                                    <FileText className="w-6 h-6 md:w-8 md:h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-lg md:text-2xl font-black">{report.device_model}</h3>
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
                                                        <Badge variant={report.status === 'completed' || report.status === 'مكتمل' ? 'primary' : 'outline'}>
                                                            {report.status || 'معلق'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                                                <Link href={`/dashboard/admin/reports/${report.id}/edit`} className="col-span-1 sm:flex-initial">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full rounded-2xl h-11 md:h-14 px-4 md:px-6 font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10 gap-2"
                                                    >
                                                        <Edit size={18} />
                                                        تعديل
                                                    </Button>
                                                </Link>

                                                <Link href={`/dashboard/client/reports/${report.id}`} target="_blank" className="col-span-1 sm:flex-initial">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full rounded-2xl h-11 md:h-14 px-4 md:px-6 font-black bg-black/5 text-secondary hover:bg-primary/10 hover:text-primary border border-black/5 hover:border-primary/20 gap-3"
                                                    >
                                                        <FileText size={20} />
                                                        تقرير الفحص
                                                    </Button>
                                                </Link>

                                                <Link href={`/dashboard/client/warranty?id=${report.id}&client_id=${clientId}`} target="_blank" className="col-span-1 sm:flex-initial">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full rounded-2xl h-11 md:h-14 px-4 md:px-6 font-bold border-primary/20 hover:bg-primary/5 gap-2"
                                                    >
                                                        <ShieldCheck size={18} className="text-primary" />
                                                        الضمان
                                                    </Button>
                                                </Link>

                                                <div className="col-span-1 sm:flex-initial order-3">
                                                    {invoice ? (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handlePrint(invoice.id)}
                                                            className="w-full sm:w-auto rounded-2xl h-11 md:h-14 px-2 md:px-6 font-bold text-sm md:text-base border border-black/5 hover:bg-black/5 gap-2 opacity-70 hover:opacity-100"
                                                        >
                                                            <Receipt size={18} />
                                                            الفاتورة
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            disabled
                                                            className="w-full sm:w-auto rounded-2xl h-11 md:h-14 px-2 md:px-6 font-bold text-sm md:text-base opacity-30 gap-2 border border-black/5"
                                                        >
                                                            <Receipt size={18} />
                                                            لا توجد
                                                        </Button>
                                                    )}
                                                </div>
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
                                <p className="text-secondary/60 font-medium">هذا العميل ليس لديه أي تقارير فحص فني مسجلة</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Device Care Section */}
                <div className="space-y-6 pt-8">
                    <div className="flex items-center justify-between px-2 md:px-4">
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-primary animate-pulse" />
                            كيف يرى العميل نصائح الحماية؟
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
                                                    <p className="text-[10px] text-secondary/30 font-black uppercase tracking-widest">نصائح العناية بالجهاز</p>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "w-10 h-10 rounded-full bg-black/[0.03] flex items-center justify-center text-secondary/20 transition-all duration-500",
                                                isOpen ? "rotate-180 bg-primary/10 text-primary" : "group-hover/btn:text-secondary/40"
                                            )}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </button>

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
                                                            <p className="text-secondary/70 text-base md:text-lg font-bold leading-relaxed italic relative z-10 text-right">
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
