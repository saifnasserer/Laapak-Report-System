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
                                const invoice = invoices.find(inv => inv.reportId === report.id || inv.report_id === report.id);

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
                                                        className="w-full rounded-2xl h-11 md:h-14 px-4 md:px-6 font-bold bg-black/5 text-secondary hover:bg-black/10 border border-black/5 gap-2"
                                                    >
                                                        <ExternalLink size={18} />
                                                        عرض كعميل
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

                {/* Device Care Section Reminder */}
                <div className="bg-black/[0.02] border border-black/5 p-8 rounded-[3rem] text-center">
                    <Sparkles className="mx-auto mb-4 text-primary/40" size={40} />
                    <p className="text-secondary/60 font-medium">سيشاهد العميل نصائح العناية بالجهاز في هذا الجزء من لوحة تحكمه</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
