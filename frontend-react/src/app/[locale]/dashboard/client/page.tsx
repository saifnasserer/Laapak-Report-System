'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    Calendar
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
                <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-black/5 shadow-sm mb-8">
                    <div className="flex items-center gap-6">
                        <Image src="/logo.png" alt="Laapak" width={140} height={40} className="h-8 w-auto object-contain" priority />
                        <div className="h-8 w-[1px] bg-black/10 hidden md:block" />
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold tracking-tight">مرحباً بك، {user?.username}</h1>
                            <p className="text-xs text-secondary font-medium">سعداء برؤيتك مرة أخرى</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-destructive hover:bg-destructive/5 rounded-xl font-bold px-4 h-11 flex items-center gap-2"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">تسجيل الخروج</span>
                        </Button>
                    </div>
                </div>

                {/* Reports List - Row Based */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-black flex items-center gap-3">
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
                                    <div key={report.id} className="bg-white/60 backdrop-blur-sm border border-black/5 p-6 md:p-8 rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                            {/* Report Basic Info */}
                                            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                                                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500 shrink-0">
                                                    <FileText size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black">{report.device_model}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                                        <div className="flex items-center gap-2 text-secondary/60 font-bold text-sm">
                                                            <span className="text-secondary/30">ID:</span> {report.id}
                                                        </div>
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
                                                <Link href={`/${locale}/dashboard/client/warranty?id=${report.id}`}>
                                                    <Button
                                                        variant="outline"
                                                        className="rounded-2xl h-14 px-8 font-black border-primary/20 hover:bg-primary/5 gap-3"
                                                    >
                                                        <ShieldCheck size={20} className="text-primary" />
                                                        حالة الضمان
                                                    </Button>
                                                </Link>

                                                <Link href={`/${locale}/dashboard/admin/reports/${report.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        className="rounded-2xl h-14 px-8 font-black bg-surface-variant/50 hover:bg-surface-variant gap-3"
                                                    >
                                                        <FileText size={20} />
                                                        تقرير الفحص
                                                    </Button>
                                                </Link>

                                                {invoice ? (
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handlePrint(invoice.id)}
                                                        className="rounded-2xl h-14 px-8 font-black shadow-lg shadow-primary/20 gap-3"
                                                    >
                                                        <Receipt size={20} />
                                                        عرض الفاتورة
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        disabled
                                                        className="rounded-2xl h-14 px-8 font-black opacity-30 gap-3"
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
                        <div className="bg-white/40 border border-dashed border-black/10 rounded-[3rem] py-32 flex flex-col items-center justify-center text-center space-y-4">
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
            </div>
        </DashboardLayout>
    );
}
