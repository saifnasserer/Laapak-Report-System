'use client';

import React, { useState } from 'react';
import { Trophy, Sparkles, PartyPopper, Truck, Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface StatusBannersProps {
    report: any;
    viewMode: 'admin' | 'client' | 'public';
}

export default function StatusBanners({ report, viewMode }: StatusBannersProps) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { width, height } = useWindowSize();

    const isCompleted = report.status === 'completed' || report.status === 'مكتمل';
    const isShipped = report.status === 'shipped' || report.status === 'تم الشحن';

    if (!isCompleted && !isShipped) return null;

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={true}
                    numberOfPieces={200}
                    style={{ zIndex: 9999 }}
                />
            )}

            {/* ── Completed Banner ─────────────────────────────────────── */}
            {isCompleted && (
                <div className="relative overflow-hidden rounded-3xl bg-white border border-green-500/20 p-6 shadow-sm group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-green-500/20 transition-colors duration-700" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                    <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-right">
                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto md:mx-0 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shrink-0">
                            <Trophy size={36} />
                        </div>

                        <div className="flex-1 space-y-3 w-full">
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <Sparkles size={14} className="text-green-600 shrink-0" />
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">
                                    Order Completed Successfully
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                                {viewMode === 'admin' ? 'تمت المهمة بنجاح!' : 'ألف مبروك! جهازك خلص وبقى تمام'}
                            </h2>
                            <p className="text-secondary/60 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
                                {viewMode === 'admin'
                                    ? 'الأوردر ده خلص وتأكد تسليمه للعميل. عاش جداً!'
                                    : 'إحنا مبسوطين جداً إننا خدمناك! نتمنى لك تجربة ممتازة وماتترددش تكلمنا في أي وقت لو احتجت مساعدة.'}
                            </p>
                            <Button
                                variant="outline"
                                className="border-green-500/30 text-green-700 hover:bg-green-50 hover:border-green-500/50 transition-colors gap-2 rounded-2xl h-11 px-5 font-bold bg-white/50 backdrop-blur-sm"
                                onClick={() => setShowConfetti(!showConfetti)}
                            >
                                <PartyPopper size={16} />
                                {showConfetti ? 'وقف الاحتفال' : 'احتفل معانا!'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Shipped Banner ───────────────────────────────────────── */}
            {isShipped && (
                <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm group">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 text-center md:text-right">
                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto md:mx-0 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shrink-0">
                            <Truck size={36} />
                        </div>

                        <div className="flex-1 space-y-5 w-full">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                            Shipment In Transit
                                        </span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                                        {viewMode === 'admin' ? 'تم الشحن للعميل' : 'جهازك في السكة ليك'}
                                    </h2>
                                    <p className="text-secondary/60 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
                                        {viewMode === 'admin'
                                            ? `الجهاز اتشحن عن طريق ${report.tracking_method === 'ENO' ? 'البريد المصري' : report.tracking_method}. تقدر تدوس تحت عشان تتبع الشحنة.`
                                            : `جهازك دلوقتي مع ${report.tracking_method === 'ENO' ? 'البريد المصري' : report.tracking_method} وجاي على عنوانك. تقدر تنسخ رقم التتبع وتشوف هو فين بالظبط دلوقتي.`}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 w-full md:min-w-[300px]">
                                    <div
                                        className="flex items-center justify-between gap-4 p-4 bg-black/[0.02] border border-black/[0.03] rounded-2xl cursor-pointer hover:bg-black/[0.04] transition-all group/copy w-full"
                                        onClick={() => {
                                            navigator.clipboard.writeText(report.tracking_code || '');
                                            setIsCopied(true);
                                            setTimeout(() => setIsCopied(false), 2000);
                                        }}
                                    >
                                        <div className="text-right flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">
                                                {isCopied ? 'تم النسخ بنجاح' : 'رقم التتبع (اضغط للنسخ)'}
                                            </p>
                                            <p className="text-lg md:text-xl font-mono font-bold text-secondary tracking-widest">
                                                {report.tracking_code || '---'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm text-primary shrink-0">
                                            {isCopied
                                                ? <Check size={20} className="text-green-500" />
                                                : <Copy size={20} />
                                            }
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="rounded-2xl h-12 w-full font-black shadow-sm flex items-center justify-center gap-3"
                                        onClick={() => {
                                            const url = report.tracking_method === 'Aramex'
                                                ? `https://www.aramex.com/eg/ar/track/results?shipmentNumber=${report.tracking_code}`
                                                : `https://egyptpost.gov.eg/ar-eg/home/eservices/track-and-trace/`;
                                            window.open(url, '_blank');
                                        }}
                                    >
                                        تتبع الشحنة
                                        <ExternalLink size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
