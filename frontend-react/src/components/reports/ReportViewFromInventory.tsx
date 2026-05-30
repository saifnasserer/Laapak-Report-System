'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
    Activity, ShieldCheck, Cpu, HardDrive, Database, Monitor,
    Battery, Wifi, Bluetooth, AlertTriangle, Thermometer,
    Keyboard, Search, Usb, Zap, Image as ImageIcon,
    User, Smartphone, ChevronLeft, ChevronRight,
    Check, CheckCircle2, RefreshCw, MousePointer2,
    Package, Layers, AlertCircle, Clock,
    Info, Wrench, CreditCard
} from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import api from '@/lib/api';
import { maintenanceApi } from '@/lib/maintenance-api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ExternalExaminationSection from './report-view-v2/sections/ExternalExaminationSection';
import StatusBanners from './report-view-v2/sections/StatusBanners';
import ImageLightbox from './report-view-v2/modals/ImageLightbox';
import { useProducts } from './report-view-v2/hooks/useProducts';
import { useReportActions } from './report-view-v2/hooks/useReportActions';
import StepAccessories from './report-view-v2/steps/StepAccessories';
import PaymentSelectionModal from './report-view-v2/modals/PaymentSelectionModal';

interface ReportViewProps {
    id: string;
    locale: string;
    viewMode: 'admin' | 'client' | 'public';
    initialReport?: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getComponentIcon = (name: string, size = 16) => {
    const n = (name || '').toLowerCase();
    if (n.includes('cpu') || n.includes('processor')) return <Cpu size={size} />;
    if (n.includes('gpu') || n.includes('graphics')) return <Monitor size={size} />;
    if (n.includes('battery')) return <Battery size={size} />;
    if (n.includes('ssd') || n.includes('hdd') || n.includes('storage') || n.includes('disk')) return <HardDrive size={size} />;
    if (n.includes('keyboard')) return <Keyboard size={size} />;
    if (n.includes('touchpad') || n.includes('mouse')) return <MousePointer2 size={size} />;
    if (n.includes('screen') || n.includes('display') || n.includes('monitor')) return <Monitor size={size} />;
    if (n.includes('ram') || n.includes('memory')) return <Database size={size} />;
    if (n.includes('wifi') || n.includes('network')) return <Wifi size={size} />;
    if (n.includes('bluetooth')) return <Bluetooth size={size} />;
    if (n.includes('port') || n.includes('usb')) return <Usb size={size} />;
    if (n.includes('audio') || n.includes('sound')) return <Activity size={size} />;
    if (n.includes('camera')) return <Monitor size={size} />;
    if (n.includes('thermal') || n.includes('temp')) return <Thermometer size={size} />;
    if (n.includes('interactive')) return <CheckCircle2 size={size} />;
    if (n.includes('os') || n.includes('system')) return <Layers size={size} />;
    if (n.includes('biometric') || n.includes('security')) return <ShieldCheck size={size} />;
    return <Search size={size} />;
};

const getComponentTitle = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n === 'info' || n === 'sys info') return 'تفاصيل اللابتوب';
    if (n.includes('cpu stress') || n === 'cpu') return 'اختبار البروسيسور';
    if (n.includes('ram stress') || n === 'ram') return 'اختبار الرامات';
    if (n.includes('gpu stress') || n === 'gpu') return 'اختبار كارت الشاشة';
    if (n.includes('disk stress') || n.includes('storage stress') || n === 'storage') return 'اختبار القرص';
    if (n.includes('battery')) return 'البطارية';
    if (n.includes('display') || n.includes('screen')) return 'الشاشة';
    if (n.includes('keyboard')) return 'لوحة المفاتيح';
    if (n.includes('touchpad')) return 'لوحة اللمس';
    if (n.includes('wifi') || n.includes('network')) return 'الواي فاي';
    if (n.includes('bluetooth')) return 'البلوتوث';
    if (n.includes('port') || n.includes('usb')) return 'المنافذ';
    if (n.includes('audio') || n.includes('sound')) return 'الصوت';
    if (n.includes('camera')) return 'الكاميرا';
    if (n.includes('interactive')) return 'الاختبارات التفاعلية';
    if (n.includes('os') || n.includes('system')) return 'نظام التشغيل';
    if (n.includes('biometric')) return 'البصمة والأمان';
    if (n.includes('monitor')) return 'الشاشات الخارجية';
    return name ? `اختبار ${name}` : 'فحص فني';
};

