'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
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
    ChevronDown,
    ChevronUp,
    Wallet,
    CreditCard,
    Bell,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import api from '@/lib/api';
import { use } from 'react';


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const FinanceStat = ({ title, value, sub, trend, variant = 'primary', isLoading, icon: Icon }: any) => (
    <Card variant="glass" className="relative overflow-hidden group border-black/5 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300 rounded-[2rem]">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${variant}/10 rounded-full blur-3xl group-hover:bg-${variant}/20 transition-colors duration-500`} />
        <CardContent className="p-6 space-y-4 relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-secondary/60 uppercase tracking-widest">{title}</p>
                    {trend && !isLoading && (
                        <div className={`mt-2 flex items-center text-xs font-black px-2 py-1 rounded-full w-fit ${trend === 'up' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            <span dir="ltr">{sub}%</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-2xl bg-${variant}/10 text-${variant} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {isLoading ? (
                <div className="h-8 w-32 bg-surface-variant animate-pulse rounded" />
            ) : (
                <h3 className="text-3xl font-black tracking-tight font-mono text-foreground mt-2">{value}</h3>
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
    const [isAlertsOpen, setIsAlertsOpen] = useState(true);

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

                    <div className="flex flex-wrap gap-2 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-full border border-black/5">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full w-8 h-8 hover:bg-white/60"
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
                                className="rounded-full w-8 h-8 hover:bg-white/60"
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
                        <div className="h-4 w-px bg-black/5 mx-1" />
                        <Button variant="ghost" size="icon" onClick={fetchFinancialData} className="rounded-full w-8 h-8 hover:bg-white/60">
                            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
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

                {/* Content Area: Alerts & Quick Links (Diagrams Removed) */}
                <div className="space-y-8">

                    {/* Alerts Section - Warranty Alerts Style */}
                    <Card variant="glass" className="border-black/5 bg-white/60 backdrop-blur-sm transition-all duration-300">
                        <div
                            className={`flex justify-between items-center cursor-pointer select-none p-6 ${isAlertsOpen ? 'border-b border-black/5' : ''}`}
                            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm border border-amber-500/10">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-lg m-0 text-amber-950">تنبيهات مالية</h5>
                                    <p className="text-secondary/60 text-sm m-0 font-medium">إشعارات هامة تتطلب انتباهك</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {data?.alerts?.length > 0 && (
                                    <Badge variant="warning" circular className="text-sm px-4 py-1.5 shadow-sm">
                                        {data.alerts.length}
                                    </Badge>
                                )}
                                {isAlertsOpen ? (
                                    <ChevronUp size={20} className="text-secondary/60" />
                                ) : (
                                    <ChevronDown size={20} className="text-secondary/60" />
                                )}
                            </div>
                        </div>

                        {isAlertsOpen && (
                            <div className="p-6">
                                {isLoading ? (
                                    <div className="flex flex-col gap-3">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-20 bg-surface-variant/50 animate-pulse rounded-2xl" />
                                        ))}
                                    </div>
                                ) : data?.alerts?.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {data.alerts.map((alert: any, idx: number) => {
                                            const isCritical = alert.type === 'error' || alert.priority === 'high';
                                            const isWarning = alert.type === 'warning';

                                            let colorClass = isCritical ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/30' :
                                                isWarning ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30' :
                                                    'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/30';

                                            let iconColor = isCritical ? 'text-red-500' :
                                                isWarning ? 'text-amber-500' :
                                                    'text-blue-500';

                                            return (
                                                <div key={idx} className={`rounded-[1.5rem] p-4 border ${colorClass} transition-all duration-300 hover:shadow-md group`}>
                                                    <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
                                                        {/* Left Side: Icon & Info */}
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/10' : isWarning ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                                                                <div className={iconColor}>
                                                                    <AlertCircle size={24} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h6 className="font-black text-base text-foreground">{alert.title || 'تنبيه'}</h6>
                                                                    <Badge variant={isCritical ? 'destructive' : isWarning ? 'warning' : 'secondary'} className="text-[10px] h-5 px-2">
                                                                        {isCritical ? 'عاجل' : isWarning ? 'تحذير' : 'معلومة'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm font-medium text-secondary/60">
                                                                    {alert.message}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Right Side: Actions */}
                                                        {alert.action && (
                                                            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                                                <Button
                                                                    size="sm"
                                                                    className="rounded-xl px-4 h-10 font-bold gap-2 bg-white border border-black/5 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm text-secondary"
                                                                    href={`/dashboard/admin/financial/${alert.action}`}
                                                                >
                                                                    معالجة
                                                                    <ArrowUpRight size={16} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-4 animate-in zoom-in duration-500">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <p className="text-lg font-bold text-green-900">لا توجد تنبيهات نشطة</p>
                                        <p className="text-secondary/60 text-sm font-medium">الوضع المالي مستقر ولا توجد إجراءات مطلوبة</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Quick Links Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button variant="outline" className="w-full justify-start h-16 rounded-[1.5rem] border-black/5 bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-lg hover:border-primary/20 hover:text-primary transition-all group p-2 px-4" href="/dashboard/admin/financial/money-management">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center ml-3 transition-colors text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div className="text-right">
                                <span className="font-black block text-sm">إدارة الخزينة</span>
                                <span className="text-[10px] text-secondary/50 font-medium group-hover:text-primary/70">المحافظ والحسابات</span>
                            </div>
                            <ChevronLeft className="mr-auto h-5 w-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </Button>

                        <Button variant="outline" className="w-full justify-start h-16 rounded-[1.5rem] border-black/5 bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-lg hover:border-primary/20 hover:text-primary transition-all group p-2 px-4" href="/dashboard/admin/financial/profit-management">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center ml-3 transition-colors text-primary">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div className="text-right">
                                <span className="font-black block text-sm">إدارة الأرباح</span>
                                <span className="text-[10px] text-secondary/50 font-medium group-hover:text-primary/70">تحليل التكاليف والعوائد</span>
                            </div>
                            <ChevronLeft className="mr-auto h-5 w-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </Button>

                        <Button variant="outline" className="w-full justify-start h-16 rounded-[1.5rem] border-black/5 bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-lg hover:border-primary/20 hover:text-primary transition-all group p-2 px-4" href="/dashboard/admin/financial/expenses">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center ml-3 transition-colors text-primary">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div className="text-right">
                                <span className="font-black block text-sm">سجل المصروفات</span>
                                <span className="text-[10px] text-secondary/50 font-medium group-hover:text-primary/70">تتبع النفقات اليومية</span>
                            </div>
                            <ChevronLeft className="mr-auto h-5 w-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
