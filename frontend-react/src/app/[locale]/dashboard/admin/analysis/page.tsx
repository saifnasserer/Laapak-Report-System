'use client';

import React, { useState, useEffect, use } from 'react';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    BarChart3,
    RefreshCw,
    Smartphone,
    AlertCircle,
    Plus,
    ShoppingCart,
} from 'lucide-react';
import api from '@/lib/api';
import { AddToListModal } from '@/components/analysis/AddToListModal';

export default function AnalysisPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Date range states
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Shopping list modal state
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async (isFirstLoad = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get(`/analysis/dashboard?${params.toString()}`);
            if (response.data.success) {
                const result = response.data.data;
                setData(result);

                // If first load and no startDate, set it to firstReportDate
                if (isFirstLoad && result.firstReportDate && !startDate) {
                    const firstDate = new Date(result.firstReportDate).toISOString().split('T')[0];
                    setStartDate(firstDate);
                }
            } else {
                setError(response.data.message || 'حدث خطأ أثناء تحميل البيانات');
            }
        } catch (err: any) {
            console.error('Failed to fetch analysis data:', err);
            setError('فشل في تحميل بيانات التحليل. يرجى التأكد من صلاحياتك والمحاولة لاحقاً.');
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, []);

    const kpis = data?.kpis || {};
    const deviceSales = data?.deviceSales || [];

    if (error) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h2 className="text-xl font-bold">خطأ في التحميل</h2>
                        <p className="text-secondary/60">{error}</p>
                    </div>
                    <Button onClick={() => fetchData(false)}>إعادة المحاولة</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-16 pt-4">
                {/* Header Section - Dashboard Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <BarChart3 size={28} className="text-primary" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">تحليل المبيعات والطلب</h1>
                        </div>
                        <p className="text-secondary/60 font-bold text-sm mr-12">نظرة شاملة على مبيعات الأجهزة، والطلبات الأكثر تكراراً</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-xl p-3 rounded-[2rem] border-2 border-black/5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-tighter pr-2">من</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-black/[0.03] hover:bg-black/[0.06] border-2 border-transparent focus:border-primary/20 rounded-xl px-3 py-2 text-sm font-black focus:ring-4 focus:ring-primary/5 outline-none w-[160px] cursor-pointer transition-all"
                                />
                            </div>
                            <div className="h-6 w-px bg-black/5" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-tighter pr-2">إلى</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-black/[0.03] hover:bg-black/[0.06] border-2 border-transparent focus:border-primary/20 rounded-xl px-3 py-2 text-sm font-black focus:ring-4 focus:ring-primary/5 outline-none w-[160px] cursor-pointer transition-all"
                                />
                            </div>
                        </div>
                        <div className="h-8 w-px bg-black/5" />
                        <Button
                            variant="primary"
                            size="icon"
                            onClick={() => fetchData(false)}
                            className="rounded-full w-10 h-10 border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white"
                            disabled={isLoading}
                        >
                            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                        </Button>
                    </div>
                </div>

                <div className="w-full h-px bg-black/[0.03]" />

                <div className="w-full h-px bg-black/[0.03]" />

                {/* Detailed Items Sold Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 pt-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight text-foreground">تفاصيل مبيعات الأجهزة</h2>
                            <p className="text-sm text-secondary/60 font-bold">قائمة شاملة بكافة الموديلات التي تم بيعها بنجاح</p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-2 border-black/5 font-black px-4 py-1">
                            {deviceSales.length} موديلات
                        </Badge>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border-2 border-black/5 overflow-hidden transition-all duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-black/[0.02] border-b-2 border-black/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">الماركة</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">الموديل</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] text-center w-32">الكمية المباعة</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] text-center w-24">إضافة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-black/5 animate-pulse">
                                                <td className="px-8 py-5"><div className="h-4 w-20 bg-black/5 rounded" /></td>
                                                <td className="px-8 py-5"><div className="h-4 w-32 bg-black/5 rounded" /></td>
                                                <td className="px-8 py-5"><div className="h-6 w-12 bg-black/5 rounded-full mx-auto" /></td>
                                            </tr>
                                        ))
                                    ) : deviceSales.length > 0 ? (
                                        deviceSales.map((item: any, index: number) => (
                                            <tr
                                                key={`${item.device_brand}-${item.device_model}`}
                                                className={clsx(
                                                    "border-b border-black/5 hover:bg-black/[0.01] transition-colors group",
                                                    index === deviceSales.length - 1 && "border-none"
                                                )}
                                            >
                                                <td className="px-8 py-5 font-black text-secondary/80">{item.device_brand}</td>
                                                <td className="px-8 py-5 font-black text-foreground">{item.device_model}</td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-mono font-black text-lg w-12 h-12 rounded-2xl group-hover:scale-110 transition-transform">
                                                        {item.count}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-10 h-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors"
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <Plus size={20} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <Smartphone size={48} />
                                                    <p className="text-sm font-black uppercase tracking-widest">لا توجد بيانات مبيعات متوفرة لهذه الفترة</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <AddToListModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    item={selectedItem}
                />
            </div>
        </DashboardLayout>
    );
}
