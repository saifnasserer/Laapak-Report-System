'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Search, Plus, Filter, Download, MoreVertical, ShoppingCart, Edit, Trash2, CheckCircle2, Share2, MoreHorizontal, X, Check, Package } from 'lucide-react';
import Image from 'next/image';

import api from '@/lib/api';
import { use } from 'react';
import { cn } from '@/lib/utils';
import { WhatsAppShareModal } from '@/components/reports/WhatsAppShareModal';
import { PaymentMethodModal } from '@/components/invoices/PaymentMethodModal';
import { TrackingCodeModal } from '@/components/reports/TrackingCodeModal';
import CartItemsPopover from '@/components/reports/CartItemsPopover';

export default function ReportsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('dashboard.reports');
    const [searchTerm, setSearchTerm] = useState('');
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

    // WhatsApp Share State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [reportToShare, setReportToShare] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: string, needsInvoice?: boolean } | null>(null);
    const [pendingShippedUpdate, setPendingShippedUpdate] = useState<{ id: string, status: string } | null>(null);

    // Action Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    // Cart Popover State
    const [cartPopoverOpen, setCartPopoverOpen] = useState(false);
    const [cartAnchorEl, setCartAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedCartItems, setSelectedCartItems] = useState<any[]>([]);

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

    // Close menu when clicking outside
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
                const response = await api.get(`/reports?fetch_mode=all_reports${showAll ? '' : '&exclude_inventory=true'}`);
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
    }, [showAll]);

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
            // Map Arabic status from select back to English for API
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
                // Auto-create invoice first
                const report = reports.find(r => r.id === reportId);
                if (report) {
                    // Parse extra invoice items safely
                    let extraItems = [];
                    try {
                        if (report.invoice_items) {
                            extraItems = typeof report.invoice_items === 'string'
                                ? JSON.parse(report.invoice_items)
                                : Array.isArray(report.invoice_items) ? report.invoice_items : [];
                        }
                    } catch (e) {
                        console.error('Error parsing report invoice_items', e);
                    }

                    // Build all invoice items
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
                            quantity: 1,
                            totalAmount: item.price || 0,
                            report_id: report.id,
                            cost_price: 0 // Assume extra items don't have a tracked cost price unless specified
                        }))
                    ];

                    // Calculate total
                    const calculatedTotal = allItems.reduce((acc, current) => acc + Number(current.amount), 0);

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

    const isPendingReport = (report: any) => {
        const status = (report.status || '').toLowerCase();
        return status === 'pending' || status === 'waiting' || status === 'قيد الانتظار' || status === 'انتظار' || status === 'active' || status === 'نشط' || status === 'new_order';
    };

    const isReportInCurrentMonth = (report: any) => {
        const reportDate = report.inspection_date || report.inspectionDate || report.created_at || report.createdAt;
        if (!reportDate) return false;

        const date = new Date(reportDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const filteredReports = reports.filter(report => {
        const term = searchTerm.toLowerCase();

        // Search logic (matching reports.js)
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

        // If "Show All" is active, don't apply the default date/status filters
        if (showAll) return true;

        // Default Filter Logic: If no search term, show (Pending) OR (Current Month)
        if (term === '') {
            return isPendingReport(report) || isReportInCurrentMonth(report);
        }

        return true;
    });

    // Toggle selection of a single report
    const toggleSelectReport = (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Find the report to be toggled
        const report = filteredReports.find(r => r.id === reportId);
        if (!report) return;

        setSelectedReportIds(prev => {
            // Unselecting
            if (prev.includes(reportId)) {
                return prev.filter(id => id !== reportId);
            }

            // Selecting - Check if compatible with existing selection
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

    // Toggle select all eligible reports (restricted to single client)
    const toggleSelectAll = () => {
        // If items are selected, clear selection
        if (selectedReportIds.length > 0) {
            setSelectedReportIds([]);
            return;
        }

        // If no items selected, select all for the FIRST eligible client found
        const eligibleReports = filteredReports.filter(r => !r.invoice_created && !r.invoice_id);

        if (eligibleReports.length === 0) return;

        const firstReport = eligibleReports[0];
        const clientId = firstReport.client_id;

        const sameClientReports = eligibleReports.filter(r => r.client_id === clientId);

        if (sameClientReports.length < eligibleReports.length) {
            // Optional: Inform user that only one client's reports were selected
            // alert(`تم تحديد تقارير العميل: ${firstReport.client_name}`);
        }

        setSelectedReportIds(sameClientReports.map(r => r.id));
    };

    const handleCreateInvoice = () => {
        if (selectedReportIds.length === 0) return;
        const urlArgs = selectedReportIds.join(',');
        window.location.href = `/${locale}/dashboard/admin/invoices/new?reportIds=${urlArgs}`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">تقارير فحص الأجهزة</h1>
                        <p className="text-secondary font-medium">إدارة ومتابعة جميع تقارير فحص الأجهزة والمواصفات</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-full max-w-[240px]">
                            <Input
                                placeholder="البحث هنا..."
                                icon={<Search size={18} />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white h-11 rounded-full"
                            />
                        </div>
                        <Button
                            variant={showAll ? "primary" : "outline"}
                            size="md"
                            className={cn(
                                "w-11 h-11 p-0 rounded-full transition-all",
                                "bg-white border-black/10 text-foreground"
                            )}
                            onClick={() => setShowAll(!showAll)}
                            title={showAll ? "عرض التقارير الهامة فقط" : "عرض جميع التقارير"}
                        >
                            <Filter size={18} />
                        </Button>
                    </div>
                </div>

                <Card className="overflow-visible">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-secondary">جاري التحميل...</div>
                        ) : error ? (
                            <div className="p-12 text-center text-destructive font-bold">{error}</div>
                        ) : filteredReports.length === 0 ? (
                            <div className="p-12 text-center text-secondary">لا توجد تقارير حالياً</div>
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
                                            <TableCell className="font-semibold text-sm">{report.client_name}</TableCell>
                                            <TableCell className="text-secondary font-medium min-w-[180px] max-w-[250px] truncate">{report.device_model}</TableCell>
                                            <TableCell className="text-center align-middle" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <div className="flex justify-center">
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
                                                        <option value="طلب خارجي">🛒 طلب خارجي</option>
                                                        <option value="قيد الانتظار">⏳ قيد الانتظار</option>
                                                        <option value="تم الشحن">📦 تم الشحن</option>
                                                        <option value="مكتمل">✅ مكتمل</option>
                                                        <option value="ملغي">❌ ملغي</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center align-middle p-0 min-w-[140px]">
                                                <div className="flex justify-center items-center gap-2">
                                                    {/* Accessories / Invoice Items Icon - Clickable */}
                                                    {(() => {
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

                                                        if (!items || items.length === 0) return null;

                                                        return (
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
                                                        );
                                                    })()}

                                                    {/* Confirmation Badge */}
                                                    {(report.is_confirmed || report.status === 'completed' || report.status === 'مكتمل') && (
                                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 transition-all shadow-sm ring-1 ring-green-200 shrink-0" title="مؤكد">
                                                            <CheckCircle2 size={12} />
                                                        </div>
                                                    )}

                                                    {/* Payment Method Badge - Logo Only */}
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

                                                    {/* Placeholder if empty */}
                                                    {(!report.selected_accessories?.length && !report.is_confirmed && report.status !== 'completed' && report.status !== 'مكتمل' && !report.payment_method) && (
                                                        <span className="text-secondary/20 text-xs">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-10 h-10 p-0 rounded-full"
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

                {/* Floating Action Bar for Selected Reports */}
                {selectedReportIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-black/5 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
                        <span className="font-bold text-sm">
                            تم تحديد <span className="text-primary">{selectedReportIds.length}</span> تقرير
                        </span>
                        <div className="h-6 w-[1px] bg-black/10" />

                        <Button
                            size="sm"
                            onClick={async () => {
                                if (!confirm('هل أنت متأكد من نقل التقارير المحددة إلى المخزن (Laapak)؟')) return;

                                try {
                                    // 1. Find or Create Laapak Client
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

                                    // 2. Ask for Source Details
                                    const source = prompt('أدخل تفاصيل المصدر (اختياري):', '');
                                    const sourceNote = source ? `\nSource: ${source}` : '';

                                    // 3. Update Reports
                                    await Promise.all(selectedReportIds.map(id =>
                                        api.put(`/reports/${id}`, {
                                            client_id: laapakClient.id,
                                            client_name: laapakClient.name, // Update denormalized name
                                            notes: (reports.find(r => r.id === id)?.notes || '') + sourceNote
                                        })
                                    ));

                                    // 4. Update Local State
                                    setReports(prev => prev.map(r =>
                                        selectedReportIds.includes(r.id)
                                            ? { ...r, client_id: laapakClient.id, client_name: laapakClient.name, notes: r.notes + sourceNote }
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
                            نقل للمنخزون
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleCreateInvoice}
                            className="rounded-full bg-primary text-white hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/20"
                            icon={<Plus size={16} />}
                        >
                            إنشاء فاتورة مجمعة
                        </Button>
                        <button
                            onClick={() => setSelectedReportIds([])}
                            className="p-2 hover:bg-black/5 rounded-full text-secondary transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* WhatsApp Share Modal */}
                <WhatsAppShareModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    report={reportToShare}
                    locale={locale}
                />

                <PaymentMethodModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setPendingStatusUpdate(null);
                        // Refresh reports to reset select value if cancelled
                        window.location.reload();
                    }}
                    onConfirm={(method) => {
                        if (pendingStatusUpdate) {
                            handleStatusChange(pendingStatusUpdate.id, pendingStatusUpdate.status, method);
                        }
                    }}
                    showInvoiceWarning={pendingStatusUpdate?.needsInvoice}
                />

                <TrackingCodeModal
                    isOpen={showTrackingModal}
                    onClose={() => {
                        setShowTrackingModal(false);
                        setPendingShippedUpdate(null);
                        window.location.reload();
                    }}
                    onConfirm={(data) => {
                        if (pendingShippedUpdate) {
                            // Pass mock req object or update handleStatusChange to accept tracking data explicitly
                            // Actually, I'll update handleStatusChange to accept an options object
                            handleStatusChange(pendingShippedUpdate.id, pendingShippedUpdate.status, undefined, data);
                        }
                    }}
                    report={reports.find(r => r.id === (pendingShippedUpdate?.id))}
                />
            </div>

            {/* Portal Action Menu */}
            {
                activeMenuId && menuPosition && typeof document !== 'undefined' && createPortal(
                    <div
                        className="fixed z-[9999] bg-white border border-black/5 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[12rem]"
                        style={{
                            top: menuPosition.top + 8,
                            left: menuPosition.left - 150,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between gap-3"
                            onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/${activeMenuId}/edit`}
                        >
                            <span>تعديل التقرير</span>
                            <Edit size={16} className="text-primary" />
                        </button>
                        <button
                            className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between gap-3"
                            onClick={(e) => {
                                const report = reports.find(r => r.id === activeMenuId);
                                if (report) handleShareClick(report, e);
                            }}
                        >
                            <span className="text-[#25D366]">مشاركة واتساب</span>
                            <Share2 size={16} className="text-[#25D366]" />
                        </button>
                        <div className="h-[1px] bg-black/5 mx-2 my-1" />
                        <button
                            className="w-full text-right px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-between gap-3"
                            onClick={() => {
                                handleDeleteReport(activeMenuId);
                                setActiveMenuId(null);
                            }}
                        >
                            <span>حذف التقرير</span>
                            <Trash2 size={16} className="text-destructive" />
                        </button>
                    </div>,
                    document.body
                )
            }

            {/* Cart Items Popover */}
            <CartItemsPopover
                items={selectedCartItems}
                isOpen={cartPopoverOpen}
                onClose={() => {
                    setCartPopoverOpen(false);
                    setCartAnchorEl(null);
                    setSelectedCartItems([]);
                }}
                anchorEl={cartAnchorEl}
            />
        </DashboardLayout>
    );
}

