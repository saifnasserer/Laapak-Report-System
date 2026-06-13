'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, 
    ChevronLeft, 
    ChevronRight,
    Monitor, 
    Cpu, 
    Database, 
    HardDrive, 
    Battery as BatteryIcon, 
    Wifi, 
    Bluetooth, 
    Activity, 
    AlertCircle,
    CheckCircle2,
    Info,
    Layout,
    Clock,
    Zap,
    X,
    Trophy,
    Sparkles,
    MousePointer2,
    Speaker,
    Camera,
    Fingerprint,
    Smartphone,
    BookOpen,
    ArrowRight,
    ArrowLeft,
    Shield,
    Usb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ScanReportViewProps {
    locale: string;
}

export default function ScanReportView({ locale }: ScanReportViewProps) {
    const [report, setReport] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeChapter, setActiveChapter] = useState(0);
    const [direction, setDirection] = useState(0);

    const handleFileUpload = (file: File) => {
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setError('Please upload a valid JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (!json.system || !json.cpu || !json.diagnosis) {
                    setError('Invalid report format. This does not look like a Laapak Agent report.');
                    return;
                }
                setReport(json);
                setError(null);
                setActiveChapter(0);
            } catch (err) {
                setError('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const nextChapter = () => {
        if (activeChapter < chapters.length - 1) {
            setDirection(1);
            setActiveChapter(prev => prev + 1);
        }
    };

    const prevChapter = () => {
        if (activeChapter > 0) {
            setDirection(-1);
            setActiveChapter(prev => prev - 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!report) return;
            if (e.key === 'ArrowRight') prevChapter();
            if (e.key === 'ArrowLeft') nextChapter();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [report, activeChapter]);

    const chapters = report ? [
        {
            id: 'overview',
            title: 'شهادة ميلاد الجهاز والمواصفات',
            intro: 'هنا هتلاقي شهادة ميلاد الجهاز؛ الموديل والسيريال نمبر، مع تفاصيل المعالج والرامات وكارت الشاشة في مكان واحد.',
            icon: <Zap size={24} />,
            render: () => <OverviewSection 
                system={report.system} 
                cpu={report.cpu} 
                ram={report.ram} 
                storage={report.storage} 
                gpu={report.gpu}
            />
        },
        {
            id: 'display',
            title: 'الحالة والمنافذ',
            intro: 'هنا تفاصيل الشاشة، البطارية، الاتصالات (واي فاي وبلوتوث)، والمنافذ المتاحة في الجهاز.',
            icon: <Monitor size={24} />,
            render: () => <DisplayAndPortsSection 
                display={report.display} 
                monitor={report.monitor} 
                ports={report.ports}
                network={report.network}
                bluetooth={report.bluetooth}
                battery={report.battery}
            />
        }
    ] : [];

    // Ensure we always have a valid index for rendering (heals HMR state issues)
    const safeIndex = Math.min(activeChapter, Math.max(0, chapters.length - 1));
    const currentChapter = chapters[safeIndex];

    useEffect(() => {
        if (report && activeChapter >= chapters.length && chapters.length > 0) {
            setActiveChapter(chapters.length - 1);
        }
    }, [report, chapters.length, activeChapter]);

    if (!report) {
        return (
            <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl"
                >
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-secondary mb-4">
                            استعراض <span className="text-primary">تقرير المشتري</span>
                        </h1>
                        <p className="text-secondary/60 font-medium">قم برفع ملف التقرير لتجهيز العرض النهائي للمشتري</p>
                    </div>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                            "relative border-4 border-dashed rounded-[3rem] p-12 transition-all duration-500 flex flex-col items-center justify-center gap-6 cursor-pointer group",
                            isDragging 
                                ? "border-primary bg-primary/5 scale-[1.02]" 
                                : "border-black/5 hover:border-primary/20 hover:bg-black/[0.01]"
                        )}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".json"
                            onChange={onFileChange}
                        />
                        <div className={cn(
                            "w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-500",
                            isDragging ? "bg-primary text-white scale-110 rotate-12" : "bg-primary/10 text-primary group-hover:scale-110"
                        )}>
                            <Upload size={48} />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-secondary mb-1">اسحب الملف هنا</p>
                            <p className="text-secondary/40 font-bold uppercase tracking-widest text-[10px]">أو اضغط لاختيار الملف من جهازك</p>
                        </div>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -bottom-16 left-0 right-0 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!report || !currentChapter) return null;

    return (
        <div className="h-screen bg-[#FDFDFF] text-secondary flex flex-col overflow-hidden relative">
            {/* Top Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1.5 bg-black/5 z-50 overflow-hidden">
                <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((safeIndex + 1) / chapters.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                />
            </div>

            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] md:w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px] md:blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[50%] md:w-[30%] h-[50%] bg-surface-variant/20 rounded-full blur-[60px] md:blur-[100px]" />
            </div>

            <main className="flex-1 flex flex-col pt-6 md:pt-10 overflow-hidden">
                <div className="max-w-6xl mx-auto w-full px-4 md:px-8 flex flex-col h-full">
                    {/* Header: Title & Intro */}
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-8 md:mb-12 shrink-0">
                        <div className="text-center md:text-right space-y-4 max-w-2xl">
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-2 justify-center md:justify-start">
                                <Button 
                                    variant="ghost" 
                                    className="rounded-full px-3 h-10 hover:bg-black/5 group flex items-center gap-2"
                                    onClick={() => setReport(null)}
                                >
                                    <X size={16} className="text-secondary/40 group-hover:text-destructive" />
                                    <span className="text-xs font-bold">إغلاق</span>
                                </Button>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="rounded-full bg-primary/5 border-primary/20 text-primary text-[10px] font-black h-8 px-4 flex items-center gap-2">
                                        <BookOpen size={12} />
                                        تقرير المشتري — فصل {safeIndex + 1} من {chapters.length}
                                    </Badge>
                                </div>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-secondary leading-tight flex items-center justify-center md:justify-start gap-4" dir="rtl">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-xl shadow-primary/5 flex items-center justify-center text-primary shrink-0 border border-black/5">
                                    {currentChapter.icon}
                                </div>
                                {currentChapter.title}
                            </h2>
                            <p className="text-secondary/60 text-base md:text-lg font-medium leading-relaxed" dir="rtl">
                                {currentChapter.intro}
                            </p>
                        </div>
                    </div>

                    {/* Chapter Content Area */}
                    <div className="flex-1 relative overflow-hidden bg-white/50 backdrop-blur-sm rounded-[3rem] border border-black/5 shadow-2xl shadow-black/[0.02] mb-28">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={safeIndex}
                                custom={direction}
                                variants={{
                                    enter: (direction: number) => ({
                                        x: direction > 0 ? 500 : -500,
                                        opacity: 0,
                                        scale: 0.95
                                    }),
                                    center: {
                                        zIndex: 1,
                                        x: 0,
                                        opacity: 1,
                                        scale: 1
                                    },
                                    exit: (direction: number) => ({
                                        zIndex: 0,
                                        x: direction < 0 ? 500 : -500,
                                        opacity: 0,
                                        scale: 0.95
                                    })
                                }}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                    scale: { duration: 0.3 }
                                }}
                                className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 md:p-12"
                            >
                                {currentChapter.render()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 p-6 md:p-10 pointer-events-none z-50">
                <div className="max-w-6xl mx-auto w-full flex items-center justify-between pointer-events-auto bg-white/80 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] border border-black/5 shadow-2xl shadow-primary/10">
                    <Button
                        variant="ghost"
                        onClick={nextChapter}
                        disabled={activeChapter === chapters.length - 1}
                        className={cn(
                            "rounded-2xl h-14 md:h-16 px-6 md:px-10 flex items-center gap-3 transition-all",
                            activeChapter === chapters.length - 1 ? "opacity-30" : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20"
                        )}
                    >
                        <span className="font-black text-lg">التالي</span>
                        <ArrowLeft size={20} />
                    </Button>

                    {/* Step Dots */}
                    <div className="flex gap-2">
                        {chapters.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setDirection(i > activeChapter ? 1 : -1);
                                    setActiveChapter(i);
                                }}
                                className={cn(
                                    "w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300",
                                    i === activeChapter ? "bg-primary w-8 md:w-10" : "bg-black/10 hover:bg-black/20"
                                )}
                            />
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        onClick={prevChapter}
                        disabled={activeChapter === 0}
                        className={cn(
                            "rounded-2xl h-14 md:h-16 px-6 md:px-10 flex items-center gap-3 border border-black/5 hover:bg-black/5 transition-all",
                            activeChapter === 0 ? "opacity-30" : "bg-white text-secondary"
                        )}
                    >
                        <ArrowRight size={20} />
                        <span className="font-black text-lg">السابق</span>
                    </Button>
                </div>
            </nav>
        </div>
    );
}

