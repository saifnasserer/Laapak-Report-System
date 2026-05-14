'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Search, Plus, ShoppingCart, Edit, Trash2, CheckCircle2, Share2, MoreHorizontal, X, Check, Package, RefreshCw, Copy, Calendar, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import Image from 'next/image';

import api from '@/lib/api';
import { use } from 'react';
import { cn } from '@/lib/utils';
import { WhatsAppShareModal } from '@/components/reports/WhatsAppShareModal';
import { PaymentMethodModal } from '@/components/invoices/PaymentMethodModal';
import { TrackingCodeModal } from '@/components/reports/TrackingCodeModal';
import CartItemsPopover from '@/components/reports/CartItemsPopover';

const STATUS_TABS = [
    { key: 'all', label: 'الكل' },
    { key: 'pending', label: 'قيد الانتظار' },
    { key: 'shipped', label: 'تم الشحن' },
    { key: 'completed', label: 'مكتمل' },
    { key: 'cancelled', label: 'ملغي' },
] as const;

const CLIENT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function getInitials(name: string) {
    return (name || '').charAt(0).toUpperCase();
}

function getClientColor(name: string) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                <td key={c} className="px-4 py-5">
                    <div className="h-5 bg-black/[0.03] rounded-lg" style={{ width: c === 3 ? '80%' : c === 2 ? '60%' : '70%' }} />
                </td>
            ))}
        </tr>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-white/60 border border-black/5 p-4 rounded-2xl animate-pulse space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/[0.03]" />
                    <div className="space-y-2">
                        <div className="h-4 w-28 bg-black/[0.03] rounded-lg" />
                        <div className="h-3 w-20 bg-black/[0.02] rounded-lg" />
                    </div>
                </div>
                <div className="h-8 w-24 bg-black/[0.03] rounded-full" />
            </div>
            <div className="flex gap-2">
                <div className="h-8 flex-1 bg-black/[0.03] rounded-full" />
                <div className="h-8 flex-1 bg-black/[0.03] rounded-full" />
            </div>
        </div>
    );
}