const getTestDescription = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('cpu')) return 'اختبار ضغط كامل على المعالج لمدة محددة — نضغط عليه لأقصى طاقته عشان نتأكد إنه شغال بكفاءة 100٪ ومش بيسخن بشكل مفرط تحت الحمل الكامل.';
    if (n.includes('ram')) return 'اختبار سرعة الرامات وسلامتها عن طريق الكتابة والقراءة المتواصلة — بنتحقق من الباندويدث الفعلية وإنه مفيش أي خلايا معيبة في الميموري.';
    if (n.includes('gpu')) return 'اختبار ضغط على كارت الشاشة — بنشتغل عليه بأقصى حمل عشان نتأكد إن الحرارة مظبوطة والأداء ثابت ومفيش أي تشطيب أو كراش تحت الضغط.';
    if (n.includes('disk') || n.includes('storage')) return 'اختبار أداء القرص بالقراءة والكتابة المتتالية والعشوائية — بنقيس السرعات الفعلية ونراجع حالة صحة القرص SMART للتأكد من سلامته.';
    if (n.includes('battery')) return 'بيانات البطارية من الفحص التقني — بتوضح الصحة الفعلية مقارنة بالسعة الأصلية، وعدد دورات الشحن المتبقية.';
    if (n.includes('display') || n.includes('screen')) return 'مواصفات الشاشة المكتشفة — الدقة ومعدل التحديث والحجم.';
    if (n.includes('keyboard')) return 'نتيجة فحص لوحة المفاتيح — تم اختبار كل مفتاح يدوياً للتحقق من الاستجابة الكاملة.';
    if (n.includes('interactive')) return 'اختبارات تفاعلية تتطلب تدخل التقني — فحص الكاميرا والصوت والميكروفون والتاتش باد يدوياً.';
    return 'نتيجة الفحص التقني التفصيلي لهذا المكون — تم الاختبار وتسجيل النتائج بدقة.';
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReportView({ id, locale, viewMode, initialReport }: ReportViewProps) {
    const router = useRouter();
    const isRtl = locale === 'ar';

    const [report, setReport] = useState<any>(initialReport || null);
    const [isLoading, setIsLoading] = useState(!initialReport);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(1);
    const [isConfirmed, setIsConfirmed] = useState(initialReport ? !!initialReport.is_confirmed : false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [sourceDetails, setSourceDetails] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [maintenanceIssue, setMaintenanceIssue] = useState('');
    const [isMovingToMaintenance, setIsMovingToMaintenance] = useState(false);

    const steps = [
        { id: 1, title: 'البيانات والمواصفات' },
        { id: 2, title: 'المعاينة الخارجية' },
        { id: 3, title: 'الفحص التقني' },
        { id: 4, title: 'الفحص الداخلي' },
        { id: 5, title: 'المواصفات الفنية' },
        { id: 6, title: 'إضافات مهمة!' },
        { id: 7, title: 'الفواتير والإكمال' },
    ];

    // 2. Medusa products hook
    const { products, isLoadingProducts } = useProducts(activeStep);

    // 3. Report actions hook
    const {
        cartItems,
        toggleCartItem,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        calculateFinalTotal,
        handleConfirmOrder,
        handleFinalConfirmation,
        paymentModalOpen,
        setPaymentModalOpen
    } = useReportActions(id, report, setReport, isConfirmed, setIsConfirmed, setActiveStep);

    useEffect(() => {
        if (initialReport) {
            setReport(initialReport);
            setIsConfirmed(!!initialReport.is_confirmed);
            setIsLoading(false);
            return;
        }
        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/reports/${id}`);
                const rData = response.data.report;
                setReport(rData);
                setIsConfirmed(!!rData.is_confirmed);
            } catch (err: any) {
                setError('فشل في تحميل تفاصيل التقرير.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [id, initialReport]);

    const handleAssignToWarehouse = async () => {
        if (!sourceDetails.trim()) { alert('يرجى إدخال تفاصيل المصدر'); return; }
        try {
            setIsAssigning(true);
            let laapakClient;
            const res = await api.get('/clients?search=Laapak');
            const clients = res.data.clients || [];
            laapakClient = clients.find((c: any) => c.name.toLowerCase() === 'laapak' || c.name === 'لأبك');
            if (!laapakClient) {
                const cr = await api.post('/clients', { name: 'Laapak', phone: '0000000000', email: 'warehouse@laapak.com', address: 'Laapak Warehouse', orderCode: 'LPK0000' });
                laapakClient = cr.data;
            }
            const updatedNotes = (report.notes || '') + `\nSource: ${sourceDetails}`;
            await api.put(`/reports/${id}`, { client_id: laapakClient.id, notes: updatedNotes });
            setReport((prev: any) => ({ ...prev, client_id: laapakClient.id, client_name: laapakClient.name, notes: updatedNotes }));
            setWarehouseModalOpen(false);
            setSourceDetails('');
            alert('تم إضافة الجهاز للمخزن بنجاح');
        } catch (err) {
            alert('فشل في إضافة الجهاز للمخزن');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleMoveToMaintenance = async () => {
        if (!maintenanceIssue.trim()) { alert('يرجى كتابة المشكلة'); return; }
        try {
            setIsMovingToMaintenance(true);
            await maintenanceApi.createJob({ report_id: id, issue_description: maintenanceIssue });
            setMaintenanceModalOpen(false);
            setMaintenanceIssue('');
            alert('تم إرسال الجهاز للصيانة');
            const response = await api.get(`/reports/${id}`);
            setReport(response.data.report);
        } catch (err) {
            alert('فشل في إرسال الجهاز للصيانة');
        } finally {
            setIsMovingToMaintenance(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <div className="text-secondary/40 text-sm font-bold">جاري التحميل...</div>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-destructive/5 flex items-center justify-center mx-auto">
                    <AlertCircle className="text-destructive" size={32} />
                </div>
                <div className="text-destructive text-xl font-black">{error || 'التقرير غير موجود'}</div>
                <Button onClick={() => router.back()} variant="outline" className="rounded-full">العودة للخلف</Button>
            </div>
        );
    }

    // ── Data Normalization ────────────────────────────────────────────────────
    let specs = report.full_specs || report.agent_json;
    if (typeof specs === 'string') { try { specs = JSON.parse(specs); } catch { specs = null; } }

    const isNewFormat = specs && !specs.device && (specs.cpu || specs.ram || specs.storage);

    const hw = (() => {
        if (!specs) return null;
        if (!isNewFormat) return specs.device || null;
        const s = specs;
        const battDev = s.battery?.devices?.[0] ?? null;
        const disp = s.display?.active_displays?.[0] ?? null;
        const storDev: any[] = s.storage?.devices ?? [];
        const gpuDevs: any[] = s.gpu?.devices ?? [];
        return {
            summary: { model: s.system?.model || s.system?.motherboard_product || '', manufacturer: s.system?.manufacturer || '' },
            cpu: s.cpu ? { name: s.cpu.name, cores: s.cpu.physical_cores, threads: s.cpu.logical_cores, base_speed_ghz: s.cpu.base_speed_ghz } : null,
            memory: s.ram ? { total_ram: `${s.ram.total} GB`, total: `${s.ram.total} GB`, type: s.ram.type, speed: s.ram.speed_mhz ? `${s.ram.speed_mhz} MHz` : null } : null,
            storage: storDev.map((d: any) => ({ type: d.type || 'SSD', model: d.model || '', capacity: `${Math.round(d.size_gb || 0)} GB`, size: `${Math.round(d.size_gb || 0)} GB`, health_percent: d.health_pct ?? 100, health_status: d.status || 'OK', firmware: d.firmware || '' })),
            gpu: gpuDevs.map((g: any) => ({ name: g.name, vram: g.vram_mb ? `${g.vram_mb} MB` : null, driver_version: g.driver_version || '' })),
            battery: battDev ? { health: `${(battDev.health_percentage ?? 0).toFixed(1)}%`, health_percentage: battDev.health_percentage ?? 0, cycle_count: battDev.cycle_count ?? 0, estimated_charge: battDev.estimated_charge ?? 0 } : null,
            display: disp ? { resolution: `${disp.resolution?.width ?? 0}x${disp.resolution?.height ?? 0}`, refresh_rate_hz: disp.refresh_rate ?? 0, size_inch: disp.size_inch ?? 0, touch: disp.touch ?? false } : null,
            network: { wifi_signal: s.network?.wifi_signal_pct || '', bluetooth: s.bluetooth?.available ?? false },
        };
    })();

    const stressResults: any[] = isNewFormat ? (specs?.results ?? []) : [];
    const interactiveMap: Record<string, any> = isNewFormat ? (specs?.interactive ?? {}) : {};
    const bsodCount: number = isNewFormat ? (specs?.stability?.bsod_count ?? 0) : 0;
    const hasRecentCrash: boolean = isNewFormat ? (specs?.stability?.has_recent_crashes ?? false) : false;

    let diagnosis = specs?.diagnosis || null;
    if (!diagnosis && report.grade) {
        diagnosis = { grade: report.grade, status: report.status, score: undefined };
    }
    const diagScore: number = diagnosis?.score ?? 0;
    const diagBreakdown: Record<string, number> = diagnosis?.breakdown ?? {};

    // Thermal
    let maxCpuTemp = 0, avgCpuTemp = 0;
    if (isNewFormat && stressResults.length > 0) {
        const cpuStress = stressResults.find((r: any) => r.name?.includes('CPU'));
        if (cpuStress) {
            const tm = cpuStress.temps_map || {};
            const realMax = [tm['CPU Package'], tm['Core Max']].filter(Boolean);
            maxCpuTemp = realMax.length > 0 ? Math.max(...realMax) : (cpuStress.max_temp > 100 ? 0 : cpuStress.max_temp || 0);
            avgCpuTemp = cpuStress.avg_temp || 0;
        }
    }

    const storageItem = hw?.storage?.[0];
    const storageType = storageItem?.model?.toLowerCase().includes('ssd') ? 'SSD' : (storageItem?.type || 'HDD');
    const storageHealth = storageItem?.health_percent != null ? `${storageItem.health_percent}%` : (storageItem?.health_status || '');

    const getGradeColor = (grade: string) => {
        const g = (grade || '').toUpperCase();
        if (g.startsWith('A')) return 'text-emerald-600';
        if (g.startsWith('B')) return 'text-amber-600';
        return 'text-rose-600';
    };

    const renderStepContent = () => {
        switch (activeStep) {

            case 1: return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6" dir="rtl">
                    {/* Status Banners: Completed / Shipped */}
                    <StatusBanners report={report} viewMode={viewMode} />

                    {/* BSOD Warning */}
                    {(bsodCount > 0 || hasRecentCrash) && (
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-50 border border-rose-200">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle size={20} /></div>
                            <div>
                                <p className="font-black text-rose-700">تحذير: استقرار النظام</p>
                                <p className="text-sm font-bold text-rose-600/80 mt-0.5">
                                    {bsodCount > 0 && `${bsodCount} شاشة زرقاء (BSOD) مسجلة`}
                                    {bsodCount > 0 && hasRecentCrash && ' — '}
                                    {hasRecentCrash && 'تعطلات حديثة مكتشفة'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Device identity */}
                        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-5">
                            <h3 className="text-base font-black text-secondary flex items-center gap-3"><Smartphone size={18} className="text-primary/50" />هوية الجهاز</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-secondary/40 mb-1">الموديل</p>
                                    <p className="text-2xl font-black text-secondary">{hw?.summary?.model || report.device_model || '—'}</p>
                                    <p className="text-sm font-bold text-secondary/40 mt-0.5">{hw?.summary?.manufacturer || report.device_brand || ''}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary/40 mb-1">الرقم التسلسلي</p>
                                    <p className="text-sm font-mono font-bold text-secondary/70 bg-black/[0.02] px-3 py-1.5 rounded-xl inline-block" dir="ltr">{report.serial_number || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Client info */}
                        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-5">
                            <h3 className="text-base font-black text-secondary flex items-center gap-3"><User size={18} className="text-primary/50" />بيانات العميل</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-secondary/40 mb-1">الاسم</p>
                                    <p className="text-xl font-black text-secondary">{report.client_name || '—'}</p>
                                </div>
                                {report.client_phone && (
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">رقم الموبايل</p>
                                        <p className="text-sm font-bold text-secondary/70">{report.client_phone}</p>
                                    </div>
                                )}
                                {report.client_address && (
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">العنوان</p>
                                        <p className="text-sm font-bold text-secondary/70">{report.client_address}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis Score */}
                    {diagScore > 0 && (
                        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-secondary">نقاط التشخيص الشامل</h3>
                                <span className={cn("text-3xl font-black", diagScore >= 80 ? "text-emerald-600" : diagScore >= 60 ? "text-amber-600" : "text-rose-600")}>
                                    {diagScore}<span className="text-sm font-bold text-secondary/30"> / 100</span>
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-secondary/10 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-700", diagScore >= 80 ? "bg-emerald-500" : diagScore >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${diagScore}%` }} />
                            </div>
                            {Object.keys(diagBreakdown).length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                    {Object.entries(diagBreakdown).map(([key, val]) => (
                                        <div key={key} className="p-3 bg-black/[0.02] rounded-2xl text-center">
                                            <div className="text-[9px] font-black text-secondary/30 uppercase tracking-wider mb-1">{key}</div>
                                            <div className={cn("text-lg font-black", (val as number) >= 80 ? "text-emerald-600" : (val as number) >= 60 ? "text-amber-600" : "text-rose-600")}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick specs */}
                    <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm">
                        <h3 className="text-base font-black text-secondary flex items-center gap-3 mb-5"><Layers size={18} className="text-primary/50" />المواصفات السريعة</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { label: 'المعالج', value: hw?.cpu?.name || report.cpu, icon: <Cpu size={16} />, sub: hw?.cpu?.cores ? `${hw.cpu.cores} أنوية @ ${hw.cpu.base_speed_ghz} GHz` : null },
                                { label: 'الرامات', value: hw?.memory?.total_ram || report.ram, icon: <Database size={16} />, sub: hw?.memory?.type ? `${hw.memory.type} ${hw.memory.speed || ''}` : null },
                                { label: 'التخزين', value: storageItem?.capacity || report.storage, icon: <HardDrive size={16} />, sub: storageHealth ? `${storageType} · صحة ${storageHealth}` : storageType },
                                { label: 'كارت الشاشة', value: hw?.gpu?.[0]?.name || report.gpu, icon: <Monitor size={16} />, sub: hw?.gpu?.[0]?.vram ? `${hw.gpu[0].vram} VRAM` : null },
                                ...(hw?.battery ? [{ label: 'البطارية', value: hw.battery.health, icon: <Battery size={16} />, sub: hw.battery.cycle_count ? `${hw.battery.cycle_count} دورة شحن` : null }] : []),
                                ...(hw?.display ? [{ label: 'الشاشة', value: hw.display.resolution, icon: <Monitor size={16} />, sub: `${hw.display.refresh_rate_hz}Hz${hw.display.size_inch ? ` · ${hw.display.size_inch}"` : ''}` }] : []),
                            ].filter(s => s.value).map((spec, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/[0.02] hover:bg-white hover:border-primary/10 hover:shadow-sm transition-all group">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary/40 group-hover:text-primary shadow-sm transition-colors">{spec.icon}</div>
                                    <div className="flex flex-col flex-1 min-w-0 text-right">
                                        <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">{spec.label}</p>
                                        <p className="font-black text-secondary text-sm truncate" dir="ltr" style={{ textAlign: 'right' }}>{spec.value || '—'}</p>
                                        {spec.sub && <p className="text-[10px] font-bold text-primary/50 mt-0.5">{spec.sub}</p>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            );

            case 2: return (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                >
                    <ExternalExaminationSection report={report} onImageClick={setSelectedImage} />
                </motion.div>
            );

            case 3: {
                let results: any[] = [];
                if (isNewFormat && hw) {
                    if (specs.system?.os_name) {
                        results.push({ id: 'os', name: 'OS', status: 'pass', message: `${specs.system.os_name} ${specs.system.os_version || ''}` });
                    }
                    if (hw.cpu) results.push({ id: 'cpu', name: 'CPU', status: 'pass', message: hw.cpu.name });
                    if (hw.memory) results.push({ id: 'memory', name: 'RAM', status: 'pass', message: `${hw.memory.total_ram} ${hw.memory.type || ''} ${hw.memory.speed || ''}`.trim() });
                    if (hw.storage?.length) {
                        const s0 = hw.storage[0];
                        results.push({ id: 'storage', name: 'Storage', status: s0.health_percent < 80 ? 'warning' : 'pass', message: `${s0.model || s0.type} · ${s0.health_percent}%` });
                        if (hw.storage.length > 1) {
                            const s1 = hw.storage[1];
                            results.push({ id: 'storage_sec', name: 'Storage Secondary', status: s1.health_percent < 80 ? 'warning' : 'pass', message: `${s1.model || s1.type} · ${s1.health_percent}%` });
                        }
                    }
                    if (hw.gpu?.length) {
                        results.push({ id: 'gpu', name: 'GPU', status: 'pass', message: hw.gpu[0].name });
                        if (hw.gpu.length > 1) {
                            results.push({ id: 'gpu_sec', name: 'Dedicated GPU', status: 'pass', message: hw.gpu[1].name });
                        }
                    }
                    if (hw.display) results.push({ id: 'display', name: 'Display', status: 'pass', message: `${hw.display.resolution} @ ${hw.display.refresh_rate_hz}Hz` });
                    if (hw.battery) results.push({ id: 'battery', name: 'Battery', status: 'pass', message: `صحة البطارية ${hw.battery.health} (${hw.battery.cycle_count || 0} دورة)` });
                    
                    if (specs.network?.devices?.[0]?.name) {
                        results.push({ id: 'wifi', name: 'WiFi', status: 'pass', message: `${specs.network.devices[0].name} · الإشارة: ${specs.network.wifi_signal_pct || 0}%` });
                    }
                    if (specs.bluetooth?.available) {
                        results.push({ id: 'bluetooth', name: 'Bluetooth', status: 'pass', message: `بلوتوث مدعوم (${specs.bluetooth.paired_count || 0} أجهزة مقترنة)` });
                    }
                    if (specs.ports?.usb_count !== undefined) {
                        results.push({ id: 'ports', name: 'Ports', status: 'pass', message: `المنافذ: ${specs.ports.usb_count || 0} USB · ${specs.ports.thunderbolt_count || 0} Thunderbolt` });
                    }
                    if (specs.ports?.biometric_devices?.length > 0) {
                        results.push({ id: 'biometric', name: 'Biometric', status: 'pass', message: `أجهزة البصمة: ${specs.ports.biometric_devices[0].name}` });
                    }
                    
                    Object.entries(interactiveMap).forEach(([key, val]: [string, any]) => {
                        results.push({ id: key, name: key, status: val?.passed ? 'pass' : 'warning', message: val?.notes || '' });
                    });
                } else if (!isNewFormat && specs) {
                    results = specs.results || [];
                }

                return (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6" dir="rtl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-secondary flex items-center gap-3">
                                <ShieldCheck className="text-primary" size={22} />سجل الفحص التقني
                            </h3>
                            <div className="hidden md:flex gap-4">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[10px] font-bold text-secondary/40 uppercase">شغال تمام</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-secondary/20" /><span className="text-[10px] font-bold text-secondary/40 uppercase">يحتاج مراجعة</span></div>
                            </div>
                        </div>

                        {results.length === 0 ? (
                            <div className="py-16 text-center border-2 border-dashed border-black/[0.03] rounded-3xl">
                                <p className="text-sm font-black text-secondary/40">مفيش فحوصات فنية مسجلة</p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block overflow-hidden rounded-3xl border border-black/[0.03] bg-white shadow-sm">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-black/[0.02] border-b border-black/[0.03]">
                                                <th className="px-6 py-4 text-[11px] font-black text-secondary/30 uppercase tracking-widest">المكون</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-secondary/30 uppercase tracking-widest text-center w-36">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((r: any, i: number) => {
                                                const ok = r.status === 'pass' || r.status === 'success';
                                                return (
                                                    <tr key={i} className="border-b border-black/[0.02] last:border-0 hover:bg-black/[0.01] transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn("p-2.5 rounded-xl transition-colors", ok ? "bg-primary/5 text-primary" : "bg-black/[0.03] text-secondary/30")}>
                                                                    {getComponentIcon(r.name || '', 16)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-secondary group-hover:text-primary transition-colors text-sm">{getComponentTitle(r.name || '')}</span>
                                                                    {r.message && <span className="text-[11px] text-secondary/40 font-medium mt-0.5" dir="ltr">{r.message}</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex justify-center">
                                                                {ok ? (
                                                                    <div className="bg-primary text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight shadow-sm flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />ناجح
                                                                    </div>
                                                                ) : (
                                                                    <div className={cn("px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight border", r.status === 'failure' || r.status === 'fail' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                                                                        {r.status === 'failure' || r.status === 'fail' ? 'فشل' : 'مراجعة'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="md:hidden space-y-2">
                                    {results.map((r: any, i: number) => {
                                        const ok = r.status === 'pass' || r.status === 'success';
                                        return (
                                            <div key={i} className="p-3 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", ok ? "bg-primary/5 text-primary" : "bg-black/[0.03] text-secondary/30")}>{getComponentIcon(r.name || '', 15)}</div>
                                                    <div className="min-w-0"><div className="font-bold text-secondary text-xs truncate">{getComponentTitle(r.name || '')}</div></div>
                                                </div>
                                                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", ok ? "bg-primary text-white" : "bg-black/[0.03] text-secondary/20 border border-black/[0.03]")}>
                                                    {ok ? <Check size={13} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </motion.div>
                );
            }

            case 4: return (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <h3 className="text-lg font-black text-secondary pr-4 border-r-4 border-primary">الفحص المتقدم والنتائج التقنية</h3>
                    <InternalInspectionSection stressResults={stressResults} hw={hw} interactiveMap={interactiveMap} specs={specs} />
                </motion.div>
            );

            case 5: return (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <h3 className="text-lg font-black text-secondary">المواصفات الفنية التفصيلية</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <SpecCard icon={<Cpu />} title="المعالج" main={hw?.cpu?.name || report.cpu || '—'}
                            details={hw?.cpu?.cores ? `${hw.cpu.cores} أنوية @ ${hw.cpu.base_speed_ghz} GHz` : null} />
                        <SpecCard icon={<Database />} title="الرامات" main={hw?.memory?.total_ram || report.ram || '—'}
                            details={hw?.memory?.type ? `${hw.memory.type} ${hw.memory.speed || ''}` : null} />
                        <SpecCard icon={<HardDrive />} title="التخزين" main={storageItem?.capacity || report.storage || '—'}
                            details={storageHealth ? `${storageType} · صحة ${storageHealth}` : storageType}
                            footer={storageItem ? (
                                <div className="mt-2 pt-2 border-t border-black/[0.03]">
                                    {storageItem.model && <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40"><span className="shrink-0">Model</span><span dir="ltr" className="truncate">{storageItem.model}</span></div>}
                                    {storageItem.firmware && <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40 mt-0.5"><span className="shrink-0">FW</span><span dir="ltr" className="truncate">{storageItem.firmware}</span></div>}
                                    {storageItem.health_percent != null && (
                                        <div className="mt-2 w-full h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full", storageItem.health_percent >= 80 ? "bg-emerald-500" : storageItem.health_percent >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${storageItem.health_percent}%` }} />
                                         </div>
                                    )}
                                </div>
                            ) : null}
                        />
                        <SpecCard icon={<Monitor />} title="كارت الشاشة" main={hw?.gpu?.[0]?.name || report.gpu || '—'}
                            details={hw?.gpu?.[0]?.vram ? `${hw.gpu[0].vram} VRAM` : null} />
                        {hw?.display && (
                            <SpecCard icon={<Monitor />} title="الشاشة" main={`${hw.display.resolution} @ ${hw.display.refresh_rate_hz}Hz`}
                                details={hw.display.size_inch ? `${hw.display.size_inch}"` : null} />
                        )}
                        {hw?.battery && (
                            <SpecCard icon={<Battery />} title="البطارية" main={hw.battery.health || report.battery_health || '—'}
                                details={hw.battery.cycle_count ? `${hw.battery.cycle_count} دورة شحن` : null}
                                footer={hw.battery.health_percentage != null ? (
                                    <div className="mt-2 pt-2 border-t border-black/[0.03] space-y-1">
                                        <div className="w-full h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all", hw.battery.health_percentage >= 80 ? "bg-emerald-500" : hw.battery.health_percentage >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${Math.min(hw.battery.health_percentage, 100)}%` }} />
                                        </div>
                                        {hw.battery.estimated_charge != null && (
                                            <div className="flex justify-between text-[10px] font-bold text-secondary/40">
                                                <span>الشحن الحالي</span><span dir="ltr">{hw.battery.estimated_charge}%</span>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            />
                        )}
                        {/* System OS & Motherboard SpecCard */}
                        {specs?.system && (
                            <SpecCard icon={<Layers />} title="نظام التشغيل واللوحة الأم" main={specs.system.os_name || 'Windows'}
                                details={specs.system.os_version ? `OS: ${specs.system.os_version}` : null}
                                footer={(
                                    <div className="mt-2 pt-2 border-t border-black/[0.03] space-y-1 text-right min-w-0">
                                        {specs.system.motherboard_product && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">Motherboard</span><span dir="ltr" className="truncate">{specs.system.motherboard_manufacturer || ''} {specs.system.motherboard_product}</span>
                                            </div>
                                        )}
                                        {specs.system.bios_version && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">BIOS</span><span dir="ltr" className="truncate">{specs.system.bios_vendor || ''} {specs.system.bios_version} ({specs.system.bios_mode || 'UEFI'})</span>
                                            </div>
                                        )}
                                        {specs.system.tpm_status && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">TPM Security</span><span dir="ltr" className="truncate">{specs.system.tpm_status}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        )}
                        {/* Network/Connectivity SpecCard */}
                        {(specs?.network || specs?.bluetooth) && (
                            <SpecCard icon={<Wifi />} title="الشبكة والاتصال" main={specs.network?.devices?.[0]?.name || 'Wi-Fi Adapter'}
                                details={specs.network?.wifi_signal_pct != null ? `قوة الإشارة: ${specs.network.wifi_signal_pct}%` : null}
                                footer={(
                                    <div className="mt-2 pt-2 border-t border-black/[0.03] space-y-1 text-right min-w-0">
                                        {specs.network?.devices?.[0]?.mac_address && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">MAC Address</span><span dir="ltr" className="font-mono truncate">{specs.network.devices[0].mac_address}</span>
                                            </div>
                                        )}
                                        {specs.bluetooth?.available && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">Bluetooth</span><span dir="ltr" className="truncate">مدعوم ({specs.bluetooth.paired_count || 0} أجهزة)</span>
                                            </div>
                                        )}
                                        {specs.network?.overview?.isp && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">ISP</span><span dir="ltr" className="truncate">{specs.network.overview.isp}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        )}
                        {/* Ports SpecCard */}
                        {specs?.ports && (
                            <SpecCard icon={<Usb />} title="المنافذ والملحقات" main={`المنافذ الخارجية: ${specs.ports.usb_count || 0} USB`}
                                details={specs.ports.thunderbolt_count !== undefined ? `متحكم Thunderbolt: ${specs.ports.thunderbolt_count}` : null}
                                footer={(
                                    <div className="mt-2 pt-2 border-t border-black/[0.03] space-y-1 text-right min-w-0">
                                        {specs.ports.biometric_devices?.length > 0 && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">بصمة / أمان</span><span dir="ltr" className="truncate">{specs.ports.biometric_devices[0].name}</span>
                                            </div>
                                        )}
                                        {specs.ports.audio_devices?.length > 0 && (
                                            <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40">
                                                <span className="shrink-0">كارت الصوت</span><span dir="ltr" className="truncate">{specs.ports.audio_devices[0].name}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        )}
                        {/* Secondary Storage SpecCard */}
                        {hw?.storage && hw.storage.length > 1 && (
                            <SpecCard icon={<HardDrive />} title="التخزين الثانوي" main={hw.storage[1].capacity || '—'}
                                details={hw.storage[1].health_percent != null ? `${hw.storage[1].model?.toLowerCase().includes('ssd') ? 'SSD' : (hw.storage[1].type || 'HDD')} · صحة ${hw.storage[1].health_percent}%` : (hw.storage[1].type || 'HDD')}
                                footer={(
                                    <div className="mt-2 pt-2 border-t border-black/[0.03] min-w-0">
                                        {hw.storage[1].model && <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40"><span className="shrink-0">Model</span><span dir="ltr" className="truncate">{hw.storage[1].model}</span></div>}
                                        {hw.storage[1].firmware && <div className="flex justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-secondary/40 mt-0.5"><span className="shrink-0">FW</span><span dir="ltr" className="truncate">{hw.storage[1].firmware}</span></div>}
                                        {hw.storage[1].health_percent != null && (
                                            <div className="mt-2 w-full h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full", hw.storage[1].health_percent >= 80 ? "bg-emerald-500" : hw.storage[1].health_percent >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${hw.storage[1].health_percent}%` }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        )}
                        {/* Secondary GPU SpecCard */}
                        {hw?.gpu && hw.gpu.length > 1 && (
                            <SpecCard icon={<Monitor />} title="كارت الشاشة الثانوي" main={hw.gpu[1].name || '—'}
                                details={hw.gpu[1].vram ? `${hw.gpu[1].vram} VRAM` : null} />
                        )}
                    </div>
                </motion.div>
            );

        case 6:
            return (
                <StepAccessories
                    products={products}
                    isLoadingProducts={isLoadingProducts}
                    cartItems={cartItems}
                    toggleCartItem={toggleCartItem}
                    calculateFinalTotal={calculateFinalTotal}
                    handleConfirmOrder={handleConfirmOrder}
                    isConfirmed={isConfirmed}
                />
            );

            case 7: {
                const invoices = report.invoices || [];
                const totalPaid = invoices.reduce((s: number, inv: any) => s + (parseFloat(inv.paid_amount) || 0), 0);
                const totalAmt = invoices.reduce((s: number, inv: any) => s + (parseFloat(inv.total_amount) || 0), 0);
                const finalTotalDetails = calculateFinalTotal();
                const paymentLabels: Record<string, string> = {
                    'cash': 'كاش عند الاستلام (للمندوب)',
                    'vodafone_cash': 'فودافون كاش - عند الاستلام',
                    'instapay': 'انستاباي - عند الاستلام'
                };
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" dir="rtl">

                        {/* ── Section 1: Order Summary ── */}
                        <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-4">
                            <h3 className="text-base font-black text-secondary flex items-center gap-3"><CreditCard size={18} className="text-primary/50" />ملخص الطلب</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                    <span className="text-sm font-bold text-secondary">{report.device_model || 'اللابتوب'}</span>
                                    <span className="text-sm font-black text-secondary">{(parseFloat(report.amount || 0)).toLocaleString()} ج.م</span>
                                </div>

                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-1.5 text-secondary/60 border-b border-black/[0.01]">
                                        <span className="text-xs font-bold flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            {item.name}
                                        </span>
                                        <span className="text-xs font-black">{(parseFloat(item.price || 0)).toLocaleString()} ج.م</span>
                                    </div>
                                ))}

                                <div className="pt-3 flex justify-between items-center text-secondary/50 text-xs">
                                    <span>الإجمالي الفرعي:</span>
                                    <span>{finalTotalDetails.baseTotal.toLocaleString()} ج.م</span>
                                </div>

                                {finalTotalDetails.fee > 0 && (
                                    <div className="flex justify-between items-center text-rose-500 text-xs">
                                        <span>الرسوم الإضافية{finalTotalDetails.feeReason}:</span>
                                        <span className="font-black">+{finalTotalDetails.fee.toLocaleString()} ج.م</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-black/[0.03] flex justify-between items-center">
                                    <span className="font-black text-secondary">الإجمالي المطلوب:</span>
                                    <span className="text-xl font-black text-primary">{finalTotalDetails.finalTotal.toLocaleString()} ج.م</span>
                                </div>

                                {isConfirmed && report?.payment_method && (
                                    <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                                        <CreditCard size={16} className="text-primary shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-primary text-[11px]">طريقة الدفع المختارة</h4>
                                            <p className="text-secondary/70 text-[11px] font-bold leading-relaxed">
                                                {paymentLabels[report.payment_method] || report.payment_method}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Section 2: Invoices (only if exist) ── */}
                        {invoices.length > 0 && (
                            <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-4">
                                <h3 className="text-base font-black text-secondary flex items-center gap-3"><CheckCircle2 size={18} className="text-primary/50" />الفواتير</h3>
                                <div className="space-y-3">
                                    {invoices.map((inv: any, i: number) => (
                                        <div key={i} className="p-3.5 bg-black/[0.02] rounded-2xl flex items-center justify-between border border-black/[0.02] gap-3">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">فاتورة</p>
                                                <p className="font-bold text-secondary font-mono text-sm">#{inv.invoice_number}</p>
                                            </div>
                                            <div className="text-left flex flex-col items-end gap-1">
                                                <p className="text-base md:text-lg font-black text-primary leading-none">{inv.total_amount} <span className="text-xs font-bold text-secondary/40">{report.currency || 'EGP'}</span></p>
                                                <span className={cn("text-[9px] font-black px-2.5 py-0.5 rounded-full border inline-block tracking-wider", inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100')}>{inv.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-black/[0.03] flex justify-between items-end gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">الإجمالي المدفوع</p>
                                            <p className="text-xl md:text-2xl font-black text-emerald-600">{totalPaid.toLocaleString()} <span className="text-xs md:text-sm font-bold text-secondary/40">{report.currency || 'EGP'}</span></p>
                                        </div>
                                        {totalAmt > totalPaid && (
                                            <div className="text-left flex flex-col items-end">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-0.5">المتبقي</p>
                                                <p className="text-base md:text-lg font-black text-rose-600">{(totalAmt - totalPaid).toLocaleString()} <span className="text-xs font-bold text-secondary/40">{report.currency || 'EGP'}</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Section 3: Confirmation & Actions ── */}
                        <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-5">
                            <div className="text-center space-y-2">
                                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h3 className="text-xl font-black text-secondary">إكمال العملية</h3>
                                <p className="text-xs text-secondary/50 font-medium">اعتماد التقرير أو إجراء العمليات التالية</p>
                            </div>

                            {!isConfirmed ? (
                                viewMode === 'admin' ? (
                                    <button onClick={async () => { try { await api.put(`/reports/${id}`, { status: 'COMPLETED' }); setIsConfirmed(true); } catch (e) {} }}
                                        className="w-full py-3.5 px-6 rounded-full bg-primary text-white font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                                        <CheckCircle2 size={16} />اعتماد التقرير النهائي
                                    </button>
                                ) : (
                                    <button onClick={handleConfirmOrder}
                                        className="w-full py-3.5 px-6 rounded-full bg-primary text-white font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                                        <CheckCircle2 size={16} />تأكيد الأوردر ومتابعة الشحن
                                    </button>
                                )
                            ) : (
                                <div className="py-3.5 px-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0"><Check size={16} /></div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-secondary">تم تأكيد الأوردر بنجاح</p>
                                            <p className="text-[11px] font-bold text-primary/60">
                                                {report.payment_method ? `طريقة الدفع: ${paymentLabels[report.payment_method] || report.payment_method}` : 'شكراً!'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isConfirmed && viewMode !== 'admin' && (
                                <button onClick={handleConfirmOrder}
                                    className="w-full py-3.5 px-6 rounded-full border border-black/[0.04] bg-white text-secondary hover:bg-black/[0.01] font-bold text-xs transition-all flex items-center justify-center gap-2">
                                    تعديل طريقة الدفع أو إعادة إرسال الأوردر
                                </button>
                            )}

                            {viewMode === 'admin' && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    {[
                                        { title: 'المخزن', desc: 'إضافة الجهاز', icon: <Package size={16} />, action: () => setWarehouseModalOpen(true) },
                                        { title: 'صيانة', desc: 'إرسال للفريق', icon: <Wrench size={16} />, action: () => setMaintenanceModalOpen(true) },
                                    ].map((item, i) => (
                                        <motion.button key={i} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={item.action}
                                            className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-white border border-black/[0.03] hover:border-primary/10 hover:shadow-sm transition-all">
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center">{item.icon}</div>
                                            <div className="text-center"><p className="text-xs font-bold text-secondary">{item.title}</p><p className="text-[9px] text-secondary/40">{item.desc}</p></div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            }

            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-secondary selection:bg-primary/5 selection:text-primary relative p-4 md:p-8 overflow-x-hidden">
            {/* Modals */}
            <Modal isOpen={warehouseModalOpen} onClose={() => setWarehouseModalOpen(false)} title="إضافة الجهاز للمخزن">
                <div className="space-y-6" dir="rtl">
                    <p className="text-secondary/60 text-sm">سيتم نقل الجهاز إلى ملكية Laapak وإضافته للمخزون. يرجى تحديد المصدر.</p>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary">مصدر الجهاز</label>
                        <Input placeholder="مثال: شراء من عميل، استيراد..." value={sourceDetails} onChange={(e) => setSourceDetails(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setWarehouseModalOpen(false)}>إلغاء</Button>
                        <Button onClick={handleAssignToWarehouse} disabled={isAssigning}>{isAssigning ? 'جاري...' : 'تأكيد الإضافة'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={maintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} title="إرسال للصيانة">
                <div className="space-y-6" dir="rtl">
                    <p className="text-secondary/60 text-sm">سيتم إنشاء تيكت صيانة. يرجى وصف المشكلة.</p>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary">المشكلة</label>
                        <textarea placeholder="مثال: الشاشة مكسورة، الرامات بتعلق..." value={maintenanceIssue} onChange={(e) => setMaintenanceIssue(e.target.value)} className="w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl p-4 text-sm font-bold h-28 resize-none focus:outline-none focus:border-primary/30" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setMaintenanceModalOpen(false)}>إلغاء</Button>
                        <Button onClick={handleMoveToMaintenance} disabled={isMovingToMaintenance} className="bg-amber-500 hover:bg-amber-600 text-white border-none">{isMovingToMaintenance ? 'جاري...' : 'إرسال للصيانة'}</Button>
                    </div>
                </div>
            </Modal>

            {/* Background blur blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/[0.015] rounded-full blur-[80px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-black/[0.02] rounded-full blur-[60px]" />
            </div>

            <div className="relative max-w-7xl mx-auto space-y-8 md:space-y-14">
                <header className="text-center">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-secondary leading-[1.1]">
                        تفاصيل <span className="text-primary">التقرير</span>
                    </h1>
                    <p className="text-secondary/40 font-bold mt-2">{hw?.summary?.model || report.device_model || ''}</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                    {/* Mobile step indicator */}
                    <div className="w-full lg:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-secondary">{steps.find(s => s.id === activeStep)?.title}</span>
                            <span className="text-xs font-black text-secondary/30 tabular-nums">{activeStep} / {steps.length}</span>
                        </div>
                        <div className="flex gap-1.5">
                            {steps.map(s => (
                                <button key={s.id} onClick={() => setActiveStep(s.id)} className={cn("h-1.5 rounded-full flex-1 transition-all duration-500", activeStep === s.id ? "bg-primary" : "bg-black/[0.06]")} />
                            ))}
                        </div>
                    </div>

                    {/* Desktop sidebar */}
                    <aside className="hidden lg:block lg:w-60 shrink-0 sticky top-24 space-y-2">
                        <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.5em] px-4 mb-4">إجراءات الفحص</p>
                        {steps.map(step => {
                            const isActive = activeStep === step.id;
                            return (
                                <button key={step.id} onClick={() => setActiveStep(step.id)}
                                    className={cn("w-full flex items-center gap-5 py-4 px-4 rounded-3xl transition-all duration-300 group relative text-right", isActive ? "bg-white shadow-sm border border-black/[0.03]" : "hover:bg-black/[0.01]")}>
                                    <span className={cn("text-lg font-black transition-colors", isActive ? "text-primary" : "text-secondary/20 group-hover:text-secondary/40")}>
                                        {step.id.toString().padStart(2, '0')}
                                    </span>
                                    <span className={cn("text-sm font-bold flex-1 transition-colors", isActive ? "text-secondary" : "text-secondary/40 group-hover:text-secondary/60")}>
                                        {step.title}
                                    </span>
                                    {isActive && <motion.div layoutId="sidebar-indicator" className="absolute left-4 w-1.5 h-6 bg-primary rounded-full" />}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Main content */}
                    <main className="w-full flex-1 min-w-0 pb-32">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep}>
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Floating bottom nav pill */}
                        <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 p-2 bg-white/90 backdrop-blur-3xl rounded-full border border-black/[0.04] shadow-lg z-50 w-[calc(100%-2rem)] md:w-auto max-w-sm justify-between md:justify-center">
                            {activeStep > 1 && (
                                <Button variant="ghost" className="rounded-full h-11 md:h-12 px-4 md:px-7 font-black hover:bg-black/[0.02] text-sm flex-1 md:flex-initial"
                                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}>
                                    <ChevronRight size={16} className="ml-1" />السابق
                                </Button>
                            )}
                            <div className="flex gap-1.5 px-2">
                                {steps.map(s => (
                                    <button key={s.id} onClick={() => setActiveStep(s.id)} className={cn("rounded-full transition-all duration-500", activeStep === s.id ? "bg-primary w-7 h-2.5" : "bg-black/[0.07] hover:bg-black/[0.12] w-2.5 h-2.5")} />
                                ))}
                            </div>
                            <Button className={cn("rounded-full h-11 md:h-12 px-5 md:px-9 font-black shadow-sm text-sm flex-1 md:flex-initial", activeStep === 1 && "flex-1")}
                                onClick={() => { if (activeStep < steps.length) setActiveStep(prev => prev + 1); else router.back(); }}>
                                {activeStep === steps.length ? 'إغلاق' : 'التالي'}{activeStep < steps.length && <ChevronLeft size={15} className="mr-1" />}
                            </Button>
                        </div>
                    </main>
                </div>
            </div>

            <ImageLightbox
                selectedImage={selectedImage}
                onClose={() => setSelectedImage(null)}
            />

            <PaymentSelectionModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                calculateFinalTotal={calculateFinalTotal}
                handleFinalConfirmation={handleFinalConfirmation}
            />
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InternalInspectionSection({ stressResults, hw, interactiveMap, specs }: { stressResults: any[]; hw: any; interactiveMap: Record<string, any>; specs: any }) {
    type AccItem = { key: string; component: string; hwData?: any; result?: any | null };

    const findStress = (kw: string) => stressResults.find((r: any) => (r.name || '').toLowerCase().includes(kw));

    const items: AccItem[] = [];
    if (hw?.cpu) items.push({ key: 'CPU', component: 'CPU', hwData: hw.cpu, result: findStress('cpu') });
    if (hw?.memory) items.push({ key: 'RAM', component: 'RAM', hwData: hw.memory, result: findStress('ram') });
    if (hw?.gpu?.length > 0) items.push({ key: 'GPU', component: 'GPU', hwData: hw.gpu, result: findStress('gpu') });
    if (hw?.storage?.length > 0) items.push({ key: 'Storage', component: 'Storage', hwData: hw.storage, result: findStress('disk') || findStress('storage') });
    if (hw?.battery) items.push({ key: 'Battery', component: 'Battery', hwData: hw.battery, result: null });
    if (hw?.display) items.push({ key: 'Display', component: 'Display', hwData: hw.display, result: null });
    if (specs?.network || specs?.bluetooth) items.push({ key: 'Network', component: 'Network', hwData: { network: specs.network, bluetooth: specs.bluetooth }, result: null });
    if (specs?.ports) items.push({ key: 'Ports', component: 'Ports', hwData: specs.ports, result: null });
    if (specs?.system) items.push({ key: 'System', component: 'System', hwData: specs.system, result: null });
    if (interactiveMap.keyboard !== undefined) items.push({ key: 'Keyboard', component: 'Keyboard', hwData: interactiveMap.keyboard, result: null });
    const otherInteractive = Object.fromEntries(Object.entries(interactiveMap).filter(([k]) => k !== 'keyboard'));
    if (Object.keys(otherInteractive).length > 0) items.push({ key: 'Interactive', component: 'Interactive', hwData: otherInteractive, result: null });

    const [openIndex, setOpenIndex] = useState<number | null>(items.length > 0 ? 0 : null);

    if (items.length === 0) {
        return (
            <div className="py-16 text-center border-2 border-dashed border-black/[0.03] rounded-3xl">
                <ImageIcon className="mx-auto mb-4 text-secondary/20" size={40} />
                <p className="text-sm font-black text-secondary/40">مفيش نتائج فحص تقني متاحة لهذا الجهاز</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                const r = item.result;
                const isPassed = r?.passed === true;
                const isFailed = r?.passed === false || r?.status === 'failed';
                const isIdle = r?.status === 'idle';
                const peakTemp: number = r?.max_temp || 0;
                const m = r?.metrics ?? {};
                const warnings: string[] = r?.warnings ?? [];
                const comp = item.component.toLowerCase();

                type Stat = { label: string; value: string; icon: React.ReactNode; iconColorClass?: string; valueColorClass?: string };
                const stats: Stat[] = [];

                if (comp === 'cpu') {
                    const cpu = specs?.cpu || item.hwData;
                    if (cpu?.name) stats.push({ label: 'المعالج', value: cpu.name, icon: <Cpu size={15} /> });
                    if (cpu?.physical_cores) stats.push({ label: 'الأنوية الحقيقية', value: `${cpu.physical_cores} Cores`, icon: <Layers size={15} /> });
                    if (cpu?.logical_cores) stats.push({ label: 'الأنوية الوهمية', value: `${cpu.logical_cores} Threads`, icon: <Activity size={15} /> });
                    if (cpu?.base_speed_ghz) stats.push({ label: 'التردد الأساسي', value: `${cpu.base_speed_ghz} GHz`, icon: <Zap size={15} /> });
                    if (cpu?.boost_speed_ghz) stats.push({ label: 'تردد Boost', value: `${cpu.boost_speed_ghz} GHz`, icon: <Zap size={15} /> });
                    if (cpu?.max_clock_speed) stats.push({ label: 'أقصى سرعة', value: `${cpu.max_clock_speed} MHz`, icon: <Zap size={15} /> });
                    if (cpu?.temperature_c) {
                        const temp = cpu.temperature_c;
                        const tempColor = temp > 85 ? 'text-rose-600' : temp > 70 ? 'text-amber-600' : 'text-emerald-600';
                        const iconColor = temp > 85 ? 'bg-rose-50 text-rose-600' : temp > 70 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600';
                        stats.push({
                            label: 'الحرارة الحالية',
                            value: `${temp}°C`,
                            icon: <Thermometer size={15} />,
                            iconColorClass: iconColor,
                            valueColorClass: tempColor
                        });
                    }
                    if (cpu?.l3_cache_mb) stats.push({ label: 'L3 Cache', value: `${cpu.l3_cache_mb} MB`, icon: <Database size={15} /> });
                    if (m.cpu_max_freq_ghz) stats.push({ label: 'أعلى تردد بالضغط', value: `${m.cpu_max_freq_ghz} GHz`, icon: <Zap size={15} /> });
                    if (m.cpu_avg_usage_pct != null) stats.push({ label: 'متوسط الحمل بالضغط', value: `${m.cpu_avg_usage_pct}%`, icon: <Activity size={15} /> });
                    if (peakTemp) {
                        stats.push({
                            label: 'أقصى حرارة تحت الاختبار',
                            value: `${peakTemp}°C`,
                            icon: <Thermometer size={15} />,
                            iconColorClass: 'bg-primary/5 text-primary',
                            valueColorClass: ''
                        });
                    }
                } else if (comp === 'ram') {
                    const mem = specs?.ram || item.hwData;
                    if (mem?.total) stats.push({ label: 'إجمالي السعة', value: `${mem.total} GB`, icon: <Database size={15} /> });
                    if (mem?.type) stats.push({ label: 'نوع الذاكرة', value: mem.type, icon: <Info size={15} /> });
                    if (mem?.speed_mhz) stats.push({ label: 'السرعة الفعلية', value: `${mem.speed_mhz} MHz`, icon: <Zap size={15} /> });
                    if (mem?.configured_voltage) stats.push({ label: 'الجهد الكهربائي', value: `${mem.configured_voltage} V`, icon: <Info size={15} /> });
                    if (m.ram_peak_bw_gbps != null) stats.push({ label: 'الباندويدث الأقصى', value: `${Number(m.ram_peak_bw_gbps).toFixed(1)} GB/s`, icon: <Zap size={15} /> });
                    if (m.ram_allocated_gb) stats.push({ label: 'الذاكرة المستهلكة', value: `${Number(m.ram_allocated_gb).toFixed(1)} GB`, icon: <Activity size={15} /> });
                    if (m.ram_error_count != null) {
                        if (m.ram_error_count === 0) {
                            stats.push({ label: 'نتيجة فحص الرامات', value: 'سليم', icon: <CheckCircle2 size={15} />, iconColorClass: 'bg-emerald-50 text-emerald-600', valueColorClass: 'text-emerald-600' });
                        } else {
                            stats.push({ label: 'ملاحظات على الرامات', value: `${m.ram_error_count}`, icon: <AlertTriangle size={15} />, iconColorClass: 'bg-amber-50 text-amber-600', valueColorClass: 'text-amber-600' });
                        }
                    }
                } else if (comp === 'gpu') {
                    const gpuDevs = specs?.gpu?.devices || item.hwData;
                    gpuDevs.forEach((g: any, gi: number) => {
                        const prefix = gpuDevs.length > 1 ? `${gi + 1}: ` : '';
                        if (g.name) stats.push({ label: `${prefix}كارت الشاشة`, value: g.name, icon: <Monitor size={15} /> });
                        if (g.vram_mb) stats.push({ label: `${prefix}ذاكرة VRAM`, value: `${g.vram_mb} MB`, icon: <Database size={15} /> });
                        if (g.driver_version) stats.push({ label: `${prefix}إصدار الدرايفر`, value: g.driver_version, icon: <Info size={15} /> });
                    });
                    if (m.gpu_usage_pct != null) stats.push({ label: 'مستوى الحمل', value: `${m.gpu_usage_pct}%`, icon: <Activity size={15} /> });
                    const gpuTemp = m.gpu_temp || peakTemp;
                    if (gpuTemp) {
                        stats.push({
                            label: 'درجة الحرارة تحت الحمل',
                            value: `${gpuTemp}°C`,
                            icon: <Thermometer size={15} />,
                            iconColorClass: 'bg-primary/5 text-primary',
                            valueColorClass: ''
                        });
                    }
                } else if (comp === 'storage') {
                    const drives = item.hwData || [];
                    const d = drives[0] || {};
                    if (d.model) stats.push({ label: 'القرص الأساسي', value: d.model, icon: <HardDrive size={15} /> });
                    if (d.capacity) stats.push({ label: 'سعة القرص', value: d.capacity, icon: <Database size={15} /> });
                    if (d.type) stats.push({ label: 'نوع القرص', value: d.type, icon: <Info size={15} /> });
                    if (d.health_percent != null) stats.push({ label: 'صحة القرص', value: `${Math.round(d.health_percent)}%`, icon: <ShieldCheck size={15} /> });
                    if (m.seq_read_mbps) stats.push({ label: 'سرعة القراءة Seq', value: `${Math.round(m.seq_read_mbps)} MB/s`, icon: <Zap size={15} /> });
                    if (m.write_throughput_mbps) stats.push({ label: 'سرعة الكتابة Seq', value: `${Math.round(m.write_throughput_mbps)} MB/s`, icon: <Activity size={15} /> });
                } else if (comp === 'battery') {
                    const b = specs?.battery?.devices?.[0] || item.hwData;
                    if (b.health_percentage != null) stats.push({ label: 'صحة البطارية', value: `${Number(b.health_percentage).toFixed(1)}%`, icon: <Battery size={15} /> });
                    if (b.cycle_count != null) stats.push({ label: 'دورات الشحن', value: `${b.cycle_count}`, icon: <RefreshCw size={15} /> });
                    if (b.chemistry) stats.push({ label: 'كيمياء البطارية', value: b.chemistry, icon: <Info size={15} /> });
                    if (b.manufacturer) stats.push({ label: 'الشركة المصنعة', value: b.manufacturer, icon: <Info size={15} /> });
                    if (b.design_capacity != null) stats.push({ label: 'السعة التصميمية', value: `${b.design_capacity} mWh`, icon: <Database size={15} /> });
                    if (b.full_charge_capacity != null) stats.push({ label: 'سعة الشحن الكامل', value: `${b.full_charge_capacity} mWh`, icon: <Zap size={15} /> });
                } else if (comp === 'display') {
                    const d = item.hwData;
                    if (d.resolution) stats.push({ label: 'الدقة', value: d.resolution, icon: <Monitor size={15} /> });
                    if (d.refresh_rate_hz) stats.push({ label: 'معدل التحديث', value: `${d.refresh_rate_hz}Hz`, icon: <Zap size={15} /> });
                    if (d.size_inch) stats.push({ label: 'الحجم القُطري', value: `${d.size_inch}"`, icon: <Info size={15} /> });
                } else if (comp === 'monitor') {
                    const mon = specs?.monitor;
                    if (mon?.count !== undefined) stats.push({ label: 'عدد الشاشات الخارجية', value: `${mon.count} شاشة`, icon: <Monitor size={15} /> });
                } else if (comp === 'network') {
                    const net = specs?.network;
                    const bt = specs?.bluetooth;
                    const activeDev = net?.devices?.[0];
                    if (activeDev?.name) stats.push({ label: 'بطاقة الواي فاي', value: activeDev.name, icon: <Wifi size={15} /> });
                    if (net?.wifi_signal_pct != null) stats.push({ label: 'قوة الإشارة', value: `${net.wifi_signal_pct}%`, icon: <Activity size={15} /> });
                    if (activeDev?.ip_address) stats.push({ label: 'عنوان IP الداخلي', value: activeDev.ip_address, icon: <Info size={15} /> });
                    if (activeDev?.mac_address) stats.push({ label: 'عنوان MAC', value: activeDev.mac_address, icon: <Info size={15} /> });
                    if (net?.overview?.isp) stats.push({ label: 'مزود الخدمة (ISP)', value: net.overview.isp, icon: <Layers size={15} /> });
                    if (net?.overview?.country) stats.push({ label: 'الموقع الجغرافي', value: `${net.overview.country} ${net.overview.city || ''}`, icon: <Layers size={15} /> });
                    if (bt?.available) stats.push({ label: 'البلوتوث', value: `متاح (${bt.paired_count || 0} أجهزة مقترنة)`, icon: <Bluetooth size={15} /> });
                } else if (comp === 'ports') {
                    const p = specs?.ports;
                    if (p?.usb_count !== undefined) stats.push({ label: 'أجهزة USB النشطة', value: `${p.usb_count} جهاز`, icon: <Usb size={15} /> });
                    if (p?.thunderbolt_count !== undefined) stats.push({ label: 'متحكمات Thunderbolt', value: `${p.thunderbolt_count} متحكم`, icon: <Zap size={15} /> });
                    if (p?.biometric_devices?.length > 0) stats.push({ label: 'مستشعر البصمة', value: p.biometric_devices[0].name, icon: <ShieldCheck size={15} /> });
                    if (p?.audio_devices?.length > 0) stats.push({ label: 'كارت الصوت', value: p.audio_devices[0].name, icon: <Activity size={15} /> });
                    if (p?.sdcard_devices?.length > 0) stats.push({ label: 'قارئ الكروت SD', value: p.sdcard_devices[0].status || 'نشط', icon: <Layers size={15} /> });
                } else if (comp === 'system') {
                    const sys = specs?.system;
                    if (sys?.os_name) stats.push({ label: 'نظام التشغيل', value: sys.os_name, icon: <Layers size={15} /> });
                    if (sys?.os_version) stats.push({ label: 'الإصدار', value: sys.os_version, icon: <Info size={15} /> });
                    if (sys?.bios_vendor) stats.push({ label: 'مطور الـ BIOS', value: sys.bios_vendor, icon: <Info size={15} /> });
                    if (sys?.bios_version) stats.push({ label: 'نسخة الـ BIOS', value: sys.bios_version, icon: <Info size={15} /> });
                    if (sys?.bios_mode) stats.push({ label: 'وضع الإقلاع BIOS', value: sys.bios_mode, icon: <Layers size={15} /> });
                    if (sys?.tpm_status) stats.push({ label: 'مستشعر الأمان TPM', value: sys.tpm_status, icon: <ShieldCheck size={15} /> });
                    if (sys?.secure_boot_enabled !== undefined) stats.push({ label: 'Secure Boot', value: sys.secure_boot_enabled ? 'مفعّل ✓' : 'معطّل ✗', icon: <ShieldCheck size={15} /> });
                    if (sys?.motherboard_manufacturer) stats.push({ label: 'اللوحة الأم', value: `${sys.motherboard_manufacturer} ${sys.motherboard_product || ''}`, icon: <Layers size={15} /> });
                    if (sys?.uptime_seconds) {
                        const hours = Math.round(sys.uptime_seconds / 3600);
                        stats.push({ label: 'مدة التشغيل الحالية', value: `${hours} ساعة`, icon: <Clock size={15} /> });
                    }
                } else if (comp === 'keyboard') {
                    const kb = item.hwData;
                    stats.push({ label: 'الحالة', value: kb?.passed ? 'سليم ✓' : 'خلل ✗', icon: <Keyboard size={15} /> });
                    if (kb?.missing_keys != null) stats.push({ label: 'مفاتيح ناقصة', value: `${kb.missing_keys}`, icon: <AlertTriangle size={15} /> });
                    if (kb?.tested_keys != null) stats.push({ label: 'مفاتيح مُفحوصة', value: `${kb.tested_keys}`, icon: <CheckCircle2 size={15} /> });
                }

                let badgeLabel: string;
                let dotCls: string;
                if (comp === 'keyboard') {
                    const kbPassed = item.hwData?.passed;
                    badgeLabel = kbPassed === true ? 'سليم' : kbPassed === false ? 'خلل' : 'INFO';
                    dotCls = kbPassed === true ? 'bg-emerald-500 border-emerald-600/20' : kbPassed === false ? 'bg-rose-500 border-rose-600/20' : 'bg-blue-500 border-blue-600/20';
                } else if (item.result) {
                    badgeLabel = 'تم الفحص';
                    dotCls = 'bg-emerald-500 border-emerald-600/20';
                } else {
                    badgeLabel = 'INFO';
                    dotCls = 'bg-blue-500 border-blue-600/20';
                }

                return (
                    <div key={idx} className={cn("bg-white border rounded-2xl overflow-hidden transition-all duration-300", isOpen ? "border-primary/10 shadow-sm" : "border-black/[0.03] hover:border-black/[0.06] shadow-sm")}>
                        <button onClick={() => setOpenIndex(isOpen ? null : idx)} className="w-full px-5 md:px-6 py-4 md:py-5 flex items-center justify-between group" dir="rtl">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isOpen ? "bg-primary text-white" : "bg-black/[0.02] text-secondary/30 group-hover:bg-primary/5 group-hover:text-primary")}>
                                    {getComponentIcon(item.component, 16)}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-secondary text-sm md:text-base">{getComponentTitle(item.component)}</p>
                                    <p className="text-[9px] text-primary/50 font-black uppercase tracking-wider mt-0.5">
                                        {item.result ? 'نتيجة اختبار الضغط' : 'بيانات الفحص التقني'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={cn("w-2.5 h-2.5 rounded-full border shadow-sm shrink-0", dotCls)} title={badgeLabel} />
                                <ChevronLeft size={18} className={cn("transition-transform duration-300 text-secondary/20", isOpen && "rotate-90 text-primary")} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                                    <div className="px-5 md:px-6 pb-7 pt-4 border-t border-black/[0.02]" dir="rtl">
                                        {/* Stress Test Summary Strip */}
                                        {item.result && (
                                            <div className="mb-4 p-3 rounded-xl border border-black/[0.03] bg-secondary/5 text-secondary flex items-center gap-2 text-sm text-right">
                                                <span className="text-emerald-600 shrink-0">{isPassed ? '✅' : '⚠️'}</span>
                                                <div>
                                                    <span className="font-bold text-xs">
                                                        {isPassed ? `تم اختبار ${getComponentTitle(item.component)} تحت أقصى ضغط للتأكد من ثباته — اجتاز الاختبار بنجاح` : `نتيجة اختبار ضغط ${getComponentTitle(item.component)}`}
                                                    </span>
                                                    {isPassed && peakTemp > 0 && (
                                                        <span className="text-[10px] text-secondary/50 mr-1 font-medium">
                                                            (وصلت الحرارة إلى {peakTemp}° تحت الحمل الكامل وهذا طبيعي)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Stat cards */}
                                        {stats.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                                                {stats.map((stat, si) => (
                                                    <TechStatCard
                                                        key={si}
                                                        label={stat.label}
                                                        value={stat.value}
                                                        icon={stat.icon}
                                                        color={stat.valueColorClass}
                                                        iconColorClass={stat.iconColorClass}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Storage health bar */}
                                        {comp === 'storage' && (() => {
                                            const drives = item.hwData || [];
                                            const d = drives[0] || {};
                                            return d.health_percent != null && (
                                                <div className="mb-5 p-4 bg-black/[0.02] rounded-2xl border border-black/[0.02]">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black text-secondary/30 uppercase tracking-wider">صحة القرص الأساسي</span>
                                                        <span className={cn("text-sm font-black", d.health_percent >= 80 ? "text-emerald-600" : d.health_percent >= 60 ? "text-amber-600" : "text-rose-600")}>
                                                            {Math.round(d.health_percent)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-secondary/10 rounded-full overflow-hidden">
                                                        <div className={cn("h-full rounded-full transition-all", d.health_percent >= 80 ? "bg-emerald-500" : d.health_percent >= 60 ? "bg-amber-500" : "bg-rose-500")}
                                                            style={{ width: `${Math.min(d.health_percent, 100)}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Multiple storage drives list */}
                                        {comp === 'storage' && Array.isArray(item.hwData) && item.hwData.length > 1 && (
                                            <div className="mb-5">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-2">جميع الأقراص</p>
                                                <div className="space-y-2">
                                                    {item.hwData.map((drive: any, di: number) => (
                                                        <div key={di} className="flex items-center justify-between p-3 bg-white border border-black/[0.03] rounded-xl shadow-sm">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/5 text-primary"><HardDrive size={14} /></div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-secondary">{drive.model || `Drive ${di + 1}`}</p>
                                                                    <p className="text-[10px] text-secondary/40 font-bold" dir="ltr">{drive.capacity} · {drive.type}</p>
                                                                </div>
                                                            </div>
                                                            <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border", (drive.health_percent ?? 100) >= 80 ? "bg-primary/5 text-primary border-primary/10" : (drive.health_percent ?? 100) >= 60 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                                                {drive.health_percent != null ? `${Math.round(drive.health_percent)}%` : drive.health_status || 'OK'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* CPU features / instruction sets */}
                                        {comp === 'cpu' && Array.isArray(specs?.cpu?.features) && specs.cpu.features.length > 0 && (
                                            <div className="mb-5 text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-2">تعليمات ومميزات المعالج (CPU Features)</p>
                                                <div className="flex flex-wrap gap-1.5 justify-start" dir="ltr">
                                                    {specs.cpu.features.map((feat: string, fi: number) => (
                                                        <Badge key={fi} variant="outline" className="bg-black/[0.01] border-black/[0.05] text-secondary/70 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                                                            {feat}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* RAM devices / slots */}
                                        {comp === 'ram' && Array.isArray(specs?.ram?.devices) && specs.ram.devices.length > 0 && (
                                            <div className="mb-5 text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-2">تفاصيل فتحات الذاكرة (Memory Slots)</p>
                                                <div className="space-y-2">
                                                    {specs.ram.devices.map((dev: any, di: number) => (
                                                        <div key={di} className="flex items-center justify-between p-3 bg-white border border-black/[0.03] rounded-xl shadow-sm">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/5 text-primary"><Database size={14} /></div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-bold text-secondary">{dev.locator || `Slot ${di + 1}`}</p>
                                                                    <p className="text-[10px] text-secondary/40 font-bold" dir="ltr">
                                                                        {dev.size_gb ? `${dev.size_gb} GB` : ''} {dev.manufacturer ? `· ${dev.manufacturer}` : ''} {dev.speed_mhz ? `· ${dev.speed_mhz} MHz` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {dev.type && (
                                                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full border bg-primary/5 text-primary border-primary/10" dir="ltr">
                                                                    {dev.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Multiple GPU devices list */}
                                        {comp === 'gpu' && Array.isArray(specs?.gpu?.devices) && specs.gpu.devices.length > 1 && (
                                            <div className="mb-5 text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-2">معالجات الرسوميات المتاحة (Graphics Cards)</p>
                                                <div className="space-y-2">
                                                    {specs.gpu.devices.map((g: any, gi: number) => (
                                                        <div key={gi} className="flex items-center justify-between p-3 bg-white border border-black/[0.03] rounded-xl shadow-sm">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/5 text-primary"><Monitor size={14} /></div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-bold text-secondary">{g.name || `GPU ${gi + 1}`}</p>
                                                                    {g.driver_version && <p className="text-[10px] text-secondary/40 font-bold" dir="ltr">Driver: {g.driver_version}</p>}
                                                                </div>
                                                            </div>
                                                            {g.vram_mb && (
                                                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full border bg-primary/5 text-primary border-primary/10" dir="ltr">
                                                                    {g.vram_mb} MB VRAM
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}



                                        {/* Battery health bar */}
                                        {comp === 'battery' && item.hwData?.health_percentage != null && (
                                            <div className="mb-5 p-4 bg-black/[0.02] rounded-2xl border border-black/[0.02]">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-secondary/30 uppercase tracking-wider">صحة البطارية</span>
                                                    <span className={cn("text-sm font-black", item.hwData.health_percentage >= 80 ? "text-emerald-600" : item.hwData.health_percentage >= 60 ? "text-amber-600" : "text-rose-600")}>
                                                        {Number(item.hwData.health_percentage).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-secondary/10 rounded-full overflow-hidden">
                                                    <div className={cn("h-full rounded-full transition-all", item.hwData.health_percentage >= 80 ? "bg-emerald-500" : item.hwData.health_percentage >= 60 ? "bg-amber-500" : "bg-rose-500")}
                                                        style={{ width: `${Math.min(item.hwData.health_percentage, 100)}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Battery degradation comparison */}
                                        {comp === 'battery' && (item.hwData?.design_capacity != null || item.hwData?.full_charge_capacity != null) && (
                                            <div className="mb-5 grid grid-cols-2 gap-3 text-right">
                                                <div className="p-3 bg-black/[0.01] border border-black/[0.02] rounded-xl text-center">
                                                    <span className="text-[9px] font-bold text-secondary/30 uppercase tracking-wider">السعة الأصلية (Design)</span>
                                                    <p className="text-sm font-black text-secondary mt-0.5" dir="ltr">{item.hwData.design_capacity || '—'} mWh</p>
                                                </div>
                                                <div className="p-3 bg-black/[0.01] border border-black/[0.02] rounded-xl text-center">
                                                    <span className="text-[9px] font-bold text-secondary/30 uppercase tracking-wider">السعة القصوى (Full Charge)</span>
                                                    <p className="text-sm font-black text-secondary mt-0.5" dir="ltr">{item.hwData.full_charge_capacity || '—'} mWh</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bluetooth paired devices list */}
                                        {comp === 'network' && Array.isArray(specs?.bluetooth?.paired_devices) && specs.bluetooth.paired_devices.length > 0 && (
                                            <div className="mb-5 text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-2">الأجهزة المقترنة بالبلوتوث (Paired Bluetooth Devices)</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {specs.bluetooth.paired_devices.map((device: any, di: number) => (
                                                        <div key={di} className="flex items-center gap-2.5 p-3 bg-white border border-black/[0.03] rounded-xl shadow-sm text-right">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/5 text-primary shrink-0"><Bluetooth size={14} /></div>
                                                            <div className="min-w-0 text-right">
                                                                <p className="text-xs font-bold text-secondary truncate">{device.name || 'Unnamed Device'}</p>
                                                                <p className="text-[9px] text-secondary/40 font-mono" dir="ltr">{device.address || ''}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* External Monitors Grid */}
                                        {comp === 'monitor' && Array.isArray(specs?.monitor?.devices) && specs.monitor.devices.length > 0 && (
                                            <div className="mb-5 text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-2">تفاصيل الشاشات الخارجية (Connected External Displays)</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {specs.monitor.devices.map((mon: any, mi: number) => (
                                                        <div key={mi} className="bg-white p-4 border border-black/[0.03] rounded-2xl shadow-sm flex flex-col gap-3 text-right">
                                                            <div className="flex items-center gap-2.5 text-secondary">
                                                                <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><Monitor size={15} /></div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-black text-secondary">{mon.name || `Monitor ${mi + 1}`}</p>
                                                                    <p className="text-[9px] text-secondary/40 font-bold" dir="ltr">
                                                                        {mon.diagonal_inches ? `${mon.diagonal_inches}"` : ''} {mon.refresh_rate_hz ? `· ${mon.refresh_rate_hz}Hz` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.02]">
                                                                <div className="text-center">
                                                                    <span className="text-[8px] font-bold text-secondary/30 block">الدقة الأصلية</span>
                                                                    <span className="text-xs font-black text-secondary" dir="ltr">{mon.native_resolution || '—'}</span>
                                                                </div>
                                                                <div className="text-center">
                                                                    <span className="text-[8px] font-bold text-secondary/30 block">أبعاد الشاشة</span>
                                                                    <span className="text-xs font-black text-secondary" dir="ltr">
                                                                        {mon.width_cm && mon.height_cm ? `${mon.width_cm}x${mon.height_cm} cm` : '—'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Interactive tests (non-keyboard) */}
                                        {comp === 'interactive' && item.hwData && (
                                            <div className="mb-5 space-y-2">
                                                {Object.entries(item.hwData).map(([key, val]: [string, any]) => (
                                                    <div key={key} className="flex items-center justify-between p-3 bg-white border border-black/[0.03] rounded-xl shadow-sm text-right">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", val?.passed ? "bg-primary/5 text-primary" : "bg-rose-50 text-rose-500")}>{getComponentIcon(key, 14)}</div>
                                                            <span className="text-sm font-bold text-secondary">{getComponentTitle(key)}</span>
                                                        </div>
                                                        <span className={cn("text-[10px] font-black px-3 py-1 rounded-full border", val?.passed ? "bg-primary/5 text-primary border-primary/10" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                                            {val?.passed ? 'ناجح' : 'فشل'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Description */}
                                        <div className="p-4 md:p-5 rounded-2xl bg-black/[0.02] border border-black/[0.02]">
                                            <h5 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-2">شرح تفصيلي</h5>
                                            <p className="text-secondary/60 text-sm leading-relaxed font-medium">{getTestDescription(item.component)}</p>
                                        </div>


                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

function TechStatCard({ label, value, icon, color, iconColorClass }: { label: string; value: string; icon: React.ReactNode; color?: string; iconColorClass?: string }) {
    return (
        <div className="p-3 md:p-4 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-center gap-3 min-w-0">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconColorClass || "bg-primary/5 text-primary")}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-secondary/30 uppercase tracking-wider mb-0.5 truncate">{label}</p>
                <p className={cn("text-xs font-black truncate", color || "text-secondary")} dir="ltr" title={value}>{value}</p>
            </div>
        </div>
    );
}

function SpecCard({ icon, title, main, details, footer }: { icon: React.ReactNode; title: string; main: string; details: string | null; footer?: React.ReactNode }) {
    return (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/[0.03] shadow-sm flex flex-col gap-3 sm:gap-4 group hover:border-primary/15 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2.5 sm:gap-3 text-secondary/30 group-hover:text-primary transition-colors">
                <div className="p-2 sm:p-2.5 bg-black/[0.02] rounded-lg sm:rounded-xl group-hover:bg-primary/5 transition-colors shrink-0">{icon}</div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em]">{title}</span>
            </div>
            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                <p className="font-black text-secondary text-sm sm:text-lg md:text-xl leading-tight text-left truncate" dir="ltr">{main}</p>
                {details && <p className="text-[10px] sm:text-[11px] font-bold text-secondary/40 text-left truncate" dir="ltr">{details}</p>}
            </div>
            {footer}
        </div>
    );
}