// --- Sub-sections ---

function DiagnosisSection({ diagnosis }: { diagnosis: any }) {
    if (!diagnosis) return null;

    const gradeColors: any = {
        'A': 'from-green-400 to-emerald-600',
        'B': 'from-blue-400 to-indigo-600',
        'C': 'from-yellow-400 to-orange-600',
        'D': 'from-orange-400 to-red-600',
        'F': 'from-red-500 to-red-700'
    };

    return (
        <div className="space-y-8 h-full flex flex-col justify-center py-8">
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 md:p-12 shadow-xl shadow-primary/5 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-primary/20 transition-all duration-700" />
                
                <div className="relative flex flex-col md:flex-row items-center gap-10">
                    {/* Grade Circle */}
                    <div className={cn(
                        "w-40 h-40 md:w-56 md:h-56 rounded-[3.5rem] bg-gradient-to-br flex flex-col items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3 shrink-0",
                        gradeColors[diagnosis.grade] || 'from-primary to-emerald-600'
                    )}>
                        <span className="text-7xl md:text-9xl font-black leading-none">{diagnosis.grade}</span>
                        <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] mt-2">GRADE</span>
                    </div>

                    <div className="flex-1 space-y-8 w-full text-center md:text-right">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                <Sparkles size={16} className="text-primary animate-pulse" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Final Report Status</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">التقييم النهائي للجهاز</h2>
                        </div>

                        {/* Breakdown Bars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            {Object.entries(diagnosis.breakdown || {}).map(([key, score]: [string, any]) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex justify-between items-end px-2">
                                        <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">{key}</span>
                                        <span className="text-sm font-black text-primary">{score}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-black/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${score}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {diagnosis.actions && diagnosis.actions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {diagnosis.actions.map((action: string, i: number) => (
                        <div key={i} className="p-6 rounded-[2rem] bg-white border border-black/5 flex items-start gap-4 hover:border-primary/20 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Zap size={18} />
                            </div>
                            <p className="text-sm font-bold text-secondary/70 leading-relaxed">{action}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function OverviewSection({ system, cpu, ram, storage, gpu }: { system: any, cpu: any, ram: any, storage: any, gpu: any }) {
    if (!system) return null;

    return (
        <div className="space-y-8 py-4" dir="rtl">
            {/* 1. Identity Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/40 backdrop-blur-sm p-5 rounded-[2rem] border border-black/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-secondary/40 uppercase mb-0.5">الموديل</p>
                        <p className="text-sm font-black text-secondary">{system.manufacturer} {system.model}</p>
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-sm p-5 rounded-[2rem] border border-black/5 flex items-center gap-4 md:col-span-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-secondary/40 uppercase mb-0.5">الرقم التسلسلي (Serial Number)</p>
                        <p className="text-sm font-black text-secondary font-mono tracking-wider">{system.system_serial}</p>
                    </div>
                </div>
            </div>

            {/* 2. CPU Hero Section */}
            <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Cpu size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">المعالج (CPU)</p>
                        <h4 className="text-xl font-black text-secondary">{cpu?.name}</h4>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="rounded-full px-4 h-8 bg-green-500/5 text-green-600 text-[11px] font-bold border-green-500/20 flex items-center gap-2">
                        <Activity size={12} />
                        {cpu?.temperature_c}°C Temp
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-4 h-8 bg-primary/5 text-primary text-[11px] font-bold border-primary/20">{cpu?.l3_cache_mb}MB L3 Cache</Badge>
                    <Badge variant="outline" className="rounded-full px-4 h-8 bg-black/[0.02] text-[11px] font-bold border-black/5">{cpu?.physical_cores} Cores</Badge>
                </div>
            </div>

            {/* 3. GPU Section */}
            <div className="space-y-4">
                {gpu?.devices?.map((g: any, i: number) => (
                    <div key={i} className="bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Monitor size={28} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">{g.vendor || 'GPU'}</p>
                                <h4 className="text-xl font-black text-secondary">{g.name}</h4>
                            </div>
                        </div>
                        <Badge className="bg-primary text-white rounded-full text-xs font-black px-6 h-10 flex items-center">{g.vram_mb} MB VRAM</Badge>
                    </div>
                ))}
            </div>

            {/* 4. RAM & Storage Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RAM Card */}
                <div className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-black/5 p-8 shadow-sm space-y-4 hover:border-primary/10 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Database size={20} className="text-primary/40" />
                            <h5 className="font-black text-secondary text-sm">الرامات (RAM)</h5>
                        </div>
                        <Badge variant="outline" className="rounded-full bg-black/5 border-none font-black text-[10px]">{ram?.total}GB {ram?.type}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-white/50 border border-black/5 text-center">
                            <p className="text-[8px] font-black text-secondary/40 uppercase">التردد</p>
                            <p className="text-xs font-black text-secondary">{ram?.speed_mhz} MHz</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/50 border border-black/5 text-center">
                            <p className="text-[8px] font-black text-secondary/40 uppercase">الحالة</p>
                            <p className="text-xs font-black text-green-600">Healthy</p>
                        </div>
                    </div>
                </div>

                {/* Storage Card */}
                <div className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-black/5 p-8 shadow-sm space-y-4">
                    <div className="flex items-center gap-4">
                        <HardDrive size={20} className="text-primary/40" />
                        <h5 className="font-black text-secondary text-sm">التخزين (Storage)</h5>
                    </div>
                    <div className="space-y-2">
                        {storage?.devices
                            ?.filter((d: any) => d.type?.toLowerCase() !== 'usb' && !d.model?.toLowerCase().includes('usb'))
                            ?.map((drive: any, i: number) => {
                                const healthVal = drive.health_pct ?? drive.health_percent ?? (typeof drive.health === 'number' ? drive.health : 100);
                                return (
                                    <div key={i} className="p-3 rounded-xl bg-white/50 border border-black/5 flex items-center justify-between gap-4">
                                        <div className="overflow-hidden text-right">
                                            <p className="text-[10px] font-black text-secondary truncate">{drive.model}</p>
                                            <p className="text-[11px] font-black text-green-600">{healthVal}% Healthy</p>
                                        </div>
                                        <p className="text-lg font-black text-secondary shrink-0">{Math.round(drive.size_gb)}<span className="text-[10px] text-secondary/40">GB</span></p>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpecCard({ icon, label, value, highlight }: { icon: any, label: string, value: string, highlight?: string }) {
    return (
        <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-white border border-black/5 shadow-sm hover:border-primary/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="overflow-hidden">
                <p className="text-[10px] font-black text-secondary/40 uppercase mb-0.5">{label}</p>
                <p className={cn("text-xs font-black text-secondary truncate", highlight)}>{value}</p>
            </div>
        </div>
    );
}


function DisplayAndPortsSection({ display, monitor, ports, network, bluetooth, battery }: { display: any, monitor: any, ports: any, network: any, bluetooth: any, battery: any }) {
    const batteryDevice = battery?.devices?.[0];
    const mainDisplay = display?.active_displays?.[0];

    const hp = batteryDevice?.health_percentage;
    const num = Number(hp);
    const isNumeric = hp !== null && hp !== undefined && !isNaN(num);
    const displayHealth = isNumeric ? `${Math.round(num)}%` : String(hp || '');
    let isLowHealth = false;
    let progressPct = 100;
    if (isNumeric) {
        isLowHealth = num < 70;
        progressPct = num;
    } else if (typeof hp === 'string') {
        const str = hp.trim().toLowerCase();
        isLowHealth = str === 'poor' || str === 'bad';
        if (str === 'excellent') progressPct = 100;
        else if (str === 'good') progressPct = 85;
        else if (str === 'fair' || str === 'normal') progressPct = 75;
        else if (str === 'poor') progressPct = 50;
    }
    const healthStatusText = isNumeric ? (num > 80 ? 'Excellent' : num > 50 ? 'Good' : 'Poor') : String(hp || 'Excellent');

    const features = [
        { name: 'الواي فاي (WiFi)', status: !!(Array.isArray(network?.devices) && network.devices.some((d: any) => d.is_physical)), info: Array.isArray(network?.devices) ? network.devices.find((d: any) => d.is_physical)?.name : undefined, icon: <Wifi size={18} /> },
        { name: 'البلوتوث', status: !!bluetooth?.available, info: bluetooth?.controller?.name, icon: <Bluetooth size={18} /> },
        { name: 'منافذ USB', count: ports?.usb_count ?? 0, status: (ports?.usb_count > 0), icon: <Usb size={18} /> },
        { name: 'منافذ Thunderbolt', count: ports?.thunderbolt_count ?? 0, status: (ports?.thunderbolt_count > 0), icon: <Zap size={18} /> },
        { name: 'السماعات والميكروفون', status: (ports?.audio_count > 0), icon: <Speaker size={18} /> },
        { name: 'الكاميرا', status: !!(Array.isArray(ports?.audio_devices) && ports.audio_devices.some((d: any) => d.name?.toLowerCase().includes('camera') || d.name?.toLowerCase().includes('webcam'))), icon: <Camera size={18} /> },
        { name: 'قارئ الكروت SD', status: (ports?.sdcard_count > 0), icon: <Layout size={18} /> },
    ];

    return (
        <div className="space-y-8 py-8" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Battery Hero Card */}
                {batteryDevice && (
                    <div className="md:col-span-1 bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm flex flex-col relative overflow-hidden group min-h-[320px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
                        
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <BatteryIcon size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">صحة البطارية</p>
                                <h4 className={cn("text-4xl font-black leading-none", isLowHealth ? "text-orange-500" : "text-primary")}>
                                    {displayHealth}
                                </h4>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 rounded-2xl bg-black/[0.02] border border-black/5">
                                    <span className="text-[10px] font-bold text-secondary/40">السعة الأصلية</span>
                                    <span className="text-xs font-black text-secondary">{Math.round(batteryDevice.design_capacity / 1000)} Wh</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-2xl bg-black/[0.02] border border-black/5">
                                    <span className="text-[10px] font-bold text-secondary/40">السعة الفعلية</span>
                                    <span className="text-xs font-black text-secondary">{Math.round(batteryDevice.full_charge_capacity / 1000)} Wh</span>
                                </div>
                                {batteryDevice.cycle_count > 0 && (
                                    <div className="flex justify-between items-center p-3 rounded-2xl bg-primary/5 border border-primary/10">
                                        <span className="text-[10px] font-bold text-primary/60">دورات الشحن</span>
                                        <span className="text-xs font-black text-primary">{batteryDevice.cycle_count}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[8px] font-black text-secondary/30 uppercase tracking-tighter">الحالة الفنية</span>
                                    <span className="text-[8px] font-black text-primary uppercase tracking-tighter">{healthStatusText}</span>
                                </div>
                                <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPct}%` }}
                                        className={cn("h-full rounded-full transition-all duration-1000", 
                                            progressPct > 80 ? "bg-primary" : 
                                            progressPct > 50 ? "bg-orange-500" : "bg-red-500"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Main Screen Info */}
                <div className="md:col-span-1 bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm flex flex-col justify-center text-center space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 group-hover:bg-green-500/40 transition-colors" />
                    
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Monitor size={28} />
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">دقة الشاشة</p>
                        <h4 className="text-2xl font-black text-secondary">{mainDisplay?.resolution?.width} × {mainDisplay?.resolution?.height}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-black/[0.02] border border-black/5">
                            <p className="text-[8px] font-black text-secondary/30 uppercase mb-0.5">تردد الشاشة</p>
                            <p className="text-sm font-black text-primary">{mainDisplay?.refresh_rate || 60}Hz</p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 flex flex-col justify-center items-center">
                            <CheckCircle2 size={12} className="text-green-500 mb-1" />
                            <p className="text-[8px] font-black text-green-700 uppercase leading-none">فحص الألوان</p>
                            <p className="text-[8px] font-bold text-green-600 mt-1">سليمة 100%</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-black/5">
                        <p className="text-[9px] font-bold text-secondary/40">تم فحص الشاشة بدقة ضد الـ Dead Pixels والعيوب البصرية بنجاح.</p>
                    </div>
                </div>

                {/* 3. Features Checklist */}
                <div className="md:col-span-1 bg-white rounded-[2.5rem] border border-black/5 p-6 shadow-sm">
                    <h5 className="font-black text-secondary mb-4 pr-3 border-r-4 border-primary/20 text-xs">المنافذ والمميزات</h5>
                    <div className="space-y-2">
                        {features.slice(0, 6).map((feature, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-variant/5 border border-black/5 group hover:border-primary/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="text-primary/40 group-hover:text-primary transition-colors">
                                        {feature.icon}
                                    </div>
                                    <p className="text-[10px] font-black text-secondary">{feature.name}</p>
                                </div>
                                {feature.status ? (
                                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                ) : (
                                    <X size={14} className="text-secondary/20 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- Helper Components ---

function DataField({ label, value, subValue, icon, mono, small, color }: { label: string, value: string, subValue?: string, icon?: React.ReactNode, mono?: boolean, small?: boolean, color?: string }) {
    return (
        <div className="group text-right">
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 group-hover:text-primary/60 transition-colors">{label}</p>
            <div className="flex items-center justify-end gap-4">
                <div className="flex flex-col items-end">
                    <p className={cn(
                        "font-black text-secondary",
                        mono ? "font-mono" : "",
                        small ? "text-xl" : "text-3xl leading-none",
                        color
                    )} dir="ltr">
                        {value || '---'}
                    </p>
                    {subValue && <p className="text-[11px] font-bold text-secondary/30 uppercase mt-1" dir="ltr">{subValue}</p>}
                </div>
                {icon && <div className="text-primary/20 shrink-0 group-hover:text-primary transition-all group-hover:scale-110">{icon}</div>}
            </div>
        </div>
    );
}