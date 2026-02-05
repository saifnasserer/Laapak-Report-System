'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ArrowUpRight,
    Download,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { use } from 'react';

const FinanceStat = ({ title, value, sub, trend, variant = 'primary', isLoading }: any) => (
    <Card variant="flat" className="relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${variant}/5 rounded-full blur-3xl group-hover:bg-${variant}/10 transition-colors duration-500`} />
        <CardContent className="p-8 space-y-4 relative z-10">
            <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-secondary/60 uppercase tracking-widest">{title}</p>
                {trend && !isLoading && (
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {trend === 'up' ? '+' : ''}{sub}%
                    </div>
                )}
            </div>
            {isLoading ? (
                <div className="h-10 w-32 bg-surface-variant animate-pulse rounded" />
            ) : (
                <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            )}
        </CardContent>
    </Card>
);

export default function FinancialPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFinancialData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/financial/dashboard');
            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError(response.data.message || 'حدث خطأ أثناء تحميل البيانات');
            }
        } catch (err: any) {
            console.error('Failed to fetch financial data:', err);
            if (err.response?.status === 403) {
                setError('غير مسموح لك بالوصول إلى هذه الصفحة. تتطلب صلاحيات المشرف العام.');
            } else {
                setError('فشل فريق النظام في الوصول إلى البيانات المالية. يرجى المحاولة لاحقاً.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancialData();
    }, []);

    if (error) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h2 className="text-xl font-bold">وصول مقيد</h2>
                        <p className="text-secondary/60">{error}</p>
                    </div>
                    <Button onClick={() => window.history.back()}>العودة للخلف</Button>
                </div>
            </DashboardLayout>
        );
    }

    const kpis = data?.kpis || {};
    const changes = data?.changes || {};

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">الإدارة المالية</h1>
                        <p className="text-secondary font-medium">نظرة شاملة على الإيرادات والمصروفات والأرباح</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={fetchFinancialData} icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />}>تحديث</Button>
                        <Button variant="outline" size="sm" icon={<Download size={18} />}>تصدير التقرير المالي</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FinanceStat
                        title="إجمالي الدخل"
                        value={` ${Number(kpis.totalRevenue || 0).toLocaleString()}`}
                        sub={Math.round(changes.revenue || 0)}
                        trend={changes.revenue >= 0 ? 'up' : 'down'}
                        variant="primary"
                        isLoading={isLoading}
                    />
                    <FinanceStat
                        title="المصاريف"
                        value={` ${Number(kpis.totalExpenses || 0).toLocaleString()}`}
                        sub={Math.round(changes.expenses || 0)}
                        trend={changes.expenses <= 0 ? 'up' : 'down'}
                        variant="destructive"
                        isLoading={isLoading}
                    />
                    <FinanceStat
                        title="صافي الأرباح"
                        value={` ${Number(kpis.netProfit || 0).toLocaleString()}`}
                        sub={Math.round(changes.profit || 0)}
                        trend={changes.profit >= 0 ? 'up' : 'down'}
                        variant="success"
                        isLoading={isLoading}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader className="p-8 border-b border-black/5">
                            <CardTitle className="text-xl font-bold">توزيع المصروفات حسب الفئة</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-10 bg-surface-variant animate-pulse rounded" />
                                    ))
                                ) : data?.charts?.expenseBreakdown?.length > 0 ? (
                                    data.charts.expenseBreakdown.map((item: any) => {
                                        const percent = Math.round((item.total / kpis.totalExpenses) * 100);
                                        return (
                                            <div key={item.category_id} className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span>{item.category_name}</span>
                                                    <span>{percent}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${percent}%`, backgroundColor: item.color || '#3b82f6' }}
                                                    />
                                                </div>
                                                <div className="text-xs text-secondary/60 text-left">
                                                    {Number(item.total).toLocaleString()}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-secondary/60">لا توجد سجلات مصروفات للفترة المحددة</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="outline">
                        <CardHeader className="p-8 border-b border-black/5 bg-surface-variant/10">
                            <CardTitle className="text-xl font-bold">تنبيهات مالية</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-black/5">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="p-6 h-16 bg-surface-variant/20 animate-pulse" />
                                    ))
                                ) : data?.alerts?.length > 0 ? (
                                    data.alerts.map((alert: any, i: number) => (
                                        <div key={i} className="p-6 flex items-start gap-4 hover:bg-primary/5 transition-colors">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.type === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} />
                                            <div>
                                                <p className="text-sm font-bold">{alert.message}</p>
                                                {alert.action && (
                                                    <p className="text-xs text-secondary/60 mt-1 capitalize">{alert.action}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-secondary/60">لا توجد تنبيهات حالية</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
