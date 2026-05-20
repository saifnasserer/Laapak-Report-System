import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import {
    ChevronLeft,
    Search,
    Zap,
    RefreshCw,
    Battery,
    Cpu,
    Thermometer,
    Database,
    ShieldCheck,
    HardDrive,
    Monitor as MonitorIcon,
    Monitor,
    Usb,
    CheckCircle2,
    Image as ImageIcon
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getComponentIcon, getComponentTitle, getTestDescription } from '../utils';
import { TechStatCard } from './TechStatCard';

interface InternalInspectionSectionProps {
    report: any;
    agentData: any;
    onImageClick: (url: string) => void;
}

export function InternalInspectionSection({ report, agentData, onImageClick }: InternalInspectionSectionProps) {
    let media = [];
    try {
        media = typeof report.external_images === 'string' ? JSON.parse(report.external_images) : (report.external_images || []);
    } catch (e) { }

    const testScreenshots = media.filter((m: any) => m.type === 'test_screenshot');

    let hStatus: any[] = [];
    try {
        hStatus = typeof report.hardware_status === 'string' ? JSON.parse(report.hardware_status) : (report.hardware_status || []);
    } catch (e) { }

    const agentTechMap: any = agentData ? {
        Info: agentData.system,
        CPU: agentData.cpu,
        GPU: agentData.gpu,
        Battery: agentData.battery,
        Storage: agentData.storage,
        Display: agentData.display,
        Keyboard: agentData.keyboard,
        Touchpad: agentData.touchpad,
        Wifi: agentData.network,
        Bluetooth: agentData.bluetooth,
        Ports: agentData.ports,
        DxDiag: agentData.diagnosis
    } : {};

    const getItem = (comp: string) => {
        const screenshot = testScreenshots.find((s: any) => (s.component || s.name || '').toLowerCase() === comp.toLowerCase());
        const statusItem = hStatus.find((h: any) => h.componentName?.toLowerCase() === comp.toLowerCase());
        let techData = null;
        if (statusItem?.comment) {
            try { techData = JSON.parse(statusItem.comment); } catch (e) {}
        }
        return {
            component: comp,
            screenshot: screenshot?.url ? screenshot : null,
            techData: agentTechMap[comp] || techData,
            status: statusItem?.status || (screenshot?.url ? 'pass' : 'neutral')
        };
    };

    const allItems = ['Info', 'CPU', 'GPU', 'Storage', 'Keyboard', 'Battery', 'DxDiag'].map(getItem).filter((i: any) => i.screenshot);

    const [openIndex, setOpenIndex] = useState<number | null>(() => {
        const isReload = typeof window !== 'undefined' && (window.performance?.getEntriesByType?.('navigation')?.[0] as any)?.type === 'reload';
        if (isReload) {
            const saved = localStorage.getItem('lrs_inspectionOpen');
            if (saved !== null) {
                const n = parseInt(saved, 10);
                if (!isNaN(n) && n >= 0 && n < allItems.length) return n;
            }
        }
        return allItems.length > 0 ? 0 : null;
    });

    useEffect(() => {
        if (openIndex !== null) {
            localStorage.setItem('lrs_inspectionOpen', String(openIndex));
        }
    }, [openIndex]);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black text-secondary pr-3 border-r-4 border-primary" style={{ borderRightWidth: '4px' }}>الفحص المتقدم والنتائج التقنية</h3>
            {allItems.length > 0 ? (
                <div className="space-y-3">
                    {allItems.map((item: any, idx: number) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div key={idx} className={cn("bg-white border rounded-2xl overflow-hidden transition-all duration-300", isOpen ? "border-primary/10 shadow-sm" : "border-black/[0.03] hover:border-black/5 shadow-sm")}>
                                <button onClick={() => setOpenIndex(isOpen ? null : idx)} className="w-full px-4 md:px-6 py-4 md:py-5 flex items-center justify-between group text-right" dir="rtl">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isOpen ? "bg-primary text-white" : "bg-black/[0.02] text-secondary/40 group-hover:bg-primary/5 group-hover:text-primary")}>
                                            {getComponentIcon(item.component)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-secondary text-base">{getComponentTitle(item.component)}</span>
                                            <span className="text-[9px] text-primary/60 font-black uppercase tracking-wider">
                                                {item.screenshot ? 'لقطة شاشة الاختبار' : 'نتائج الفحص البرمجي'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" circular className={cn("text-[10px] font-black h-6 px-3", item.status === 'pass' ? "bg-primary/5 text-primary border-primary/10" : "bg-black/[0.02] text-secondary/40")}>
                                            {item.status === 'pass' ? 'PASSED' : 'CHECKED'}
                                        </Badge>
                                        <div className={cn("transition-transform duration-300", isOpen ? "rotate-90 text-primary" : "text-secondary/20")}><ChevronLeft size={20} /></div>
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                            <div className="px-6 pb-8 pt-4 border-t border-black/[0.02]">
                                                    {item.screenshot ? (
                                                        <div className="w-full aspect-video md:aspect-[21/9] bg-black/[0.02] rounded-2xl md:rounded-3xl overflow-hidden border border-black/[0.03] cursor-zoom-in group/img relative mb-6" onClick={() => onImageClick(item.screenshot.url)}>
                                                            <img src={item.screenshot.url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="نتيجة فحص فني متقدم" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"><Search className="text-white" size={32} /></div>
                                                        </div>
                                                    ) : null}
                                                    {item.techData ? (
                                                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {item.component.toLowerCase().includes('battery') && (
                                                                <>
                                                                    <TechStatCard label="صحة البطارية" value={`${Math.round(item.techData.health)}%`} icon={<Zap size={16} />} color="text-primary" />
                                                                    <TechStatCard label="دورات الشحن" value={`${item.techData.cycles}`} icon={<RefreshCw size={16} />} />
                                                                    <TechStatCard label="السعة الفعلية" value={`${Math.round(item.techData.full / 1000)} Wh`} icon={<Battery size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('cpu') && (
                                                                <>
                                                                    <TechStatCard label="عدد الأنوية" value={`${item.techData.cores}`} icon={<Cpu size={16} />} color="text-primary" />
                                                                    <TechStatCard label="درجة الحرارة" value={`${item.techData.temp}°C`} icon={<Thermometer size={16} />} />
                                                                    <TechStatCard label="L3 Cache" value={`${item.techData.cache} MB`} icon={<Database size={16} />} />
                                                                </>
                                                            )}
                                                            {(item.component.toLowerCase().includes('storage') || item.component.toLowerCase().includes('hdd') || item.component.toLowerCase().includes('ssd')) && item.techData.devices?.[0] && (
                                                                <>
                                                                    <TechStatCard label="حالة الهارد" value={`${item.techData.devices[0].health}%`} icon={<ShieldCheck size={16} />} color="text-green-600" />
                                                                    <TechStatCard label="المساحة" value={`${Math.round(item.techData.devices[0].size)} GB`} icon={<HardDrive size={16} />} />
                                                                    <TechStatCard label="النوع" value={item.techData.devices[0].type} icon={<Zap size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('display') && (
                                                                <>
                                                                    <TechStatCard label="دقة الشاشة" value={`${item.techData.width}×${item.techData.height}`} icon={<MonitorIcon size={16} />} color="text-primary" />
                                                                    <TechStatCard label="معدل التحديث" value={`${item.techData.refresh_rate}Hz`} icon={<Zap size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('gpu') && item.techData.devices?.[0] && (
                                                                <>
                                                                    <TechStatCard label="كارت الشاشة" value={item.techData.devices[0].name} icon={<MonitorIcon size={16} />} color="text-primary" />
                                                                    <TechStatCard label="VRAM" value={`${item.techData.devices[0].vram} MB`} icon={<Zap size={16} />} />
                                                                    <TechStatCard label="الشركة" value={item.techData.devices[0].vendor} icon={<CheckCircle2 size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('wifi') && item.techData?.devices && (
                                                                <>
                                                                    <TechStatCard label="الجهاز" value={item.techData.devices.find((d: any) => d.is_physical)?.name || item.techData.devices[0]?.name || '—'} icon={<Monitor size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('bluetooth') && item.techData?.controller?.name && (
                                                                <>
                                                                    <TechStatCard label="المتحكم" value={item.techData.controller.name} icon={<Cpu size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('port') && item.techData && (
                                                                <>
                                                                    {item.techData.usb_count != null && <TechStatCard label="منافذ USB" value={`${item.techData.usb_count} منفذ`} icon={<Usb size={16} />} color="text-primary" />}
                                                                    {item.techData.thunderbolt_count != null && <TechStatCard label="Thunderbolt" value={`${item.techData.thunderbolt_count} منفذ`} icon={<Zap size={16} />} />}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                    <div className="space-y-4 md:space-y-6">
                                                        <div className="p-4 md:p-6 rounded-2xl bg-black/[0.02] border border-black/[0.02]">
                                                            <h5 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-2">شرح تفصيلي للفحص</h5>
                                                            <p className="text-secondary/70 text-sm md:text-base leading-relaxed font-bold">
                                                                {item.screenshot?.comment || getTestDescription(item.component)}
                                                            </p>
                                                        </div>
                                                    </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-16 text-center border-2 border-dashed border-black/[0.03] rounded-3xl"><ImageIcon className="mx-auto mb-4 text-secondary/20" size={48} /><p className="text-sm font-black text-secondary/40">مفيش أي صور أو فحوصات تقنية اتسجلت لسه</p></div>
            )}
        </div>
    );
}
export default InternalInspectionSection;
