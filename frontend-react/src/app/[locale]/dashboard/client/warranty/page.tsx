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
    Loader2,
    Gavel,
    Lock,
    Info,
    ChevronDown,
    Activity,
    Thermometer,
    Wind,
    Zap,
    Cpu,
    Search,
    ShoppingBag,
    Bell
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
    const maintenance2Duration = 180; // Following 6 months

    const calculateProgress = (start: Date, durationDays: number) => {
        const now = new Date();
        const end = addDays(start, durationDays);
        const total = durationDays;

        // Calculate progress based on whether current time is before, during or after the period
        let progress = 0;
        if (isAfter(now, end)) {
            progress = 100;
        } else if (isAfter(now, start)) {
            const elapsed = differenceInDays(now, start);
            progress = Math.min((elapsed / total) * 100, 100);
        } else {
            progress = 0;
        }

        const remaining = differenceInDays(end, now);
        const isExpired = isAfter(now, end);
        const isNotStarted = isAfter(start, now);

        return { progress, remaining: Math.max(remaining, 0), isExpired, isNotStarted, endDate: end, startDate: start };
    };

    const manufacturing = calculateProgress(startDate, manufacturingDuration);
    const replacement = calculateProgress(startDate, replacementDuration);
    const maintenance1 = calculateProgress(startDate, maintenance1Duration);

    // Period 2 starts after Period 1 ends
    const maintenance2StartDate = addDays(startDate, maintenance1Duration);
    const maintenance2 = calculateProgress(maintenance2StartDate, maintenance2Duration);

    const WarrantyCard = ({ title, icon: Icon, data, description }: any) => (
        <Card className="overflow-hidden border border-black/5 bg-white/60 backdrop-blur-sm rounded-[2rem] transition-all hover:border-primary/20">
            <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                            data.isExpired ? "bg-destructive/10 text-destructive" :
                                data.isNotStarted ? "bg-black/5 text-secondary/40" : "bg-primary/10 text-primary")}>
                            <Icon size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-secondary">{title}</h3>
                            <p className="text-xs text-secondary/40 font-bold uppercase tracking-wider">{description}</p>
                        </div>
                    </div>
                    <div className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                        data.isExpired ? "bg-destructive/10 text-destructive" :
                            data.isNotStarted ? "bg-secondary/10 text-secondary/40" :
                                "bg-green-500/10 text-green-600")}>
                        {data.isExpired ? 'منتهي' : data.isNotStarted ? 'لم يبدأ' : 'نشط'}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-secondary/20">
                        <span>مستوى التقدم</span>
                        <span className={cn("font-black", data.isExpired ? "text-destructive/40" : "text-primary")}>{Math.round(data.progress)}%</span>
                    </div>
                    <div className="h-3 bg-black/[0.03] rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out",
                                data.isExpired ? "bg-destructive/40" :
                                    data.isNotStarted ? "bg-black/[0.05]" :
                                        "bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]")}
                            style={{ width: `${data.progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-secondary/60">
                        <Clock size={16} />
                        <span className="text-sm font-bold">
                            {data.isNotStarted ? `يبدأ بعد: ${differenceInDays(data.startDate, new Date())} يوم` : `المتبقي: ${data.remaining} يوم`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary/60">
                        <Calendar size={16} />
                        <span className="text-sm font-bold">{format(data.endDate, 'dd/MM/yyyy')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);
        return (
            <Card className="overflow-hidden border border-black/5 bg-white/60 backdrop-blur-sm rounded-[2rem]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-8 flex items-center justify-between hover:bg-black/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon size={24} />
                        </div>
                        <h3 className="text-xl font-black text-secondary">{title}</h3>
                    </div>
                    <ChevronDown size={24} className={cn("text-secondary/20 transition-transform duration-500", isOpen && "rotate-180")} />
                </button>
                <div className={cn("transition-all duration-500 overflow-hidden", isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}>
                    <div className="px-8 pb-8 space-y-6 pt-2 border-t border-black/[0.03]">
                        {children}
                    </div>
                </div>
            </Card>
        );
    };

    const TermItem = ({ icon: Icon, title, description }: any) => (
        <div className="group space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-black/5 text-secondary/40 flex items-center justify-center transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <Icon size={16} />
                </div>
                <h4 className="font-bold text-secondary text-base">{title}</h4>
            </div>
            <p className="pr-11 text-secondary/60 text-sm font-medium leading-relaxed">
                {description}
            </p>
        </div>
    );

    const TimelineItem = ({ icon: Icon, title, description, isLast = false }: any) => (
        <div className="flex gap-6 group">
            <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-surface-variant text-secondary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white shadow-sm">
                    <Icon size={20} />
                </div>
                {!isLast && <div className="w-0.5 h-12 bg-black/[0.05] mt-2 group-hover:bg-primary/20 transition-colors" />}
            </div>
            <div className="space-y-1.5 pt-1">
                <h4 className="font-bold text-secondary text-base group-hover:text-primary transition-colors">{title}</h4>
                <p className="text-secondary/60 text-sm font-medium leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
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
                            onClick={() => router.push(`/dashboard/client`)}
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
                        <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-black/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                                <ShieldCheck size={280} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                                            الجهاز المؤمن
                                        </div>
                                        <div className="px-4 py-1.5 bg-green-500/10 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            حماية نشطة
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">{latestReport.device_model}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em]">Serial Number:</span>
                                            <span className="text-sm font-mono font-bold text-secondary/60 bg-surface-variant/20 px-3 py-1 rounded-lg">{latestReport.serial_number || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-2xl border border-black/[0.03]">
                                            <Calendar size={18} className="text-primary/40" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-secondary/20 uppercase">تاريخ التفعيل</span>
                                                <span className="text-sm font-bold text-secondary">{format(startDate, 'dd MMMM yyyy', { locale: ar })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-2xl border border-black/[0.03]">
                                            <ShieldCheck size={18} className="text-primary/40" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-secondary/20 uppercase">نوع الضمان</span>
                                                <span className="text-sm font-bold text-secondary">ضمان لابك الرسمي (12 شهر)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="flex items-center gap-4 bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-1">الموقع المعتمد</p>
                                        <p className="text-lg font-black text-secondary">فرع الكرادة - بغداد</p>
                                    </div>
                                    <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                        <CheckCircle2 size={28} />
                                    </div>
                                </div> */}
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

                            {/* New Collapsible Sections */}
                            <div className="md:col-span-2 space-y-8">
                                <CollapsibleSection title="شروط الضمان الأساسية" icon={Gavel}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <TermItem
                                            icon={AlertCircle}
                                            title="استثناءات الضمان"
                                            description="لا يسري الضمان في حال وجود سوء استخدام، الكسر، أو الأضرار الناتجة عن الكهرباء ذات الجهد العالي أو ما شابه."
                                        />
                                        <TermItem
                                            icon={Lock}
                                            title="الاستثناء عند فتح الجهاز"
                                            description="لا يسري الضمان في حال تم إزالة الاستيكر الخاص بالشركة أو في حالة محاولة فتح أو صيانة الجهاز خارج الشركة."
                                        />
                                        <TermItem
                                            icon={Info}
                                            title="عيوب الصناعة فقط"
                                            description="يشمل الضمان فقط العيوب الناتجة عن التصنيع ولا يشمل الأعطال الناتجة عن البرمجيات أو أي مشاكل غير متعلقة بالأجزاء المادية."
                                        />
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title="مراحل الصيانة الدورية" icon={Settings}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                        <TimelineItem
                                            icon={Thermometer}
                                            title="استبدال المعجون الحراري"
                                            description="باستخدام نوع عالي الجودة ومناسب لطبيعة الجهاز لضمان أفضل تبريد ممكن."
                                        />
                                        <TimelineItem
                                            icon={Activity}
                                            title="إزالة الأكسدة من نظام التبريد"
                                            description="لتحسين نقل الحرارة بكفاءة، حيث تؤثر الأكسدة على كفاءة التبريد بنسبة قد تصل إلى 40%."
                                        />
                                        <TimelineItem
                                            icon={Wind}
                                            title="فحص سرعة مراوح التبريد"
                                            description="وفي حالة تأثرها بالأتربة، يتم تنظيفها وإعادتها لحالتها الطبيعية لضمان التهوية المثالية."
                                        />
                                        <TimelineItem
                                            icon={Cpu}
                                            title="تنظيف اللوحة الأم بالكامل"
                                            description="شاملاً تنظيف جميع الفلاتات والوصلات بدقة لضمان استقرار الأداء."
                                        />
                                        <TimelineItem
                                            icon={Search}
                                            title="إجراء فحص شامل لكل مكونات الجهاز"
                                            description="لاكتشاف أي أعطال محتملة مبكرًا واتخاذ الإجراءات الوقائية اللازمة."
                                        />
                                        <TimelineItem
                                            icon={ShoppingBag}
                                            title="تنظيف خارجي كامل للجهاز"
                                            description="لإعادة مظهره كالجديد تمامًا، مما يعزز من تجربة الاستخدام والانطباع العام."
                                            isLast={true}
                                        />
                                    </div>
                                </CollapsibleSection>

                                {/* Notification Status Card */}
                                <Card className="overflow-hidden border border-black/5 bg-white/60 backdrop-blur-sm rounded-[2rem]">
                                    <CardContent className="p-8 flex items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/5">
                                                <Bell size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-secondary">تنبيهات الصيانة</h3>
                                                <p className="text-sm font-bold text-secondary/40">تذكير تلقائي بمواعيد الصيانة المجانية لجهازك</p>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-3 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                            <span className="text-sm font-black text-primary uppercase">نظام التذكير نشط</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
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
