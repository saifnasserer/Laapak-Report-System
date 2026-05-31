import React from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    TrendingUp,
    Sparkles,
    Copy,
    Check,
    ExternalLink,
    User,
    Smartphone,
    Cpu,
    Layers,
    Activity,
    Database,
    ShieldCheck,
    Battery,
    Monitor,
    HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getGradeColor } from '../utils';
import ReportHistorySection from '../sections/ReportHistorySection';

interface StepDataAndSpecsProps {
    report: any;
    agentData: any;
    hw: any;
    bsodCount: number;
    hasRecentCrash: boolean;
    diagScore: number;
    diagBreakdown: any;
    showConfetti: boolean;
    setShowConfetti: (val: boolean) => void;
    viewMode: 'admin' | 'client' | 'public';
    isCopied: boolean;
    setIsCopied: (val: boolean) => void;
}

export function StepDataAndSpecs({
    report,
    agentData,
    hw,
    bsodCount,
    hasRecentCrash,
    diagScore,
    diagBreakdown,
    showConfetti,
    setShowConfetti,
    viewMode,
    isCopied,
    setIsCopied
}: StepDataAndSpecsProps) {
    const handleCopy = () => {
        if (report.tracking_code) {
            navigator.clipboard.writeText(report.tracking_code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-right"
            dir="rtl"
        >
            {hasRecentCrash && (
                <div className="p-4 md:p-6 rounded-3xl bg-rose-50 border border-rose-100 flex items-start gap-4">
                    <AlertTriangle className="text-rose-500 shrink-0 mt-1 animate-pulse" size={24} />
                    <div className="space-y-1">
                        <h4 className="font-black text-rose-800 text-sm md:text-base">تنبيه: تم اكتشاف شاشات زرقاء (BSOD)</h4>
                        <p className="text-rose-700/80 text-xs md:text-sm leading-relaxed font-bold">
                            الجهاز ده سجل {bsodCount} شاشات زرقاء مؤخراً. الفحص التقني التلقائي سجل انهيار في النظام، وبننصح بمراجعة اختبارات الضغط كويس عشان تتأكد إن مفيش مشكلة في الهاردوير.
                        </p>
                    </div>
                </div>
            )}

            {(report.status === 'completed' || report.status === 'مكتمل') && (
                <div className="p-4 md:p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 text-white shadow-md">
                        <Sparkles size={22} className="animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="space-y-0.5">
                        <h4 className="font-black text-emerald-800 text-sm md:text-base">مبروك! تقرير الفحص مكتمل</h4>
                        <p className="text-emerald-700/80 text-xs md:text-sm font-bold">كل الاختبارات تمت والجهاز جاهز وتمام التمام.</p>
                    </div>
                </div>
            )}

            {(report.status === 'shipped' || report.status === 'تم الشحن') && (
                <div className="p-4 md:p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 text-white shadow-md">
                            <TrendingUp size={22} />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="font-black text-indigo-800 text-sm md:text-base">الجهاز تم شحنه للعميل!</h4>
                            <p className="text-indigo-700/80 text-xs md:text-sm font-bold">
                                {report.tracking_method === 'bosta' ? 'بواسطة بوسطة' : report.tracking_method === 'redbox' ? 'بواسطة ردبوكس' : 'بواسطة شركة الشحن'}
                            </p>
                        </div>
                    </div>
                    {report.tracking_code && (
                        <div className="flex items-center gap-2 bg-white/80 p-2 rounded-2xl border border-indigo-100/50 self-start md:self-auto">
                            <span className="text-xs font-black text-secondary/60 px-2 select-all" dir="ltr">{report.tracking_code}</span>
                            <button
                                onClick={handleCopy}
                                className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                            >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            {report.tracking_method === 'bosta' && (
                                <a
                                    href={`https://tracking.bosta.co/tracker/${report.tracking_code}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-black text-secondary flex items-center gap-3 mb-6">
                            <User className="text-primary/50" size={18} />
                            بيانات العميل والطلب
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                <span className="text-xs font-bold text-secondary/40">اسم العميل</span>
                                <span className="text-sm font-bold text-secondary">{report.client_name || 'عميل كاش'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                <span className="text-xs font-bold text-secondary/40">رقم الهاتف</span>
                                <span className="text-sm font-bold text-secondary" dir="ltr">{report.client_phone || '—'}</span>
                            </div>
                            {report.invoice_code && (
                                <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                    <span className="text-xs font-bold text-secondary/40">رقم الفاتورة</span>
                                    <span className="text-sm font-black text-primary" dir="ltr">{report.invoice_code}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs font-bold text-secondary/40">طريقة الدفع المقررة</span>
                                <span className="text-sm font-black text-secondary">
                                    {report.payment_method === 'cash' ? 'كاش عند الاستلام' :
                                        report.payment_method === 'vodafone_cash' ? 'فودافون كاش' :
                                            report.payment_method === 'instapay' ? 'انستاباي' : 'غير محدد'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-black text-secondary flex items-center gap-3 mb-6">
                            <Smartphone className="text-primary/50" size={18} />
                            هوية اللابتوب
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                <span className="text-xs font-bold text-secondary/40">الموديل</span>
                                <span className="text-sm font-black text-secondary">{report.device_model}</span>
                            </div>
                            {report.serial_number && (
                                <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                    <span className="text-xs font-bold text-secondary/40">الرقم التسلسلي S/N</span>
                                    <span className="text-sm font-black text-secondary select-all font-mono" dir="ltr">{report.serial_number}</span>
                                </div>
                            )}
                            {report.device_color && (
                                <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                    <span className="text-xs font-bold text-secondary/40">اللون</span>
                                    <span className="text-sm font-bold text-secondary">{report.device_color}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs font-bold text-secondary/40">السعر</span>
                                <span className="text-base font-black text-primary">{(parseFloat(report.amount || 0)).toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {hw && (
                <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm">
                    <h3 className="text-base font-black text-secondary mb-6">مواصفات الجهاز المكتشفة</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hw.cpu && (
                            <div className="p-4 rounded-2xl bg-black/[0.01] border border-black/[0.02] flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><Cpu size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-secondary/30 uppercase">المعالج CPU</p>
                                    <p className="text-xs font-bold text-secondary mt-1">{hw.cpu.name}</p>
                                    {hw.cpu.cores && <p className="text-[9px] text-secondary/40 mt-0.5 font-bold">{hw.cpu.cores} أنوية ({hw.cpu.threads} خيط)</p>}
                                </div>
                            </div>
                        )}
                        {hw.gpu && hw.gpu.length > 0 && (
                            <div className="p-4 rounded-2xl bg-black/[0.01] border border-black/[0.02] flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><Monitor size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-secondary/30 uppercase">كارت الشاشة GPU</p>
                                    <p className="text-xs font-bold text-secondary mt-1">{hw.gpu[0].name}</p>
                                    {hw.gpu[0].vram && <p className="text-[9px] text-secondary/40 mt-0.5 font-bold">VRAM: {hw.gpu[0].vram}</p>}
                                </div>
                            </div>
                        )}
                        {hw.memory && (
                            <div className="p-4 rounded-2xl bg-black/[0.01] border border-black/[0.02] flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><Database size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-secondary/30 uppercase">الرامات RAM</p>
                                    <p className="text-xs font-bold text-secondary mt-1">{hw.memory.total_ram}</p>
                                    {hw.memory.type && <p className="text-[9px] text-secondary/40 mt-0.5 font-bold">{hw.memory.type} · {hw.memory.speed}</p>}
                                </div>
                            </div>
                        )}
                        {hw.storage && hw.storage.length > 0 && (
                            <div className="p-4 rounded-2xl bg-black/[0.01] border border-black/[0.02] flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><HardDrive size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-secondary/30 uppercase">وحدات التخزين</p>
                                    <p className="text-xs font-bold text-secondary mt-1">{hw.storage[0].model}</p>
                                    <p className="text-[9px] text-secondary/40 mt-0.5 font-bold">{hw.storage[0].capacity} · {hw.storage[0].type}</p>
                                </div>
                            </div>
                        )}
                        {hw.battery && (
                            <div className="p-4 rounded-2xl bg-black/[0.01] border border-black/[0.02] flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><Battery size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-secondary/30 uppercase">البطارية Battery</p>
                                    <p className="text-xs font-bold text-secondary mt-1">صحة البطارية: {Number(hw.battery.health_percentage).toFixed(1)}%</p>
                                </div>
                            </div>
                        )}
                        {hw.display && (
                            <div className="p-4 rounded-2xl bg-black/[0.01] border border-black/[0.02] flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><Monitor size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-secondary/30 uppercase">الشاشة Display</p>
                                    <p className="text-xs font-bold text-secondary mt-1">{hw.display.resolution}</p>
                                    {hw.display.refresh_rate_hz && <p className="text-[9px] text-secondary/40 mt-0.5 font-bold">{hw.display.refresh_rate_hz}Hz · {hw.display.size_inch}"</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            <ReportHistorySection history={report.history} />
        </motion.div>
    );
}
export default StepDataAndSpecs;
