'use client';

import React, { useState } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    ShoppingCart,
    Target,
    Filter,
    ArrowRightLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';

const ProcurementPage = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState({
        budget: 100000,
        currency: 'EGP',
        strategy: 'BALANCED',
        riskLevel: 'MEDIUM'
    });
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/procurement/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(params)
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error generating plan:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-secondary mb-2">تخطيط المشتريات</h1>
                        <p className="text-secondary/50 font-bold">بناء خطة شراء ذكية بناءً على بيانات المبيعات والمخزن</p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <ShoppingCart size={20} />}
                        <span>توليد الخطة</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-secondary/30 uppercase tracking-widest px-1">الميزانية الكلية</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={params.budget}
                                onChange={(e) => setParams({ ...params, budget: Number(e.target.value) })}
                                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 font-black text-secondary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-secondary/30">{params.currency}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-secondary/30 uppercase tracking-widest px-1">استراتيجية الاستهداف</label>
                        <select
                            value={params.strategy}
                            onChange={(e) => setParams({ ...params, strategy: e.target.value })}
                            className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 font-black text-secondary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                        >
                            <option value="BALANCED">متوازن</option>
                            <option value="CORPORATE_FOCUS">تركيز شركات</option>
                            <option value="RETAIL_FOCUS">تركيز أفراد</option>
                            <option value="HIGH_TURNOVER">دوران سريع</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-secondary/30 uppercase tracking-widest px-1">مستوى المخاطرة</label>
                        <select
                            value={params.riskLevel}
                            onChange={(e) => setParams({ ...params, riskLevel: e.target.value })}
                            className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 font-black text-secondary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                        >
                            <option value="LOW">منخفض (نماذج آمنة)</option>
                            <option value="MEDIUM">متوسط</option>
                            <option value="HIGH">عالي</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-secondary/30 uppercase tracking-widest px-1">فترة التحليل</label>
                        <div className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 font-black text-secondary/40 italic">
                            من 1 يوليو 2025
                        </div>
                    </div>
                </div>
            </div>

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Main Plan Table */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                            <h2 className="text-xl font-black text-secondary mb-6 flex items-center gap-3">
                                <Target className="text-primary" />
                                خطة الشراء المقترحة
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-black/5">
                                            <th className="text-right pb-4 text-[10px] font-black text-secondary/30 uppercase tracking-widest">الموديل</th>
                                            <th className="text-center pb-4 text-[10px] font-black text-secondary/30 uppercase tracking-widest">الكمية</th>
                                            <th className="text-center pb-4 text-[10px] font-black text-secondary/30 uppercase tracking-widest">التكلفة التقديرية</th>
                                            <th className="text-center pb-4 text-[10px] font-black text-secondary/30 uppercase tracking-widest">نسبة الميزانية</th>
                                            <th className="text-center pb-4 text-[10px] font-black text-secondary/30 uppercase tracking-widest">سرعة البيع</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {result.plan.map((item: any, idx: number) => (
                                            <tr key={idx} className="group hover:bg-black/[0.02] transition-colors">
                                                <td className="py-4">
                                                    <div className="font-black text-secondary">{item.model}</div>
                                                    <div className="text-[10px] text-secondary/40 font-bold uppercase">{item.cpu} | {item.ram} | {item.storage}</div>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-black">{item.suggestedQty}</span>
                                                </td>
                                                <td className="py-4 text-center font-black text-secondary">
                                                    {Math.round(item.estimatedCost).toLocaleString()} {params.currency}
                                                </td>
                                                <td className="py-4 text-center">
                                                    <div className="w-full max-w-[80px] mx-auto bg-black/5 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-primary h-full rounded-full"
                                                            style={{ width: `${item.budgetPercent}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-secondary/40 mt-1 block">{item.budgetPercent}%</span>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingUp size={14} className={item.avgSellTime < 15 ? 'text-green-500' : 'text-orange-500'} />
                                                        <span className="text-xs font-bold text-secondary">{Math.round(item.avgSellTime)} يوم</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Exec Summary */}
                        <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <LayoutDashboard size={120} />
                            </div>
                            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                                <CheckCircle2 />
                                ملخص تنفيذي
                            </h2>
                            <ul className="space-y-4">
                                {result.executiveSummary.map((note: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 font-bold text-white/90">
                                        <ChevronRight size={18} className="mt-0.5 shrink-0" />
                                        <span>{note}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-8">
                        {/* Priority List */}
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                            <h2 className="text-lg font-black text-secondary mb-6 flex items-center gap-3">
                                <StarIcon className="text-yellow-500" />
                                الأولوية القصوى
                            </h2>
                            <div className="space-y-4">
                                {result.priorityModels.map((model: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                                        <div className="w-8 h-8 rounded-xl bg-yellow-500 text-white flex items-center justify-center font-black text-sm">
                                            {idx + 1}
                                        </div>
                                        <span className="font-black text-secondary">{model}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Avoid List */}
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                            <h2 className="text-lg font-black text-secondary mb-6 flex items-center gap-3">
                                <AlertTriangle className="text-destructive" />
                                موديلات للتجنب
                            </h2>
                            <div className="space-y-4">
                                {result.avoidList.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-destructive/5 rounded-2xl border border-destructive/10">
                                        <span className="font-black text-secondary text-sm">{item.model}</span>
                                        <span className="text-[10px] font-black text-destructive uppercase bg-destructive/10 px-2 py-1 rounded-md">{item.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Spec Targets */}
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                            <h2 className="text-lg font-black text-secondary mb-6 flex items-center gap-3">
                                <Filter className="text-primary" />
                                مواصفات مستهدفة
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-3">المعالجات CPU</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.specTargets.cpu.map((s: string) => (
                                            <span key={s} className="bg-black/5 px-3 py-1.5 rounded-xl font-bold text-xs text-secondary">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-3">الرامات RAM</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.specTargets.ram.map((s: string) => (
                                            <span key={s} className="bg-black/5 px-3 py-1.5 rounded-xl font-bold text-xs text-secondary">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-3">التخزين Storage</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.specTargets.storage.map((s: string) => (
                                            <span key={s} className="bg-black/5 px-3 py-1.5 rounded-xl font-bold text-xs text-secondary">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StarIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M11.649 2.35a.75.75 0 0 1 1.352 0l2.67 5.409 5.968.867a.75.75 0 0 1 .416 1.279l-4.32 4.21 1.02 5.944a.75.75 0 0 1-1.088.791L12 18.06l-5.337 2.805a.75.75 0 0 1-1.088-.79l1.02-5.945-4.32-4.21a.75.75 0 0 1 .416-1.28l5.967-.866 2.671-5.41Z" />
    </svg>
);

export default ProcurementPage;