export default function ReportsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('dashboard.reports');
    const [searchTerm, setSearchTerm] = useState('');
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

    // Month filter
    const now = new Date();
    const [filterYear, setFilterYear] = useState(now.getFullYear());
    const [filterMonth, setFilterMonth] = useState(now.getMonth());
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // WhatsApp Share State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [reportToShare, setReportToShare] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: string, needsInvoice?: boolean } | null>(null);
    const [pendingShippedUpdate, setPendingShippedUpdate] = useState<{ id: string, status: string } | null>(null);

    // Bulk WhatsApp
    const [bulkShareModalOpen, setBulkShareModalOpen] = useState(false);

    // Action Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    // Cart Popover State
    const [cartPopoverOpen, setCartPopoverOpen] = useState(false);
    const [cartAnchorEl, setCartAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedCartItems, setSelectedCartItems] = useState<any[]>([]);

    const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeMenuId === id) {
            setActiveMenuId(null);
            setMenuPosition(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveMenuId(id);
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
            });
        }
    };

    React.useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenuId(null);
            setMenuPosition(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleShareClick = (report: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setReportToShare(report);
        setShareModalOpen(true);
        setActiveMenuId(null);
        setMenuPosition(null);
    };

    React.useEffect(() => {
        const fetchReports = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/reports?fetch_mode=all_reports`);
                setReports(response.data);
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch reports:', err);
                setError('فشل في تحميل التقارير. يرجى المحاولة لاحقاً.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    const statusMap: any = {
        'completed': { label: 'مكتمل', variant: 'success' },
        'مكتمل': { label: 'مكتمل', variant: 'success' },
        'pending': { label: 'قيد الانتظار', variant: 'warning' },
        'قيد الانتظار': { label: 'قيد الانتظار', variant: 'warning' },
        'active': { label: 'قيد الانتظار', variant: 'warning' },
        'نشط': { label: 'قيد الانتظار', variant: 'warning' },
        'shipped': { label: 'تم الشحن', variant: 'primary' },
        'تم الشحن': { label: 'تم الشحن', variant: 'primary' },
        'cancelled': { label: 'ملغي', variant: 'destructive' },
        'ملغي': { label: 'ملغي', variant: 'destructive' },
        'ملغى': { label: 'ملغي', variant: 'destructive' },
        'new_order': { label: 'طلب خارجي', variant: 'primary' },
    };

    const getStatusInfo = (status: string) => {
        return statusMap[status] || { label: status || 'غير معروف', variant: 'outline' };
    };

    const handleStatusChange = async (reportId: string, newStatus: string, paymentMethod?: string, shippingData?: { trackingCode: string, trackingMethod: string }) => {
        try {
            const statusMapToEng: any = {
                'قيد الانتظار': 'pending',
                'مكتمل': 'completed',
                'تم الشحن': 'shipped',
                'ملغي': 'cancelled',
                'طلب خارجي': 'new_order'
            };
            const engStatus = statusMapToEng[newStatus] || newStatus;

            if (engStatus === 'completed' && !paymentMethod) {
                const report = reports.find(r => r.id === reportId);
                const needsInvoice = !report?.invoice_created;
                setPendingStatusUpdate({ id: reportId, status: newStatus, needsInvoice });
                setShowPaymentModal(true);
                return;
            }

            if (engStatus === 'shipped' && !shippingData) {
                setPendingShippedUpdate({ id: reportId, status: newStatus });
                setShowTrackingModal(true);
                return;
            }

            if (engStatus === 'completed' && pendingStatusUpdate?.needsInvoice) {
                const report = reports.find(r => r.id === reportId);
                if (report) {
                    let extraItems: any[] = [];
                    try {
                        if (report.invoice_items) {
                            extraItems = typeof report.invoice_items === 'string'
                                ? JSON.parse(report.invoice_items)
                                : Array.isArray(report.invoice_items) ? report.invoice_items : [];
                        }
                        if (Array.isArray(report.selected_accessories) && report.selected_accessories.length > 0) {
                            const accessories = report.selected_accessories.map((item: any) => ({
                                name: typeof item === 'object' && item !== null ? (item.name || item.description || 'بند غير معروف') : item,
                                price: typeof item === 'object' && item !== null ? (item.price || item.regular_price || 0) : 0,
                                quantity: typeof item === 'object' && item !== null ? (item.quantity || 1) : 1
                            }));
                            accessories.forEach((acc: any) => {
                                const exists = extraItems.some((ei: any) => ei.name === acc.name);
                                if (!exists) extraItems.push(acc);
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing report invoice_items', e);
                    }

                    const allItems = [
                        {
                            description: report.device_model,
                            amount: report.amount || 0,
                            quantity: 1,
                            totalAmount: report.amount || 0,
                            report_id: report.id,
                            cost_price: report.device_price || 0
                        },
                        ...extraItems.map((item: any) => ({
                            description: item.name || 'بند إضافي',
                            amount: item.price || 0,
                            quantity: item.quantity || 1,
                            totalAmount: (item.price || 0) * (item.quantity || 1),
                            report_id: report.id,
                            cost_price: 0
                        }))
                    ];

                    const calculatedTotal = allItems.reduce((acc, current) => acc + Number(current.totalAmount), 0);

                    const invoiceData = {
                        client_id: report.client_id,
                        date: new Date(),
                        report_ids: [report.id],
                        subtotal: calculatedTotal,
                        taxRate: 0,
                        tax: 0,
                        discount: 0,
                        total: calculatedTotal,
                        paymentStatus: 'completed',
                        paymentMethod: paymentMethod || 'cash',
                        items: allItems
                    };
                    await api.post('/invoices', invoiceData);
                }
            }

            await api.put(`/reports/${reportId}`, {
                status: engStatus,
                paymentMethod: paymentMethod || 'cash',
                ...(shippingData?.trackingCode && { tracking_code: shippingData.trackingCode }),
                ...(shippingData?.trackingMethod && { tracking_method: shippingData.trackingMethod })
            });

            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: engStatus } : r));

            if (engStatus === 'completed') {
                setShowPaymentModal(false);
                setPendingStatusUpdate(null);
            }

            if (engStatus === 'shipped') {
                setShowTrackingModal(false);
                setPendingShippedUpdate(null);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('فشل في تحديث حالة التقرير');
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        try {
            await api.delete(`/reports/${reportId}`);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            console.error('Failed to delete report:', err);
            alert('فشل في حذف التقرير');
        }
    };

    const handleDuplicateReport = async (reportId: string | number) => {
        try {
            const response = await api.get(`/reports/${reportId}`);
            const sourceReport = response.data.report;

            const {
                id, created_at, updated_at, inspection_date,
                createdAt, updatedAt, inspectionDate,
                invoice_id, invoice_created, invoice_date, is_confirmed,
                client, supplier, creator, invoiceItems, relatedInvoices,
                ...clonedData
            } = sourceReport;

            const duplicatePayload = {
                ...clonedData,
                status: 'pending',
                is_confirmed: false,
                notes: (clonedData.notes || '') + '\n(Duplicate of #' + id + ')',
                inspection_date: null
            };

            const createResponse = await api.post('/reports', duplicatePayload);
            const newReport = createResponse.data;

            setReports(prev => [newReport, ...prev]);
            alert('تم تكرار التقرير بنجاح');
            setActiveMenuId(null);
        } catch (err) {
            console.error('Failed to duplicate report:', err);
            alert('فشل في تكرار التقرير');
        }
    };

    const isPendingReport = (report: any) => {
        const status = (report.status || '').toLowerCase();
        return status === 'pending' || status === 'waiting' || status === 'قيد الانتظار' || status === 'انتظار' || status === 'active' || status === 'نشط' || status === 'new_order';
    };

    const getStatusGroup = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'pending' || s === 'قيد الانتظار' || s === 'انتظار' || s === 'active' || s === 'نشط' || s === 'new_order' || s === 'طلب خارجي') return 'pending';
        if (s === 'shipped' || s === 'تم الشحن') return 'shipped';
        if (s === 'completed' || s === 'مكتمل') return 'completed';
        if (s === 'cancelled' || s === 'ملغي' || s === 'ملغى') return 'cancelled';
        return 'other';
    };

    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            if (report.client_name?.toLowerCase() === 'laapak') return false;

            const term = searchTerm.toLowerCase();

            const matchesSearch = term === '' || (
                report.order_number?.toLowerCase().includes(term) ||
                report.client_name?.toLowerCase().includes(term) ||
                report.device_model?.toLowerCase().includes(term) ||
                report.serial_number?.toLowerCase().includes(term) ||
                report.id?.toString().includes(term) ||
                report.client_phone?.toLowerCase().includes(term) ||
                report.client_email?.toLowerCase().includes(term) ||
                report.status?.toLowerCase().includes(term)
            );
            if (!matchesSearch) return false;

            if (statusFilter !== 'all') {
                return getStatusGroup(report.status) === statusFilter;
            }

            if (term === '') {
                const reportDate = report.inspection_date || report.inspectionDate || report.created_at || report.createdAt;
                const isCurrentMonth = reportDate && (
                    new Date(reportDate).getMonth() === filterMonth &&
                    new Date(reportDate).getFullYear() === filterYear
                );
                return isPendingReport(report) || isCurrentMonth;
            }

            return true;
        });
    }, [reports, searchTerm, statusFilter, filterMonth, filterYear]);

    const toggleSelectReport = (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const report = filteredReports.find(r => r.id === reportId);
        if (!report) return;

        setSelectedReportIds(prev => {
            if (prev.includes(reportId)) {
                return prev.filter(id => id !== reportId);
            }
            if (prev.length > 0) {
                const firstSelectedId = prev[0];
                const firstSelectedReport = reports.find(r => r.id === firstSelectedId);
                if (firstSelectedReport && firstSelectedReport.client_id !== report.client_id) {
                    alert('لا يمكن تحديد تقارير لعملاء مختلفين في نفس الفاتورة.');
                    return prev;
                }
            }
            return [...prev, reportId];
        });
    };

    const toggleSelectAll = () => {
        if (selectedReportIds.length > 0) {
            setSelectedReportIds([]);
            return;
        }
        const eligibleReports = filteredReports.filter(r => !r.invoice_created && !r.invoice_id);
        if (eligibleReports.length === 0) return;
        const firstReport = eligibleReports[0];
        const sameClientReports = eligibleReports.filter(r => r.client_id === firstReport.client_id);
        setSelectedReportIds(sameClientReports.map(r => r.id));
    };

    const handleCreateInvoice = () => {
        if (selectedReportIds.length === 0) return;
        const urlArgs = selectedReportIds.join(',');
        window.location.href = `/${locale}/dashboard/admin/invoices/new?reportIds=${urlArgs}`;
    };

    const handleBulkShare = () => {
        if (selectedReportIds.length === 0) return;
        setBulkShareModalOpen(true);
    };

    const navigateMonth = (dir: number) => {
        let m = filterMonth + dir;
        let y = filterYear;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setFilterMonth(m);
        setFilterYear(y);
    };

    const renderStatusSelect = (report: any) => (
        <select
            value={report.status === 'pending' || report.status === 'انتظار' || report.status === 'نشط' || report.status === 'active' ? 'قيد الانتظار' :
                report.status === 'completed' ? 'مكتمل' :
                    report.status === 'shipped' ? 'تم الشحن' :
                        report.status === 'new_order' ? 'طلب خارجي' :
                            report.status === 'cancelled' || report.status === 'ملغى' ? 'ملغي' : report.status}
            onChange={(e) => handleStatusChange(report.id, e.target.value)}
            className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-black border outline-none transition-all cursor-pointer appearance-none text-center min-w-[100px]",
                report.status === 'completed' || report.status === 'مكتمل' ? "bg-green-100 text-green-600 border-green-200" :
                    report.status === 'shipped' || report.status === 'تم الشحن' ? "bg-blue-100 text-blue-600 border-blue-200" :
                        report.status === 'pending' || report.status === 'قيد الانتظار' || report.status === 'انتظار' || report.status === 'active' || report.status === 'نشط' ? "bg-yellow-100 text-yellow-600 border-yellow-200" :
                            report.status === 'new_order' ? "bg-primary/10 text-primary border-primary/20" :
                                report.status === 'cancelled' || report.status === 'ملغي' || report.status === 'ملغى' ? "bg-red-100 text-red-600 border-red-200" :
                                    "bg-primary/10 text-primary border-primary/20"
            )}
        >
            <option value="طلب خارجي">طلب خارجي</option>
            <option value="قيد الانتظار">قيد الانتظار</option>
            <option value="تم الشحن">تم الشحن</option>
            <option value="مكتمل">مكتمل</option>
            <option value="ملغي">ملغي</option>
        </select>
    );

    const renderDetailsCell = (report: any) => {
        let items: any[] = [];
        try {
            if (typeof report.invoice_items === 'string') {
                items = JSON.parse(report.invoice_items);
            } else if (Array.isArray(report.invoice_items)) {
                items = report.invoice_items;
            } else if (Array.isArray(report.selected_accessories) && report.selected_accessories.length > 0) {
                items = report.selected_accessories.map((item: any, index: number) => ({
                    id: Date.now() + index,
                    name: typeof item === 'object' && item !== null ? (item.name || item.description || 'بند غير معروف') : item,
                    quantity: typeof item === 'object' && item !== null ? (item.quantity || 1) : 1,
                    price: typeof item === 'object' && item !== null ? (item.price || item.regular_price || 0) : 0
                }));
            }
        } catch (e) {
            console.error("Failed to parse invoice_items for report:", report.id);
        }

        return (
            <div className="flex items-center gap-2">
                {items.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCartItems(items);
                            setCartAnchorEl(e.currentTarget);
                            setCartPopoverOpen(true);
                        }}
                        className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-all shadow-sm ring-1 ring-primary/20 shrink-0 hover:bg-primary/20 hover:scale-110 cursor-pointer"
                        title="عرض التفاصيل الإضافية للبند"
                    >
                        <ShoppingCart size={12} />
                    </button>
                )}

                {(report.is_confirmed || report.status === 'completed' || report.status === 'مكتمل') && (
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 transition-all shadow-sm ring-1 ring-green-200 shrink-0" title="مؤكد">
                        <CheckCircle2 size={12} />
                    </div>
                )}

                {report.payment_method && (
                    <div
                        className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shrink-0"
                        title={
                            report.payment_method === 'instapay' ? 'InstaPay' :
                                report.payment_method === 'vodafone_cash' || report.payment_method === 'wallet' ? 'Wallet' : 'Cash'
                        }
                    >
                        <Image
                            src={
                                report.payment_method === 'instapay' ? '/images/payment-methods/instapay.png' :
                                    report.payment_method === 'vodafone_cash' || report.payment_method === 'wallet' ? '/images/payment-methods/wallet.svg' :
                                        '/images/payment-methods/cash.svg'
                            }
                            alt={report.payment_method}
                            width={24}
                            height={24}
                            className="object-contain"
                        />
                    </div>
                )}

                {!items.length && !report.is_confirmed && report.status !== 'completed' && report.status !== 'مكتمل' && !report.payment_method && (
                    <span className="text-secondary/20 text-xs">-</span>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight">تقارير فحص الأجهزة</h1>
                    <p className="text-secondary text-xs md:text-sm font-medium">إدارة ومتابعة جميع تقارير فحص الأجهزة والمواصفات</p>
                </div>

                {/* Filter Tabs + Search + Month Picker */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap",
                                    statusFilter === tab.key
                                        ? "bg-primary text-white shadow-sm"
                                        : "bg-white border border-black/5 text-secondary/60 hover:bg-black/[0.02] hover:text-secondary"
                                )}
                            >
                                {tab.label}
                                {tab.key !== 'all' && (
                                    <span className="mr-1.5 opacity-60">
                                        {reports.filter(r => getStatusGroup(r.status) === tab.key).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 self-center sm:self-auto">
                        <Input
                            placeholder="بحث..."
                            icon={<Search size={14} />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white h-8 rounded-full text-xs w-32 md:w-40"
                        />
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-secondary/40 hover:text-secondary transition-all"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => setShowMonthPicker(!showMonthPicker)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/5 text-xs font-bold text-secondary hover:border-primary/20 transition-all"
                        >
                            <Calendar size={14} className="text-primary" />
                            {monthNames[filterMonth]} {filterYear}
                        </button>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-secondary/40 hover:text-secondary transition-all"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Card className="overflow-visible">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-black/[0.03]">
                                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                                <th key={i} className="px-4 py-4"><div className="h-4 bg-black/[0.02] rounded-lg w-16" /></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
                                    </tbody>
                                </table>
                            ) : error ? (
                                <div className="p-12 text-center text-destructive font-bold">{error}</div>
                            ) : filteredReports.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-secondary/20">
                                        <Package size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">لا توجد تقارير</h3>
                                        <p className="text-secondary/60 text-sm font-medium">لم يتم العثور على تقارير تطابق معايير البحث</p>
                                    </div>
                                </div>
                            ) : (
                                <Table headers={[
                                    <div key="checkbox" className="flex justify-center items-center relative h-5 w-5">
                                        <input
                                            type="checkbox"
                                            className="peer w-5 h-5 rounded-full border-2 border-gray-300 checked:bg-primary checked:border-primary cursor-pointer appearance-none transition-all duration-200"
                                            checked={filteredReports.some(r => !r.invoice_created && !r.invoice_id) && selectedReportIds.length === filteredReports.filter(r => !r.invoice_created && !r.invoice_id).length}
                                            onChange={toggleSelectAll}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <Check size={12} strokeWidth={3} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                    </div>,
                                    'التاريخ', 'العميل', 'الجهاز', 'الحالة', 'التفاصيل', ''
                                ]} wrapperClassName="overflow-visible">
                                    {filteredReports.map((report) => {
                                        const statusInfo = getStatusInfo(report.status);
                                        const isSelectable = !report.invoice_created && !report.invoice_id;
                                        const isSelected = selectedReportIds.includes(report.id);
                                        const clientColor = getClientColor(report.client_name);

                                        return (
                                            <TableRow key={report.id} onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/${report.id}`} className={`cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}>
                                                <TableCell className="w-10 text-center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                    {isSelectable && (
                                                        <div className="flex justify-center relative h-5 w-5 mx-auto">
                                                            <input
                                                                type="checkbox"
                                                                className="peer w-5 h-5 rounded-full border-2 border-gray-300 checked:bg-primary checked:border-primary cursor-pointer appearance-none transition-all duration-200"
                                                                checked={isSelected}
                                                                onChange={(e) => { e.stopPropagation(); }}
                                                                onClick={(e) => toggleSelectReport(report.id, e)}
                                                            />
                                                            <Check size={12} strokeWidth={3} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-secondary text-xs">
                                                    {new Date(report.inspection_date || report.created_at || report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                </TableCell>
                                                <TableCell className="font-semibold text-sm">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                                                            style={{ backgroundColor: clientColor }}
                                                        >
                                                            {getInitials(report.client_name)}
                                                        </div>
                                                        <span>{report.client_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-secondary font-medium min-w-[180px] max-w-[250px] truncate">{report.device_model}</TableCell>
                                                <TableCell className="text-center align-middle" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                    <div className="flex justify-center">
                                                        {renderStatusSelect(report)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center align-middle p-0 min-w-[140px]">
                                                    <div className="flex justify-center">
                                                        {renderDetailsCell(report)}
                                                    </div>
                                                </TableCell>
                                                <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                    <div className="flex justify-end items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-9 h-9 p-0 rounded-full text-[#25D366] hover:bg-[#25D366]/10"
                                                            onClick={(e) => handleShareClick(report, e)}
                                                            title="مشاركة واتساب"
                                                        >
                                                            <Share2 size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-9 h-9 p-0 rounded-full"
                                                            onClick={(e) => toggleMenu(report.id, e)}
                                                        >
                                                            <MoreHorizontal size={20} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {isLoading ? (
                        [1, 2, 3].map(i => <SkeletonCard key={i} />)
                    ) : error ? (
                        <div className="p-12 text-center text-destructive font-bold">{error}</div>
                    ) : filteredReports.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-white/40 rounded-2xl border border-dashed border-black/10">
                            <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-secondary/20">
                                <Package size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">لا توجد تقارير</h3>
                                <p className="text-secondary/60 text-sm font-medium">لم يتم العثور على تقارير تطابق معايير البحث</p>
                            </div>
                        </div>
                    ) : (
                        filteredReports.map((report) => {
                            const isSelectable = !report.invoice_created && !report.invoice_id;
                            const isSelected = selectedReportIds.includes(report.id);
                            const clientColor = getClientColor(report.client_name);

                            return (
                                <div
                                    key={report.id}
                                    onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/${report.id}`}
                                    className={cn(
                                        "bg-white/60 border p-4 rounded-2xl transition-all",
                                        isSelected ? "border-primary/30 bg-primary/5" : "border-black/5"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {isSelectable && (
                                                <div className="relative h-5 w-5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="peer w-5 h-5 rounded-full border-2 border-gray-300 checked:bg-primary checked:border-primary cursor-pointer appearance-none transition-all duration-200"
                                                        checked={isSelected}
                                                        onChange={() => { }}
                                                        onClick={(e) => toggleSelectReport(report.id, e)}
                                                    />
                                                    <Check size={12} strokeWidth={3} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                                </div>
                                            )}
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                style={{ backgroundColor: clientColor }}
                                            >
                                                {getInitials(report.client_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{report.client_name}</p>
                                                <p className="text-[11px] text-secondary/50 truncate">{report.device_model}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 rounded-full text-[#25D366] hover:bg-[#25D366]/10"
                                                onClick={(e) => handleShareClick(report, e)}
                                                title="مشاركة واتساب"
                                            >
                                                <Share2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 rounded-full"
                                                onClick={(e) => toggleMenu(report.id, e)}
                                            >
                                                <MoreHorizontal size={18} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-[10px] text-secondary/50">
                                            <Calendar size={12} />
                                            {new Date(report.inspection_date || report.created_at || report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {renderStatusSelect(report)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/[0.03]">
                                        {renderDetailsCell(report)}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.location.href = `/${locale}/dashboard/admin/reports/${report.id}/edit`; }}
                                                className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center text-secondary/40 hover:text-primary transition-all"
                                                title="تعديل"
                                            >
                                                <Edit size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDuplicateReport(report.id); }}
                                                className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center text-secondary/40 hover:text-primary transition-all"
                                                title="تكرار"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Floating Action Bar */}
                {selectedReportIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-black/5 shadow-2xl rounded-[2rem] md:rounded-full px-4 md:px-6 py-3 flex flex-wrap md:flex-nowrap items-center justify-center gap-3 md:gap-4 z-50 animate-in slide-in-from-bottom-4 duration-300 w-[95%] md:w-auto">
                        <span className="font-bold text-sm">
                            تم تحديد <span className="text-primary">{selectedReportIds.length}</span> تقرير
                        </span>
                        <div className="h-6 w-[1px] bg-black/10" />

                        <Button
                            size="sm"
                            onClick={handleBulkShare}
                            className="rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90 font-bold px-4 shadow-sm text-xs"
                            icon={<Smartphone size={16} />}
                        >
                            واتساب للكل
                        </Button>

                        <Button
                            size="sm"
                            onClick={async () => {
                                if (!confirm('هل أنت متأكد من نقل التقارير المحددة إلى المخزن (Laapak)؟')) return;
                                try {
                                    let laapakClient;
                                    const clientsResponse = await api.get('/clients?search=Laapak');
                                    const clients = clientsResponse.data.clients || [];
                                    laapakClient = clients.find((c: any) => c.name.toLowerCase() === 'laapak' || c.name === 'لابك');
                                    if (!laapakClient) {
                                        const createResponse = await api.post('/clients', {
                                            name: 'Laapak',
                                            phone: '0000000000',
                                            email: 'warehouse@laapak.com',
                                            address: 'Laapak Warehouse',
                                            orderCode: 'LPK0000'
                                        });
                                        laapakClient = createResponse.data;
                                    }
                                    const source = prompt('أدخل تفاصيل المصدر (اختياري):', '');
                                    const sourceNote = source ? `\nSource: ${source}` : '';
                                    await Promise.all(selectedReportIds.map(id =>
                                        api.put(`/reports/${id}`, {
                                            client_id: laapakClient.id,
                                            client_name: laapakClient.name,
                                            notes: (reports.find(r => r.id === id)?.notes || '') + sourceNote,
                                            payment_method: '',
                                            is_confirmed: false,
                                            selected_accessories: JSON.stringify([]),
                                            invoice_items: JSON.stringify([]),
                                            billing_enabled: false,
                                            amount: 0,
                                            invoice_id: null,
                                            status: 'pending'
                                        })
                                    ));
                                    setReports(prev => prev.map(r =>
                                        selectedReportIds.includes(r.id)
                                            ? { ...r, client_id: laapakClient.id, client_name: laapakClient.name, notes: (r.notes || '') + sourceNote, payment_method: null, is_confirmed: false, selected_accessories: [], invoice_items: [], billing_enabled: false, amount: 0, invoice_id: null, status: 'pending' }
                                            : r
                                    ));
                                    setSelectedReportIds([]);
                                    alert('تم نقل التقارير للمخزون بنجاح');
                                } catch (err) {
                                    console.error('Failed to move to inventory:', err);
                                    alert('فشل في نقل التقارير للمخزون');
                                }
                            }}
                            className="rounded-full bg-secondary text-white hover:bg-secondary/90 font-bold px-4 shadow-lg shadow-black/5 text-xs"
                            icon={<Package size={16} />}
                        >
                            نقل للمخزون
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleCreateInvoice}
                            className="rounded-full bg-primary text-white hover:bg-primary/90 font-bold px-5 shadow-lg shadow-primary/20"
                            icon={<Plus size={16} />}
                        >
                            فاتورة مجمعة
                        </Button>

                        <button
                            onClick={() => setSelectedReportIds([])}
                            className="p-2 hover:bg-black/5 rounded-full text-secondary transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Modals */}
                <WhatsAppShareModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    report={reportToShare}
                    locale={locale}
                />

                <WhatsAppShareModal
                    isOpen={bulkShareModalOpen}
                    onClose={() => setBulkShareModalOpen(false)}
                    report={selectedReportIds.length > 0 ? filteredReports.find(r => r.id === selectedReportIds[0]) : null}
                    locale={locale}
                />

                <PaymentMethodModal
                    isOpen={showPaymentModal}
                    onClose={() => { setShowPaymentModal(false); setPendingStatusUpdate(null); window.location.reload(); }}
                    onConfirm={(method) => { if (pendingStatusUpdate) { handleStatusChange(pendingStatusUpdate.id, pendingStatusUpdate.status, method); } }}
                    showInvoiceWarning={pendingStatusUpdate?.needsInvoice}
                />

                <TrackingCodeModal
                    isOpen={showTrackingModal}
                    onClose={() => { setShowTrackingModal(false); setPendingShippedUpdate(null); window.location.reload(); }}
                    onConfirm={(data) => { if (pendingShippedUpdate) { handleStatusChange(pendingShippedUpdate.id, pendingShippedUpdate.status, undefined, data); } }}
                    report={reports.find(r => r.id === (pendingShippedUpdate?.id))}
                />
            </div>

            {/* Portal Action Menu */}
            {activeMenuId && menuPosition && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] bg-white border border-black/5 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[12rem]"
                    style={{ top: menuPosition.top + 8, left: menuPosition.left - 150 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between gap-3"
                        onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/${activeMenuId}/edit`}
                    >
                        <span>تعديل التقرير</span>
                        <Edit size={16} className="text-primary" />
                    </button>
                    {(() => {
                        const report = reports.find(r => r.id === activeMenuId);
                        const isCompleted = report?.status === 'completed' || report?.status === 'مكتمل';
                        if (!isCompleted) return null;
                        return (
                            <button
                                className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between gap-3 text-primary"
                                onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/${activeMenuId}/edit?mode=update`}
                            >
                                <span>تحديث التقرير (History)</span>
                                <RefreshCw size={16} className="text-primary" />
                            </button>
                        );
                    })()}
                    <button
                        className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between gap-3"
                        onClick={(e) => { const report = reports.find(r => r.id === activeMenuId); if (report) handleShareClick(report, e); }}
                    >
                        <span className="text-[#25D366]">مشاركة واتساب</span>
                        <Share2 size={16} className="text-[#25D366]" />
                    </button>
                    <button
                        className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between gap-3"
                        onClick={() => { handleDuplicateReport(activeMenuId); }}
                    >
                        <span>تكرار التقرير (Duplicate)</span>
                        <Copy size={16} className="text-primary" />
                    </button>
                    <div className="h-[1px] bg-black/5 mx-2 my-1" />
                    <button
                        className="w-full text-right px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-between gap-3"
                        onClick={() => { handleDeleteReport(activeMenuId); setActiveMenuId(null); }}
                    >
                        <span>حذف التقرير</span>
                        <Trash2 size={16} className="text-destructive" />
                    </button>
                </div>,
                document.body
            )}

            <CartItemsPopover
                items={selectedCartItems}
                isOpen={cartPopoverOpen}
                onClose={() => { setCartPopoverOpen(false); setCartAnchorEl(null); setSelectedCartItems([]); }}
                anchorEl={cartAnchorEl}
            />
        </DashboardLayout>
    );
}
