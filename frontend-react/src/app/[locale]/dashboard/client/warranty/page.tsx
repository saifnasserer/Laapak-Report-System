'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    ShieldCheck,
    ArrowLeft,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Settings,
    RefreshCw,
    Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { format, differenceInDays, addMonths, addDays, isAfter } from 'date-fns';
import { ar } from 'date-fns/locale';

function WarrantyPageContent({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const reportId = searchParams.get('id');
    const [latestReport, setLatestReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLatestReport = async () => {
            try {
                const res = await api.get('/reports/client/me');
                const reports = res.data.data || [];

                if (reportId) {
                    const specific = reports.find((r: any) => r.id === reportId);
                    if (specific) {
                        setLatestReport(specific);
                    } else {
                        // Fallback to latest completed if specified ID not found
                        const completedReports = reports.filter((r: any) => r.status === 'completed');
                        if (completedReports.length > 0) setLatestReport(completedReports[0]);
                    }
                } else {
                    const completedReports = reports.filter((r: any) => r.status === 'completed');
                    if (completedReports.length > 0) {
                        setLatestReport(completedReports[0]);
                    }
                }
            } catch (err) {
                console.error('Error fetching report for warranty:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLatestReport();
    }, [reportId]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-secondary font-medium">جاري احتساب فترات الضمان...</p>
                </div>
            </DashboardLayout>
        );
    }

    const startDate = latestReport ? new Date(latestReport.inspection_date) : new Date();

    // Warranty Periods
    const manufacturingDuration = 180; // 6 months
    const replacementDuration = 14;   // 14 days
    const maintenance1Duration = 180; // 6 months
    const maintenance2Duration = 360; // 12 months (starts from start date)

    const calculateProgress = (start: Date, durationDays: number) => {
        const now = new Date();
        const end = addDays(start, durationDays);
        const total = durationDays;
        const elapsed = differenceInDays(now, start);
        const remaining = differenceInDays(end, now);
        const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
        const isExpired = isAfter(now, end);

        return { progress, remaining: Math.max(remaining, 0), isExpired, endDate: end };
    };

    const manufacturing = calculateProgress(startDate, manufacturingDuration);
    const replacement = calculateProgress(startDate, replacementDuration);
    const maintenance1 = calculateProgress(startDate, maintenance1Duration);
    const maintenance2 = calculateProgress(startDate, maintenance2Duration);

    const WarrantyCard = ({ title, icon: Icon, data, description }: any) => (
        <Card className="overflow-hidden border-none shadow-xl shadow-black/5 bg-white/60 backdrop-blur-sm rounded-[2rem]">
            <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", data.isExpired ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                            <Icon size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">{title}</h3>
                            <p className="text-sm text-secondary/60 font-medium">{description}</p>
                        </div>
                    </div>
                    <div className={cn("px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border",
                        data.isExpired ? "bg-destructive/5 text-destructive border-destructive/10" : "bg-green-50 text-green-600 border-green-100")}>
                        {data.isExpired ? 'منتهي' : 'نشط'}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end text-sm">
                        <span className="font-bold text-secondary/40">التقدم</span>
                        <span className="font-black text-primary">{Math.round(data.progress)}%</span>
                    </div>
                    <div className="h-4 bg-black/5 rounded-full overflow-hidden p-1">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out",
                                data.isExpired ? "bg-destructive/40" : "bg-gradient-to-r from-primary to-primary/60")}
                            style={{ width: `${data.progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-secondary/60">
                        <Clock size={16} />
                        <span className="text-sm font-bold">المتبقي: {data.remaining} يوم</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary/60">
                        <Calendar size={16} />
                        <span className="text-sm font-bold">{format(data.endDate, 'dd/MM/yyyy')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/${locale}/dashboard/client`)}
                            className="rounded-2xl bg-white border border-black/5 shadow-sm hover:bg-surface-variant h-12 w-12 p-0 flex items-center justify-center text-secondary"
                        >
                            <ArrowLeft size={24} />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <ShieldCheck className="text-primary" size={32} />
                                متتبع الضمان
                            </h1>
                            <p className="text-secondary font-medium">متابعة فترات الضمان والصيانة لأجهزتك</p>
                        </div>
                    </div>
                </div>

                {!latestReport ? (
                    <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                        <AlertCircle size={48} className="text-amber-500" />
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-amber-900">لا يوجد ضمان نشط</h3>
                            <p className="text-amber-700 font-medium max-w-md">يبدأ الضمان عند اكتمال أول فحص فني لجهازك. يرجى التواصل مع الدعم الفني لتفعيل الضمان.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Device Info Summary */}
                        <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000">
                                <ShieldCheck size={200} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-[0.2em] inline-block">
                                        الجهاز المؤمن
                                    </div>
                                    <h2 className="text-4xl font-black">{latestReport.device_model}</h2>
                                    <div className="flex items-center gap-6 text-white/80">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={18} />
                                            <span className="font-bold">تفعيل الضمان: {format(startDate, 'dd MMMM yyyy', { locale: ar })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white/60 font-bold uppercase text-xs tracking-widest">المكان</p>
                                        <p className="text-xl font-black">فرع الكرادة - بغداد</p>
                                    </div>
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                        <CheckCircle2 size={32} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Warranty Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <WarrantyCard
                                title="ضمان عيوب المصنع"
                                icon={ShieldCheck}
                                data={manufacturing}
                                description="يشمل العيوب التقنية الناتجة عن التصنيع"
                            />
                            <WarrantyCard
                                title="ضمان الاستبدال"
                                icon={RefreshCw}
                                data={replacement}
                                description="إمكانية استبدال الجهاز خلال أول 14 يوم"
                            />
                            <WarrantyCard
                                title="دورة صيانة (1)"
                                icon={Settings}
                                data={maintenance1}
                                description="الفحص الدوري النصف سنوي الأول"
                            />
                            <WarrantyCard
                                title="دورة صيانة (2)"
                                icon={Settings}
                                data={maintenance2}
                                description="الفحص الدوري النصف سنوي الثاني"
                            />
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default function WarrantyPage({ params }: { params: Promise<{ locale: string }> }) {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-secondary font-medium">جاري التحميل...</p>
                </div>
            </DashboardLayout>
        }>
            <WarrantyPageContent params={params} />
        </Suspense>
    );
}
