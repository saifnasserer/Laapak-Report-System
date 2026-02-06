'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    PieChart,
    Plus,
    Search,
    RefreshCw,
    Filter,
    Calendar,
    Tag,
    ChevronLeft,
    ChevronRight,
    Loader2,
    DollarSign,
    User,
    Clock,
    CheckCircle2,
    TrendingDown
} from 'lucide-react';
import ExpenseModal from '@/components/financial/ExpenseModal';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ExpensesPage() {
    // const t = useTranslations('Financial');
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    // Logic: Week Navigation
    const [dateRange, setDateRange] = useState({
        startDate: startOfWeek(new Date(), { weekStartsOn: 6 }), // Saturday start
        endDate: endOfWeek(new Date(), { weekStartsOn: 6 })
    });

    const [filters, setFilters] = useState({
        category: '',
        type: '',
        status: ''
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
        hasMore: false
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);

    const handleEdit = (expense: any) => {
        setEditingExpense(expense);
        setIsAddModalOpen(true);
    };

    const handleAdd = () => {
        setEditingExpense(null);
        setIsAddModalOpen(true);
    };

    const fetchData = async (page = 1) => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                limit: pagination.limit,
                search,
                startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
                endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
                ...filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key];
            });

            const response = await api.get('/financial/expenses', { params });
            if (response.data.success) {
                if (page === 1) {
                    setData(response.data.data.expenses);
                } else {
                    setData(prev => [...prev, ...response.data.data.expenses]);
                }

                const paging = response.data.data.pagination;
                setPagination({
                    ...paging,
                    hasMore: paging.page < paging.pages
                });
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [filters, dateRange]); // Refetch when filters or date range change

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]); // Search debounce

    const handleNextWeek = () => {
        const today = new Date();
        const currentWeekEnd = endOfWeek(today, { weekStartsOn: 6 });

        if (dateRange.endDate >= currentWeekEnd) return;

        setDateRange(prev => ({
            startDate: addDays(prev.startDate, 7),
            endDate: addDays(prev.endDate, 7)
        }));
    };

    const handlePrevWeek = () => {
        setDateRange(prev => ({
            startDate: subDays(prev.startDate, 7),
            endDate: subDays(prev.endDate, 7)
        }));
    };

    const getTypeName = (type: string) => {
        const types: any = {
            'operating': 'تشغيلي',
            'marketing': 'تسويقي',
            'administrative': 'إداري',
            'salary': 'رواتب',
            'other': 'أخرى'
        };
        return types[type] || type;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header & Controls */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                                <span className="p-3 bg-primary/10 rounded-3xl text-primary">
                                    <PieChart size={28} />
                                </span>
                                إدارة المصروفات
                            </h1>
                            <p className="text-secondary/70 font-medium mt-2 mr-16">
                                متابعة المصروفات التشغيلية والإدارية
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Week Navigator */}
                            <div className="flex items-center bg-white/60 backdrop-blur-md rounded-full border border-primary/20 p-1">
                                <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="rounded-full hover:bg-white/80 w-10 h-10">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <div className="px-5 py-1 text-sm font-bold font-mono min-w-[140px] text-center">
                                    {format(dateRange.startDate, 'dd MMM', { locale: ar })} - {format(dateRange.endDate, 'dd MMM', { locale: ar })}
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleNextWeek} className="rounded-full hover:bg-white/80 w-10 h-10">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button
                                onClick={handleAdd}
                                className="h-11 rounded-full px-6 gap-2 bg-primary text-white hover:scale-105 transition-all font-bold"
                            >
                                <Plus size={18} /> إضافة مصروف
                            </Button>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute right-4 top-3.5 h-4 w-4 text-secondary/40" />
                            <Input
                                placeholder="بحث في اسم المصروف..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-11 h-12 rounded-full border-primary/20 bg-white/60 backdrop-blur-sm focus:bg-white transition-all font-bold"
                            />
                        </div>

                    </div>
                </div>

                {/* Content List */}
                <div className="space-y-4">
                    {isLoading && pagination.page === 1 ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-surface-variant/50 animate-pulse rounded-[2rem]" />
                            ))}
                        </div>
                    ) : data.length > 0 ? (
                        data.map((expense: any) => (
                            <div
                                key={expense.id}
                                className="relative group rounded-[3.2rem] p-1 transition-all duration-300 bg-white/40 hover:bg-white/60"
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-[3rem] bg-white/60 backdrop-blur-sm border border-primary/20 transition-all">
                                    {/* Left: Icon & Info */}
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div
                                            className="w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 shadow-inner"
                                            style={{ backgroundColor: `${expense.category?.color}15` || '#eee', color: expense.category?.color || '#666' }}
                                        >
                                            <Tag size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-foreground truncate">{expense.name_ar}</h3>
                                                <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-white/50">
                                                    {getTypeName(expense.type)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-secondary/60 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {format(new Date(expense.date), 'yyyy-MM-dd')}
                                                </span>
                                                <span className="text-secondary/40 font-bold flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: expense.category?.color || '#ccc' }} />
                                                    {expense.category?.name_ar || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Creator */}
                                    <div className="hidden lg:flex items-center gap-2 text-secondary/50 bg-black/[0.02] px-3 py-1.5 rounded-2xl border border-primary/10">
                                        <User size={14} />
                                        <span className="text-xs font-medium">{expense.creator?.name || '-'}</span>
                                    </div>

                                    {/* Right: Amount & Status */}
                                    <div className="flex items-center justify-between w-full md:w-auto gap-6 pl-2">
                                        <div className="text-left">
                                            <div className="text-xs text-secondary/50 mb-1 font-medium text-left">القيمة</div>
                                            <div className="font-black text-xl font-mono text-red-500">
                                                -{Number(expense.amount).toLocaleString()}
                                                <span className="text-xs mr-1 opacity-50 font-sans">ج.م</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-4 py-1.5 rounded-full font-bold text-xs">
                                                معتمد
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(expense)}
                                                className="w-10 h-10 rounded-full hover:bg-primary/10 text-primary"
                                            >
                                                <Plus className="rotate-45" size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-surface-variant/30 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary/30">
                                <TrendingDown size={40} />
                            </div>
                            <h3 className="font-bold text-xl text-secondary/70">لا توجد مصروفات</h3>
                            <p className="text-secondary/40">لا توجد بيانات للعرض في هذه الفترة</p>
                        </div>
                    )}

                    {/* Load More Trigger */}
                    {pagination.hasMore && (
                        <div className="pt-4 flex justify-center">
                            <Button
                                variant="ghost"
                                onClick={() => fetchData(pagination.page + 1)}
                                disabled={isLoading}
                                className="rounded-full px-8 hover:bg-white/50 gap-2 font-bold"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'تحميل المزيد'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ExpenseModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingExpense(null);
                }}
                onSuccess={() => fetchData(1)}
                expense={editingExpense}
            />
        </DashboardLayout>
    );
}
