'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    TrendingUp,
    Search,
    RefreshCw,
    Edit2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    Receipt,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Label } from '@/components/ui/Label';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ProfitManagementPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    // Logic: Week Navigation
    const [dateRange, setDateRange] = useState({
        startDate: startOfWeek(new Date(), { weekStartsOn: 6 }), // Saturday start
        endDate: endOfWeek(new Date(), { weekStartsOn: 6 })
    });

    // Logic: Review Mode (Show only missing costs)
    const [isReviewMode, setIsReviewMode] = useState(false);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50, // Higher limit for list view
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
                startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
                endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
            };

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
        const timeoutId = setTimeout(() => {
            fetchData(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, dateRange]); // Refetch on date change or search

    const handleNextWeek = () => {
        const today = new Date();
        const currentWeekEnd = endOfWeek(today, { weekStartsOn: 6 });

        // Prevent going beyond current week
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
                // 1. Update items in the modal (using state update with callback for latest data)
                setInvoiceItems(prev => {
                    const updatedItems = prev.map(item =>
                        item.item_id === itemId ? { ...item, cost_price: newCost } : item
                    );

                    // 2. Update the main list (Optimistic Calculation)
                    setData(dataPrev => dataPrev.map(inv => {
                        if (inv.invoice_id === selectedInvoice.invoice_id) {
                            const newTotalCost = updatedItems.reduce((sum, item) =>
                                sum + (Number(item.cost_price || 0) * Number(item.quantity)), 0
                            );

                            return {
                                ...inv,
                                total_cost: newTotalCost,
                                total_profit: Number(inv.total) - newTotalCost,
                            };
                        }
                        return inv;
                    }));

                    return updatedItems;
                });
            }
        } catch (error) {
            console.error('Error updating cost:', error);
        }
    };

    // Filter Logic
    const filteredData = data.filter(inv => {
        if (isReviewMode) {
            // Logic: Missing cost means total_cost is 0 or null
            return !inv.total_cost || Number(inv.total_cost) === 0;
        }
        return true;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header & Controls */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                                <span className="p-3 bg-primary/10 rounded-[1.5rem] text-primary">
                                    <TrendingUp size={28} />
                                </span>
                                إدارة الأرباح
                            </h1>
                            <p className="text-secondary/70 font-medium mt-2 mr-16">
                                متابعة الأرباح والتكاليف الأسبوعية
                            </p>
                        </div>

                        {/* Week Navigator */}
                        <div className="flex items-center bg-white/60 backdrop-blur-md rounded-full border border-primary/20 p-1 self-start md:self-center">
                            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="rounded-full hover:bg-white/80 w-10 h-10">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <div className="px-5 py-1 text-sm font-bold font-mono">
                                {format(dateRange.startDate, 'dd MMM', { locale: ar })} - {format(dateRange.endDate, 'dd MMM', { locale: ar })}
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="rounded-full hover:bg-white/80 w-10 h-10">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>

                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute right-4 top-3.5 h-4 w-4 text-secondary/40" />
                            <Input
                                placeholder="بحث باسم العميل أو رقم الفاتورة..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-11 h-12 rounded-full border-primary/20 bg-white/60 backdrop-blur-sm focus:bg-white transition-all font-bold"
                            />
                        </div>
                        <Button
                            onClick={() => setIsReviewMode(!isReviewMode)}
                            variant={isReviewMode ? "primary" : "outline"}
                            className={`h-12 rounded-full px-6 gap-2 border-primary/20 ${isReviewMode ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : 'bg-white/60 hover:bg-white'}`}
                        >
                            {isReviewMode ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {isReviewMode ? 'عرض الكل' : 'نواقص التكلفة'}
                        </Button>
                    </div>
                </div>

                {/* Content List */}
                <div className="space-y-4">
                    {isLoading && pagination.page === 1 ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-surface-variant/50 animate-pulse rounded-[3rem]" />
                            ))}
                        </div>
                    ) : filteredData.length > 0 ? (
                        filteredData.map((inv: any) => {
                            const hasMissingCost = !inv.total_cost || Number(inv.total_cost) === 0;
                            const isProfitable = Number(inv.total_profit) > 0;

                            return (
                                <div
                                    key={inv.id}
                                    className={`relative group rounded-[3.2rem] p-1 transition-all duration-300 ${hasMissingCost
                                        ? 'bg-gradient-to-l from-amber-500/10 to-transparent hover:from-amber-500/20'
                                        : 'bg-white/40 hover:bg-white/60'
                                        }`}
                                >
                                    <div className={`
                                        flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 
                                        rounded-[3rem] bg-white/60 backdrop-blur-sm border 
                                        ${hasMissingCost ? 'border-amber-500/30' : 'border-primary/20'} 
                                        transition-all
                                    `}>
                                        {/* Left: Icon & Info */}
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className={`
                                                w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 shadow-inner
                                                ${hasMissingCost ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}
                                            `}>
                                                <Receipt size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-foreground truncate">{inv.client_name}</h3>
                                                    <span className="text-xs font-mono text-secondary/40">#{inv.invoice_id}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-secondary/60 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {format(new Date(inv.date), 'yyyy-MM-dd')}
                                                    </span>
                                                    {Boolean(inv.total_cost) && Number(inv.total_cost) > 0 && (
                                                        <span className="text-secondary/40 font-mono text-xs bg-surface-variant px-2 py-0.5 rounded-full">
                                                            ت: {Number(inv.total_cost).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Status Warning if missing cost */}
                                        {hasMissingCost && (
                                            <div className="hidden md:flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                                                <AlertCircle size={16} />
                                                <span className="text-xs font-bold">يرجى تحديد التكلفة</span>
                                            </div>
                                        )}

                                        {/* Right: Profit & Actions */}
                                        <div className="flex items-center justify-between w-full md:w-auto gap-6 pl-2">
                                            <div className="text-left">
                                                <div className="text-xs text-secondary/50 mb-1 font-medium">صافي الربح</div>
                                                <div className={`font-black text-xl font-mono ${isProfitable ? 'text-green-600' : hasMissingCost ? 'text-amber-600' : 'text-red-500'}`}>
                                                    {hasMissingCost ? '--' : Number(inv.total_profit).toLocaleString()}
                                                    <span className="text-xs mr-1 opacity-50">ج.م</span>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => handleOpenEdit(inv)}
                                                size="icon"
                                                variant="ghost"
                                                className={`
                                                    rounded-full w-10 h-10 transition-all 
                                                    ${hasMissingCost
                                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                        : 'bg-surface-variant hover:bg-primary hover:text-white'}
                                                `}
                                            >
                                                {hasMissingCost ? <Edit2 size={18} /> : <ArrowUpRight size={18} />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-surface-variant/30 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary/30">
                                <Receipt size={40} />
                            </div>
                            <h3 className="font-bold text-xl text-secondary/70">لا توجد فواتير</h3>
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
                                className="rounded-full px-8 hover:bg-white/50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'تحميل المزيد'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Costs Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    fetchData(1); // Refresh on close
                }}
                title="تعديل التكاليف"
                className="max-w-[600px]"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-2xl text-primary">
                                <Edit2 size={20} />
                            </div>
                            <span className="font-bold text-lg text-secondary">قائمة بنود الفاتورة</span>
                        </div>
                        <Badge variant="outline" className="font-mono bg-white/50 border-primary/20 px-3 py-1 rounded-full">#{selectedInvoice?.invoice_id}</Badge>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                        {isLoadingItems ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                            </div>
                        ) : invoiceItems.length > 0 ? (
                            <div className="grid gap-3">
                                {invoiceItems.map((item) => (
                                    <div key={item.item_id} className="group p-4 bg-black/[0.02] hover:bg-black/[0.04] border border-primary/10 rounded-[2rem] transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="font-bold text-secondary text-sm">{item.item_description}</div>
                                            <Badge variant="secondary" className="font-mono bg-white text-[10px] px-2">
                                                x{item.quantity}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-secondary/40 uppercase px-2">سعر التكلفة (للقطعة)</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        defaultValue={item.cost_price || ''}
                                                        className={`h-11 rounded-full bg-white border-primary/20 focus:border-primary transition-all font-mono text-right dir-rtl ${!item.cost_price ? 'ring-2 ring-amber-500/20' : ''}`}
                                                        placeholder="0.00"
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val) && val !== item.cost_price) {
                                                                handleUpdateCost(item.item_id, val);
                                                            }
                                                        }}
                                                    />
                                                    <span className="absolute left-3 top-3 text-[10px] text-secondary/30 font-bold">ج.م</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 opacity-60">
                                                <Label className="text-[10px] font-black text-secondary/40 uppercase px-2">سعر البيع</Label>
                                                <div className="h-11 flex items-center justify-end px-5 bg-black/5 rounded-full font-mono font-black text-xs text-secondary/60">
                                                    {Number(item.sale_price).toLocaleString()} ج.م
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-secondary/40 font-bold">لا توجد منتجات لتعديل التكلفة</div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-primary/10 flex gap-3 mt-4">
                        <Button
                            onClick={() => setIsEditModalOpen(false)}
                            className="w-full h-12 rounded-full font-black bg-primary text-white active:scale-[0.98] transition-all"
                        >
                            حفظ وإغلاق
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
