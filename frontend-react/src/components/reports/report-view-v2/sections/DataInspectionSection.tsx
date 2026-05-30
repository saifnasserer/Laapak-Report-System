import React, { useState } from 'react';
import {
    Cpu,
    Layers,
    Activity,
    Zap,
    Thermometer,
    Database,
    Info,
    AlertTriangle,
    Monitor as MonitorIcon,
    HardDrive,
    ShieldCheck,
    Battery,
    RefreshCw,
    Keyboard,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Usb,
    Image as ImageIcon
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getComponentIcon, getComponentTitle, getTestDescription } from '../utils';
import { TechStatCard } from './TechStatCard';

interface DataInspectionSectionProps {
    stressResults: any[];
    hw: any;
    interactiveMap: Record<string, any>;
}

export function DataInspectionSection({ stressResults, hw, interactiveMap }: DataInspectionSectionProps) {
    type AccItem = { key: string; component: string; hwData?: any; result?: any | null };

    const findStress = (kw: string) => stressResults.find((r: any) => (r.name || '').toLowerCase().includes(kw));

    const items: AccItem[] = [];
    if (hw?.cpu) items.push({ key: 'CPU', component: 'CPU', hwData: hw.cpu, result: findStress('cpu') });
    if (hw?.memory) items.push({ key: 'RAM', component: 'RAM', hwData: hw.memory, result: findStress('ram') });
    if (hw?.gpu?.length > 0) items.push({ key: 'GPU', component: 'GPU', hwData: hw.gpu, result: findStress('gpu') });
    if (hw?.storage?.length > 0) items.push({ key: 'Storage', component: 'Storage', hwData: hw.storage, result: findStress('disk') || findStress('storage') });
    if (hw?.battery) items.push({ key: 'Battery', component: 'Battery', hwData: hw.battery, result: null });
    if (hw?.display) items.push({ key: 'Display', component: 'Display', hwData: hw.display, result: null });
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

                type Stat = { label: string; value: string; icon: React.ReactNode };
                const stats: Stat[] = [];

                if (comp === 'cpu') {
                    const cpu = item.hwData;
                    if (cpu?.name) stats.push({ label: 'المعالج', value: cpu.name, icon: <Cpu size={15} /> });
                    if (cpu?.cores) stats.push({ label: 'الأنوية', value: `${cpu.cores} Core`, icon: <Layers size={15} /> });
                    if (cpu?.threads) stats.push({ label: 'الخيوط', value: `${cpu.threads} Thread`, icon: <Activity size={15} /> });
                    if (cpu?.base_speed_ghz) stats.push({ label: 'التردد الأساسي', value: `${cpu.base_speed_ghz} GHz`, icon: <Zap size={15} /> });
                    if (m.cpu_max_freq_ghz) stats.push({ label: 'أعلى تردد', value: `${m.cpu_max_freq_ghz} GHz`, icon: <Zap size={15} /> });
                    if (m.cpu_avg_usage_pct != null) stats.push({ label: 'متوسط الحمل', value: `${m.cpu_avg_usage_pct}%`, icon: <Activity size={15} /> });
                    if (peakTemp) stats.push({ label: 'ذروة الحرارة', value: `${peakTemp}°C`, icon: <Thermometer size={15} /> });
                } else if (comp === 'ram') {
                    const mem = item.hwData;
                    if (mem?.total_ram) stats.push({ label: 'السعة', value: mem.total_ram, icon: <Database size={15} /> });
                    if (mem?.type) stats.push({ label: 'النوع', value: mem.type, icon: <Info size={15} /> });
                    if (mem?.speed) stats.push({ label: 'السرعة', value: mem.speed, icon: <Zap size={15} /> });
                    if (m.ram_peak_bw_gbps != null) stats.push({ label: 'الباندويدث', value: `${Number(m.ram_peak_bw_gbps).toFixed(1)} GB/s`, icon: <Zap size={15} /> });
                    if (m.ram_allocated_gb) stats.push({ label: 'المخصص', value: `${Number(m.ram_allocated_gb).toFixed(1)} GB`, icon: <Activity size={15} /> });
                    if (m.ram_error_count != null) stats.push({ label: 'أخطاء', value: `${m.ram_error_count}`, icon: <AlertTriangle size={15} /> });
                } else if (comp === 'gpu') {
                    const gpus: any[] = item.hwData;
                    const g = gpus[0] || {};
                    if (g.name) stats.push({ label: 'كارت الشاشة', value: g.name, icon: <MonitorIcon size={15} /> });
                    if (g.vram) stats.push({ label: 'VRAM', value: g.vram, icon: <Database size={15} /> });
                    if (g.driver_version) stats.push({ label: 'الدرايفر', value: g.driver_version, icon: <Info size={15} /> });
                    if (gpus.length > 1) stats.push({ label: 'إجمالي', value: `${gpus.length} كارت`, icon: <Layers size={15} /> });
                    if (m.gpu_usage_pct != null) stats.push({ label: 'الحمل', value: `${m.gpu_usage_pct}%`, icon: <Activity size={15} /> });
                    if (m.gpu_temp || peakTemp) stats.push({ label: 'الحرارة', value: `${m.gpu_temp || peakTemp}°C`, icon: <Thermometer size={15} /> });
                } else if (comp === 'storage') {
                    const drives: any[] = (item.hwData || []).filter((d: any) => d.type?.toLowerCase() !== 'usb' && !String(d.model || '').toLowerCase().includes('usb'));
                    const d = drives[0] || {};
                    if (d.model) stats.push({ label: 'القرص', value: d.model, icon: <HardDrive size={15} /> });
                    if (d.capacity) stats.push({ label: 'السعة', value: d.capacity, icon: <Database size={15} /> });
                    if (d.type) stats.push({ label: 'النوع', value: d.type, icon: <Info size={15} /> });
                    if (d.health_percent != null) stats.push({ label: 'الصحة', value: `${Math.round(d.health_percent)}%`, icon: <ShieldCheck size={15} /> });
                    if (m.seq_read_mbps) stats.push({ label: 'قراءة Seq', value: `${Math.round(m.seq_read_mbps)} MB/s`, icon: <Zap size={15} /> });
                    if (m.write_throughput_mbps) stats.push({ label: 'كتابة', value: `${Math.round(m.write_throughput_mbps)} MB/s`, icon: <Activity size={15} /> });
                } else if (comp === 'battery') {
                    const b = item.hwData;
                    if (b.health_percentage) stats.push({ label: 'الصحة', value: `${Number(b.health_percentage).toFixed(1)}%`, icon: <Battery size={15} /> });
                    if (b.estimated_charge != null) stats.push({ label: 'الشحن الحالي', value: `${b.estimated_charge}%`, icon: <Zap size={15} /> });
                } else if (comp === 'display') {
                    const d = item.hwData;
                    if (d.resolution) stats.push({ label: 'الدقة', value: d.resolution, icon: <MonitorIcon size={15} /> });
                    if (d.refresh_rate_hz) stats.push({ label: 'معدل التحديث', value: `${d.refresh_rate_hz}Hz`, icon: <Zap size={15} /> });
                    if (d.size_inch) stats.push({ label: 'الحجم', value: `${d.size_inch}"`, icon: <Info size={15} /> });
                } else if (comp === 'keyboard') {
                    const kb = item.hwData;
                    stats.push({ label: 'الحالة', value: kb?.passed ? 'سليم ✓' : 'خلل ✗', icon: <Keyboard size={15} /> });
                    if (kb?.missing_keys != null) stats.push({ label: 'مفاتيح ناقصة', value: `${kb.missing_keys}`, icon: <AlertTriangle size={15} /> });
                    if (kb?.tested_keys != null) stats.push({ label: 'مفاتيح مُفحوصة', value: `${kb.tested_keys}`, icon: <CheckCircle2 size={15} /> });
                }

                let badgeLabel: string;
                let badgeCls: string;
                if (comp === 'keyboard') {
                    const kbPassed = item.hwData?.passed;
                    badgeLabel = kbPassed === true ? 'سليم' : kbPassed === false ? 'خلل' : 'INFO';
                    badgeCls = kbPassed === true ? 'bg-primary/5 text-primary border-primary/10' : kbPassed === false ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100';
                } else if (item.result) {
                    badgeLabel = isIdle ? 'لم يُشغَّل' : isPassed ? 'PASSED' : isFailed ? 'FAILED' : 'CHECKED';
                    badgeCls = isIdle ? 'bg-secondary/10 text-secondary/40 border-secondary/10' : isPassed ? 'bg-primary/5 text-primary border-primary/10' : isFailed ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100';
                } else {
                    badgeLabel = 'INFO';
                    badgeCls = 'bg-blue-50 text-blue-600 border-blue-100';
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
                                <span className={cn("hidden md:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border", badgeCls)}>{badgeLabel}</span>
                                <ChevronLeft size={18} className={cn("transition-transform duration-300 text-secondary/20", isOpen && "rotate-90 text-primary")} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                                    <div className="px-5 md:px-6 pb-7 pt-4 border-t border-black/[0.02]" dir="rtl">
                                        {stats.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                                                {stats.map((stat, si) => (
                                                    <TechStatCard key={si} label={stat.label} value={stat.value} icon={stat.icon} />
                                                ))}
                                            </div>
                                        )}

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

                                        {item.result && (r?.duration || peakTemp > 0) && (
                                            <div className="flex flex-wrap gap-2 mb-5">
                                                {r?.duration && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.03] text-xs font-bold text-secondary/60" dir="ltr">
                                                        <Clock size={11} /> {r.duration}
                                                    </span>
                                                )}
                                                {peakTemp > 0 && (
                                                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold", peakTemp > 85 ? "bg-rose-50 text-rose-600" : peakTemp > 70 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")} dir="ltr">
                                                        <Thermometer size={11} /> {peakTemp}°C Peak
                                                    </span>
                                                )}
                                            </div>
                                        )}

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

                                        {comp === 'interactive' && item.hwData && (
                                            <div className="mb-5 space-y-2">
                                                {Object.entries(item.hwData).map(([key, val]: [string, any]) => (
                                                    <div key={key} className="flex items-center justify-between p-3 bg-white border border-black/[0.03] rounded-xl shadow-sm">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", val?.passed ? "bg-primary/5 text-primary" : "bg-rose-50 text-rose-500")}>{getComponentIcon(key, 14)}</div>
                                                            <span className="text-sm font-bold text-secondary">{getComponentTitle(key)}</span>
                                                        </div>
                                                        <span className={cn("text-[10px] font-black px-3 py-1 rounded-full border", val?.passed ? "bg-primary/5 text-primary border-primary/10" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                                            {val?.passed ? 'ناجح' : 'فشل'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="p-4 md:p-5 rounded-2xl bg-black/[0.02] border border-black/[0.02]">
                                            <h5 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-2">شرح تفصيلي</h5>
                                            <p className="text-secondary/60 text-sm leading-relaxed font-medium">{getTestDescription(item.component)}</p>
                                        </div>

                                        {warnings.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {warnings.map((w, wi) => (
                                                    <div key={wi} className="flex items-start gap-2.5 p-3 bg-amber-50/60 border border-amber-100/60 rounded-xl">
                                                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                        <p className="text-[11px] font-bold text-amber-800/70 leading-relaxed">{w}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
export default DataInspectionSection;
