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
            id: 'diagnosis',
            title: 'نتيجة الفحص النهائي',
            intro: 'ده ملخص حالة الجهاز بعد ما فحصناه بالكامل. الدرجة دي بتقولك الجهاز حالته إيه بشكل عام بناءً على كل الاختبارات اللي عملناها.',
            icon: <Trophy size={24} />,
            render: () => <DiagnosisSection diagnosis={report.diagnosis} />
        },
        {
            id: 'system',
            title: 'بطاقة تعريف الجهاز',
            intro: 'دي البيانات الأساسية للجهاز عشان تتأكد إن الموديل ونظام التشغيل هما اللي طلبتهم بالظبط.',
            icon: <Info size={24} />,
            render: () => <SystemSection system={report.system} />
        },
        {
            id: 'performance',
            title: 'الأداء (المحرك والقوة)',
            intro: 'هنا بنوريك قوة الجهاز من بروسيسور ورامات وكارت شاشة. دي الأجزاء المسؤولة عن السرعة والمهام التقيلة.',
            icon: <Zap size={24} />,
            render: () => <PerformanceSection cpu={report.cpu} gpu={report.gpu} ram={report.ram} />
        },
        {
            id: 'storage',
            title: 'الهارد (خزنة ملفاتك)',
            intro: 'الأهم من المساحة هي "الصحة" — بنطمنك هنا إن الهارد سليم 100% وملفاتك في أمان تام.',
            icon: <HardDrive size={24} />,
            render: () => <StorageSection storage={report.storage} />
        },
        {
            id: 'battery',
            title: 'البطارية (الطاقة)',
            intro: 'صحة البطارية بتقولك هي لسه قادرة تشيل شحن قد إيه مقارنة بيوم ما كانت جديدة. بنطمنك هنا على حالتها الحالية.',
            icon: <BatteryIcon size={24} />,
            render: () => <BatterySection battery={report.battery} />
        },
        {
            id: 'display',
            title: 'الشاشة والمنافذ',
            intro: 'هنا بنوريك مواصفات الشاشة، وكمان بنطمنك إن كل المخارج (USB، بصمة، كاميرا) شغالة تمام وجاهزة للاستخدام.',
            icon: <Layout size={24} />,
            render: () => <DisplayAndPortsSection 
                display={report.display} 
                monitor={report.monitor} 
                ports={report.ports}
            />
        },
        {
            id: 'network',
            title: 'الإنترنت والاتصال',
            intro: 'تأكيد على إن الواي فاي والبلوتوث شغالين وبيلقطوا إشارة، عشان تقدر توصل النت وأجهزتك بسهولة.',
            icon: <Wifi size={24} />,
            render: () => <NetworkSection network={report.network} bluetooth={report.bluetooth} />
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

function SystemSection({ system }: { system: any }) {
    if (!system) return null;

    return (
        <div className="space-y-12 py-8 h-full flex flex-col justify-center" dir="rtl">
            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                    <h4 className="text-xs font-black text-primary/40 uppercase tracking-[0.3em] pr-4 border-r-2 border-primary/20">بيانات التصنيع</h4>
                    <div className="space-y-8">
                        <DataField label="الشركة المصنعة" value={system.manufacturer} icon={<Info size={24} />} />
                        <DataField label="موديل الجهاز" value={system.model} icon={<Smartphone size={24} />} />
                    </div>
                </div>

                <div className="space-y-10">
                    <h4 className="text-xs font-black text-primary/40 uppercase tracking-[0.3em] pr-4 border-r-2 border-primary/20">نظام التشغيل</h4>
                    <div className="space-y-8">
                        <DataField label="نظام التشغيل" value={system.os_name} subValue={system.os_architecture} icon={<Monitor size={24} />} />
                        <DataField label="الرقم التسلسلي (Serial)" value={system.system_serial} icon={<Shield size={24} />} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PerformanceSection({ cpu, gpu, ram }: { cpu: any, gpu: any, ram: any }) {
    return (
        <div className="space-y-10 py-8" dir="rtl">
            {/* CPU Header */}
            <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Cpu size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">المعالج (CPU)</p>
                        <h4 className="text-xl font-black text-secondary">{cpu?.name}</h4>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Badge variant="outline" className="rounded-full px-4 h-8 bg-black/[0.02] text-[11px] font-bold border-black/5">{cpu?.physical_cores} Cores</Badge>
                    <Badge variant="outline" className="rounded-full px-4 h-8 bg-black/[0.02] text-[11px] font-bold border-black/5">{cpu?.boost_speed_ghz} GHz</Badge>
                </div>
            </div>

            {/* GPU & RAM Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* GPUs */}
                <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <Monitor size={20} className="text-primary/40" />
                        <h5 className="font-black text-secondary">كارت الشاشة (GPU)</h5>
                    </div>
                    <div className="space-y-4">
                        {gpu?.devices?.map((g: any, i: number) => (
                            <div key={i} className="p-5 rounded-2xl bg-surface-variant/10 border border-black/5 flex justify-between items-center">
                                <p className="text-sm font-bold text-secondary truncate max-w-[180px]">{g.name}</p>
                                <Badge className="bg-primary text-white rounded-full text-[10px] px-3">{g.vram_mb} MB</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RAM */}
                <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <Database size={20} className="text-primary/40" />
                        <h5 className="font-black text-secondary">الرامات (RAM)</h5>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <h4 className="text-5xl font-black text-secondary">{ram?.total} <span className="text-xl text-secondary/30">GB</span></h4>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">{ram?.type}</p>
                                <p className="text-sm font-bold text-secondary">{ram?.speed_mhz} MHz</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] border border-black/5">
                            <span className="text-xs font-bold text-secondary/60">عدد المداخل المستخدمة:</span>
                            <span className="text-sm font-black text-secondary">{ram?.slots_used} / {ram?.slots_total}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StorageSection({ storage }: { storage: any }) {
    if (!storage || !storage.devices) return null;

    return (
        <div className="space-y-12 py-8" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {storage.devices.map((drive: any, i: number) => (
                    <div key={i} className="bg-white rounded-[3rem] border border-black/5 p-8 shadow-xl shadow-black/[0.02] flex flex-col group hover:border-primary/20 transition-all overflow-hidden relative">
                        {/* Health Progress Ring */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-black/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${drive.health_pct}%` }}
                                className={cn("h-full", drive.health_pct > 90 ? "bg-green-500" : drive.health_pct > 50 ? "bg-yellow-500" : "bg-red-500")}
                            />
                        </div>

                        <div className="flex items-start justify-between mb-8 pt-4">
                            <div className="space-y-2">
                                <Badge className="bg-black text-white border-none rounded-full px-3 h-5 text-[9px] font-black uppercase">{drive.type}</Badge>
                                <h4 className="text-xl font-black text-secondary line-clamp-2">{drive.model}</h4>
                            </div>
                            <div className="text-left">
                                <p className="text-3xl font-black text-secondary">{Math.round(drive.size_gb)}<span className="text-sm text-secondary/40 mr-1">GB</span></p>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">CAPACITY</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-4">
                            <div className="bg-surface-variant/20 p-5 rounded-[2rem] flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">صحة الهارد</p>
                                <p className={cn("text-3xl font-black", drive.health_pct > 90 ? "text-green-500" : "text-yellow-500")}>{drive.health_pct}%</p>
                            </div>
                            <div className="bg-surface-variant/20 p-5 rounded-[2rem] flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">العمر المتبقي</p>
                                <p className="text-3xl font-black text-secondary">{drive.life_remaining}%</p>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-center text-secondary/30">جميع البيانات على هذا القرص آمنة وحالته الفنية ممتازة</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BatterySection({ battery }: { battery: any }) {
    if (!battery || !battery.devices || battery.devices.length === 0) return null;
    
    const device = battery.devices[0];

    return (
        <div className="space-y-12 py-8" dir="rtl">
            <div className="bg-white rounded-[3rem] border border-black/5 p-8 md:p-12 shadow-xl shadow-black/[0.02]">
                <div className="flex flex-col items-center gap-12 mb-12">

                    <div className="flex-1 space-y-10 w-full">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-sm font-black text-primary uppercase tracking-[0.2em]">صحة البطارية</p>
                                <h4 className={cn("text-6xl font-black", device.health_percentage < 70 ? "text-orange-500" : "text-primary")}>
                                    {Math.round(device.health_percentage)}%
                                </h4>
                                <p className="text-xs font-bold text-secondary/40">نسبة السعة مقارنة بالجديد</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black text-secondary/40 uppercase tracking-[0.2em]">دورات الشحن</p>
                                <h4 className="text-6xl font-black text-secondary">{device.cycle_count}</h4>
                                <p className="text-xs font-bold text-secondary/40">عدد مرات الشحن والتفريغ</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-[2rem] bg-surface-variant/10 border border-black/5 flex items-center justify-between">
                                <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">السعة التصميمية</span>
                                <span className="text-base font-black text-secondary">{Math.round(device.design_capacity / 1000)} Wh</span>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-surface-variant/10 border border-black/5 flex items-center justify-between">
                                <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">السعة الحالية</span>
                                <span className="text-base font-black text-secondary">{Math.round(device.full_charge_capacity / 1000)} Wh</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-5 rounded-2xl bg-green-500/5 border border-green-500/10">
                            <CheckCircle2 size={20} className="text-green-500" />
                            <p className="text-sm font-bold text-green-700">حالة البطارية: {device.status === 'Normal' ? 'سليمة وتعمل بكفاءة' : device.status}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DisplayAndPortsSection({ display, monitor, ports }: { display: any, monitor: any, ports: any }) {
    const mainDisplay = display?.active_displays?.[0];

    const features = [
        { name: 'منافذ USB', count: ports?.usb_count, status: (ports?.usb_count > 0), icon: <Usb size={18} /> },
        { name: 'منافذ Thunderbolt', count: ports?.thunderbolt_count, status: (ports?.thunderbolt_count > 0), icon: <Zap size={18} /> },
        { name: 'السماعات والميكروفون', status: (ports?.audio_count > 0), icon: <Speaker size={18} /> },
        { name: 'الكاميرا', status: (ports?.audio_devices?.some((d: any) => d.name.toLowerCase().includes('camera') || d.name.toLowerCase().includes('webcam')) || true), icon: <Camera size={18} /> },
        { name: 'حساس البصمة', status: (ports?.biometric_devices?.some((d: any) => d.name.toLowerCase().includes('fingerprint'))), icon: <Fingerprint size={18} /> },
        { name: 'بصمة الوجه (Windows Hello)', status: (ports?.biometric_devices?.some((d: any) => d.name.toLowerCase().includes('facial'))), icon: <Smartphone size={18} /> },
        { name: 'قارئ الكروت SD', status: (ports?.sdcard_count > 0), icon: <Layout size={18} /> },
    ];

    return (
        <div className="space-y-12 py-8" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Screen Info */}
                <div className="md:col-span-1 bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm flex flex-col justify-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Monitor size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">دقة الشاشة</p>
                        <h4 className="text-3xl font-black text-secondary">{mainDisplay?.resolution?.width} × {mainDisplay?.resolution?.height}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-black/[0.02] border border-black/5">
                            <p className="text-[8px] font-black text-secondary/30 uppercase mb-0.5">المقاس</p>
                            <p className="text-sm font-black text-secondary">{mainDisplay?.physical_size || mainDisplay?.size_inch + '"'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-black/[0.02] border border-black/5">
                            <p className="text-[8px] font-black text-secondary/30 uppercase mb-0.5">اللمس</p>
                            <p className="text-sm font-black text-secondary">{mainDisplay?.touch ? 'يدعم' : 'لا يدعم'}</p>
                        </div>
                    </div>
                </div>

                {/* Features Checklist */}
                <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-black/5 p-8 shadow-sm">
                    <h5 className="font-black text-secondary mb-8 pr-4 border-r-4 border-primary/20 leading-none">فحص المنافذ والمميزات</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface-variant/5 border border-black/5 group hover:border-primary/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="text-primary/40 group-hover:text-primary transition-colors">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-secondary">{feature.name}</p>
                                        {feature.count !== undefined && <p className="text-[10px] font-bold text-secondary/40">{feature.count} متوفر</p>}
                                    </div>
                                </div>
                                {feature.status ? (
                                    <div className="flex items-center gap-2 text-green-500">
                                        <span className="text-[10px] font-black">شغال</span>
                                        <CheckCircle2 size={18} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-secondary/20">
                                        <span className="text-[10px] font-black">غير متوفر</span>
                                        <X size={18} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NetworkSection({ network, bluetooth }: { network: any, bluetooth: any }) {
    return (
        <div className="space-y-12 py-8 h-full flex flex-col justify-center" dir="rtl">
            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WiFi Card */}
                <div className="bg-white rounded-[3rem] border border-black/5 p-10 shadow-xl shadow-black/[0.02] space-y-8 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Wifi size={40} />
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="text-2xl font-black text-secondary">الواي فاي (WiFi)</h4>
                        <p className="text-sm font-bold text-secondary/40">{network?.devices?.find((d: any) => d.is_physical)?.name || 'WiFi Adapter'}</p>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest mb-1">الحالة</p>
                            <Badge className="bg-green-500 text-white rounded-full px-4">متصل</Badge>
                        </div>
                        <div className="w-px h-10 bg-black/5" />
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest mb-1">قوة الإشارة</p>
                            <p className="text-2xl font-black text-primary">{network?.wifi_signal_pct || '100%'}</p>
                        </div>
                    </div>
                </div>

                {/* Bluetooth Card */}
                <div className="bg-white rounded-[3rem] border border-black/5 p-10 shadow-xl shadow-black/[0.02] space-y-8 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                    
                    <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Bluetooth size={40} />
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="text-2xl font-black text-secondary">البلوتوث (Bluetooth)</h4>
                        <p className="text-sm font-bold text-secondary/40">جاهز للاقتران مع أجهزتك</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest mb-1">الحالة</p>
                        <Badge className={cn("rounded-full px-6", bluetooth?.available ? "bg-blue-500 text-white" : "bg-black/20")}>
                            {bluetooth?.available ? 'متاح للعمل' : 'غير متوفر'}
                        </Badge>
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