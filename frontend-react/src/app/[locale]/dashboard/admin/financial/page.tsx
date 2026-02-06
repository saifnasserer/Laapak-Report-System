'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ArrowUpRight,
    Download,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Wallet,
    CreditCard
} from 'lucide-react';
import api from '@/lib/api';
import { use } from 'react';
import { TrendChart, BreakdownChart } from '@/components/financial/DashboardCharts';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const FinanceStat = ({ title, value, sub, trend, variant = 'primary', isLoading, icon: Icon }: any) => (
    <Card variant="flat" className="relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${variant}/5 rounded-full blur-3xl group-hover:bg-${variant}/10 transition-colors duration-500`} />
        <CardContent className="p-6 space-y-4 relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-secondary/60 uppercase tracking-widest">{title}</p>
                    {trend && !isLoading && (
                        <div className={`mt-1 flex items-center text-xs font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            <span>{sub}% عن الشهر الماضي</span>
                        </div>
                    )}
                </div>
                <div className={`p-2 rounded-lg bg-${variant}/10 text-${variant}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {isLoading ? (
                <div className="h-8 w-32 bg-surface-variant animate-pulse rounded" />
            ) : (
                <h3 className="text-3xl font-bold tracking-tight font-mono">{value}</h3>
            )}
        </CardContent>
    </Card>
);

export default function FinancialPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const fetchFinancialData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/financial/dashboard?month=${selectedMonth}&year=${selectedYear}`);
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
    }, [selectedMonth, selectedYear]);

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
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">الإدارة المالية</h1>
                        <p className="text-secondary font-medium">نظرة شاملة على الإيرادات والمصروفات والأرباح</p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center bg-surface p-2 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (selectedMonth === 1) {
                                        setSelectedMonth(12);
                                        setSelectedYear(prev => prev - 1);
                                    } else {
                                        setSelectedMonth(prev => prev - 1);
                                    }
                                }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <div className="flex gap-2">
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger className="w-[110px] border-none bg-transparent shadow-none font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger className="w-[90px] border-none bg-transparent shadow-none font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026, 2027].map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (selectedMonth === 12) {
                                        setSelectedMonth(1);
                                        setSelectedYear(prev => prev + 1);
                                    } else {
                                        setSelectedMonth(prev => prev + 1);
                                    }
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="h-6 w-px bg-border mx-2" />
                        <Button variant="ghost" size="icon" onClick={fetchFinancialData}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FinanceStat
                        title="إجمالي الدخل"
                        value={`${Number(kpis.totalRevenue || 0).toLocaleString()} ج.م`}
                        sub={Math.round(changes.revenue || 0)}
                        trend={changes.revenue >= 0 ? 'up' : 'down'}
                        variant="blue-600"
                        icon={DollarSign}
                        isLoading={isLoading}
                    />
                    <FinanceStat
                        title="المصاريف"
                        value={`${Number(kpis.totalExpenses || 0).toLocaleString()} ج.م`}
                        sub={Math.round(changes.expenses || 0)}
                        trend={changes.expenses <= 0 ? 'up' : 'down'} // Lower expenses is 'up' metaphorically good, but visually we might want consistent color
                        variant="red-600"
                        icon={CreditCard}
                        isLoading={isLoading}
                    />
                    <FinanceStat
                        title="صافي الأرباح"
                        value={`${Number(kpis.netProfit || 0).toLocaleString()} ج.م`}
                        sub={Math.round(changes.profit || 0)}
                        trend={changes.profit >= 0 ? 'up' : 'down'}
                        variant="green-600"
                        icon={TrendingUp}
                        isLoading={isLoading}
                    />
                    <FinanceStat
                        title="هامش الربح"
                        value={`${Number(kpis.profitMargin || 0).toFixed(1)}%`}
                        sub={0}
                        trend="up"
                        variant="purple-600"
                        icon={Wallet}
                        isLoading={isLoading}
                    />
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Trend Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>الأداء المالي</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px]">
                                    {isLoading ? (
                                        <div className="w-full h-full bg-surface-variant animate-pulse rounded-lg" />
                                    ) : (
                                        <TrendChart data={data?.charts?.trend || []} height={350} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Alerts */}
                        <Card variant="outline" className="border-amber-200 bg-amber-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-amber-800 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    تنبيهات هامة
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {isLoading ? (
                                        [1, 2].map(i => <div key={i} className="h-12 bg-amber-100/50 animate-pulse rounded" />)
                                    ) : data?.alerts?.length > 0 ? (
                                        data.alerts.map((alert: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-amber-100">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                    <span className="text-sm font-medium">{alert.message}</span>
                                                </div>
                                                {alert.action && (
                                                    <Button size="sm" variant="ghost" className="text-primary h-8" asChild>
                                                        <Link href={`/dashboard/admin/financial/${alert.action}`}>
                                                            معالجة
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-amber-700/60">لا توجد تنبيهات نشطة</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Breakdown Column */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Expense Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>توزيع المصروفات</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px]">
                                    {isLoading ? (
                                        <div className="w-full h-full bg-surface-variant animate-pulse rounded-full" />
                                    ) : (
                                        <BreakdownChart data={data?.charts?.expenseBreakdown || []} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle>روابط سريعة</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/dashboard/admin/financial/money-management">
                                        <Wallet className="h-4 w-4 ml-2" />
                                        إدارة الخزينة والمحافظ
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/dashboard/admin/financial/profit-management">
                                        <TrendingUp className="h-4 w-4 ml-2" />
                                        إدارة الأرباح والتكاليف
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/dashboard/admin/financial/expenses">
                                        <CreditCard className="h-4 w-4 ml-2" />
                                        سجل المصروفات
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
