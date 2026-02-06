'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/auth/AuthProvider';
import api from '@/lib/api';
import {
    TrendingUp,
    Search,
    Filter,
    Calendar,
    RefreshCw,
    Edit2,
    Save,
    X,
    AlertCircle,
    Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';

export default function ProfitManagementPage() {
    // const t = useTranslations('Financial');
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        paymentStatus: 'all',
        showOnlyWithCost: false
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        hasMore: false
    });

    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchData = async (page = 1) => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                limit: pagination.limit,
                search,
                type: 'invoices',
                ...filters
            };

            // Only add valid dates
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus;

            const response = await api.get('/financial/profit-management', { params });
            if (response.data.success) {
                if (page === 1) {
                    setData(response.data.data.items);
                } else {
                    setData(prev => [...prev, ...response.data.data.items]);
                }
                setPagination({
                    ...pagination,
                    page,
                    hasMore: response.data.data.pagination.hasMore
                });
            }
        } catch (error) {
            console.error('Error fetching profit data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchData(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, filters]);

    const handleOpenEdit = async (invoice: any) => {
        setSelectedInvoice(invoice);
        setIsEditModalOpen(true);
        setIsLoadingItems(true);
        try {
            const response = await api.get(`/financial/invoice/${invoice.invoice_id}/items`);
            if (response.data.success) {
                setInvoiceItems(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching invoice items:', error);
        } finally {
            setIsLoadingItems(false);
        }
    };

    const handleUpdateCost = async (itemId: number, newCost: number) => {
        try {
            const response = await api.put(`/financial/cost-price/${itemId}`, {
                cost_price: newCost
            });
            if (response.data.success) {
                // Update local state
                setInvoiceItems(prev => prev.map(item =>
                    item.item_id === itemId ? { ...item, cost_price: newCost } : item
                ));
            }
        } catch (error) {
            console.error('Error updating cost:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                            <TrendingUp className="h-8 w-8" />
                            <h1 className="text-3xl font-bold tracking-tight">إدارة الأرباح</h1>
                        </div>
                        <p className="text-secondary font-medium">تحديد تكاليف المنتجات وحساب صافي الأرباح</p>
                    </div>
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
                                        placeholder="اسم العميل، رقم الفاتورة..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pr-9"
                                    />
                                </div>
                            </div>
                            <div className="w-[150px]">
                                <Label>من تاريخ</Label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="mt-1"
                                />
                            </div>
                            <div className="w-[150px]">
                                <Label>إلى تاريخ</Label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="mt-1"
                                />
                            </div>
                            <Button onClick={() => setFilters({ startDate: '', endDate: '', paymentStatus: 'all', showOnlyWithCost: false })} variant="outline" size="icon">
                                <RefreshCw className="h-4 w-4" />
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
                                        <th className="p-4">رقم الفاتورة</th>
                                        <th className="p-4">التاريخ</th>
                                        <th className="p-4">العميل</th>
                                        <th className="p-4">إجمالي الفاتورة</th>
                                        <th className="p-4">التكلفة</th>
                                        <th className="p-4">صافي الربح</th>
                                        <th className="p-4">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.length > 0 ? (
                                        data.map((invoice: any) => (
                                            <tr key={invoice.id} className="hover:bg-surface-variant/10">
                                                <td className="p-4 font-mono">#{invoice.invoice_id}</td>
                                                <td className="p-4 text-secondary/70">
                                                    {new Date(invoice.date).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="p-4 font-medium">{invoice.client_name}</td>
                                                <td className="p-4 font-bold font-mono">
                                                    {Number(invoice.total).toLocaleString()} ج.م
                                                </td>
                                                <td className="p-4 font-mono text-secondary/70">
                                                    {invoice.total_cost ? Number(invoice.total_cost).toLocaleString() : '-'}
                                                </td>
                                                <td className="p-4">
                                                    {invoice.total_profit !== null ? (
                                                        <span className={`font-bold font-mono ${invoice.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {Number(invoice.total_profit).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-500 text-xs flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            يرجى تحديد التكلفة
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(invoice)}>
                                                        <Edit2 className="h-3 w-3 ml-1" />
                                                        تعديل التكلفة
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-secondary/50">
                                                {isLoading ? 'جاري التحميل...' : 'لا توجد بيانات للعرض'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination.hasMore && (
                            <div className="p-4 text-center border-t">
                                <Button variant="ghost" onClick={() => fetchData(pagination.page + 1)} disabled={isLoading}>
                                    {isLoading ? 'جاري التحميل...' : 'تحميل المزيد'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Costs Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>تعديل تكاليف الفاتورة #{selectedInvoice?.invoice_id}</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {isLoadingItems ? (
                            <div className="text-center py-8">جاري تحميل المنتجات...</div>
                        ) : invoiceItems.length > 0 ? (
                            <div className="space-y-4">
                                {invoiceItems.map((item) => (
                                    <div key={item.item_id} className="p-4 border rounded-lg bg-surface-variant/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-sm">{item.item_description}</div>
                                            <div className="text-xs bg-surface-variant/20 px-2 py-1 rounded">
                                                بيع: {Number(item.sale_price).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex-1">
                                                <Label className="text-xs mb-1 block text-secondary/70">سعر التكلفة (للقطعة)</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        defaultValue={item.cost_price || ''}
                                                        className={`h-9 ${!item.cost_price ? 'border-amber-300 bg-amber-50' : ''}`}
                                                        placeholder="0.00"
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val) && val !== item.cost_price) {
                                                                handleUpdateCost(item.item_id, val);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-[120px] text-left">
                                                <Label className="text-xs mb-1 block text-secondary/70">الربح المتوقع</Label>
                                                <div className={`text-sm font-bold font-mono ${(item.sale_price - (item.cost_price || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {item.cost_price ?
                                                        Number((item.sale_price - item.cost_price) * item.quantity).toLocaleString()
                                                        : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-secondary/50">لا توجد منتجات في هذه الفاتورة</div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsEditModalOpen(false)}>إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
