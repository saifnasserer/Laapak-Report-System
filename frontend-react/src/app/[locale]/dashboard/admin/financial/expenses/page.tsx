'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/auth/AuthProvider';
import api from '@/lib/api';
import {
    PieChart,
    Plus,
    Search,
    RefreshCw,
    Filter,
    Calendar,
    Tag
} from 'lucide-react';
import ExpenseModal from '@/components/financial/ExpenseModal';

export default function ExpensesPage() {
    // const t = useTranslations('Financial');
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        type: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchData = async (page = 1) => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                limit: pagination.limit,
                search,
                ...filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key];
            });

            const response = await api.get('/financial/expenses', { params });
            if (response.data.success) {
                setData(response.data.data.expenses);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [filters]); // Refetch when filters change

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]); // Search debounce

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
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                            <PieChart className="h-8 w-8" />
                            <h1 className="text-3xl font-bold tracking-tight">المصروفات</h1>
                        </div>
                        <p className="text-secondary font-medium">سجل المصروفات التشغيلية والإدارية</p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> إضافة مصروف
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <Label>بحث</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-secondary/40" />
                                    <Input
                                        placeholder="بحث في المصروفات..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pr-9"
                                    />
                                </div>
                            </div>
                            <Button onClick={() => fetchData(1)} variant="ghost" size="icon">
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-surface-variant/30 text-secondary/70 font-medium">
                                    <tr>
                                        <th className="p-4">التاريخ</th>
                                        <th className="p-4">البند</th>
                                        <th className="p-4">التصنيف</th>
                                        <th className="p-4">القيمة</th>
                                        <th className="p-4">النوع</th>
                                        <th className="p-4">بواسطة</th>
                                        <th className="p-4">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.length > 0 ? (
                                        data.map((expense: any) => (
                                            <tr key={expense.id} className="hover:bg-surface-variant/10">
                                                <td className="p-4 text-secondary/70">
                                                    {new Date(expense.date).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    <div>{expense.name_ar}</div>
                                                    {expense.description && (
                                                        <div className="text-xs text-secondary/50 truncate max-w-[200px]">
                                                            {expense.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: expense.category?.color || '#ccc' }}
                                                        />
                                                        <span>{expense.category?.name_ar || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold font-mono text-red-600">
                                                    -{Number(expense.amount).toLocaleString()} ج.م
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="font-normal text-xs">
                                                        {getTypeName(expense.type)}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-xs text-secondary/60">
                                                    {expense.creator?.name || '-'}
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                                                        معتمد
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-secondary/50">
                                                {isLoading ? 'جاري التحميل...' : 'لا توجد مصروفات مسجلة'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t flex items-center justify-between text-sm text-secondary/60">
                            <div>
                                صفحة {pagination.page} من {pagination.pages || 1}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1 || isLoading}
                                    onClick={() => fetchData(pagination.page - 1)}
                                >
                                    السابق
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= pagination.pages || isLoading}
                                    onClick={() => fetchData(pagination.page + 1)}
                                >
                                    التالي
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ExpenseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => fetchData(1)}
            />
        </DashboardLayout>
    );
}
