'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Search, Plus, Filter, Download, MoreVertical, ShoppingCart, Edit, Trash2, CheckCircle2, Share2, MoreHorizontal, X, Check } from 'lucide-react';

import api from '@/lib/api';
import { use } from 'react';
import { cn } from '@/lib/utils';
import { WhatsAppShareModal } from '@/components/reports/WhatsAppShareModal';

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

    // Action Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleShareClick = (report: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setReportToShare(report);
        setShareModalOpen(true);
        setActiveMenuId(null);
    };

    React.useEffect(() => {
        const fetchReports = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/reports?fetch_mode=all_reports');
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
        'cancelled': { label: 'ملغي', variant: 'destructive' },
        'ملغي': { label: 'ملغي', variant: 'destructive' },
        'ملغى': { label: 'ملغي', variant: 'destructive' },
    };

    const getStatusInfo = (status: string) => {
        return statusMap[status] || { label: status || 'غير معروف', variant: 'outline' };
    };

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        try {
            await api.put(`/reports/${reportId}`, { status: newStatus });
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
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
        return status === 'pending' || status === 'waiting' || status === 'قيد الانتظار' || status === 'انتظار' || status === 'active' || status === 'نشط';
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
                                'التاريخ', 'العميل', 'الجهاز', 'الحالة', 'الإضافات', 'التأكيد', ''
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
                                                                report.status === 'cancelled' || report.status === 'ملغى' ? 'ملغي' : report.status}
                                                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full text-[11px] font-black border outline-none transition-all cursor-pointer appearance-none text-center min-w-[100px]",
                                                            report.status === 'completed' || report.status === 'مكتمل' ? "bg-green-100 text-green-600 border-green-200" :
                                                                report.status === 'pending' || report.status === 'قيد الانتظار' || report.status === 'انتظار' || report.status === 'active' || report.status === 'نشط' ? "bg-yellow-100 text-yellow-600 border-yellow-200" :
                                                                    report.status === 'cancelled' || report.status === 'ملغي' || report.status === 'ملغى' ? "bg-red-100 text-red-600 border-red-200" :
                                                                        "bg-primary/10 text-primary border-primary/20"
                                                        )}
                                                    >
                                                        <option value="قيد الانتظار">⏳ قيد الانتظار</option>
                                                        <option value="مكتمل">✅ مكتمل</option>
                                                        <option value="ملغي">❌ ملغي</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center align-middle p-0 w-12">
                                                <div className="flex justify-center">
                                                    {report.selected_accessories && Array.isArray(report.selected_accessories) && report.selected_accessories.length > 0 ? (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-all shadow-sm ring-1 ring-primary/20">
                                                            <ShoppingCart size={14} className="animate-bounce" />
                                                        </div>
                                                    ) : (
                                                        <ShoppingCart size={14} className="text-secondary/20" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center align-middle p-0 w-20">
                                                <div className="flex justify-center">
                                                    {(report.is_confirmed || report.status === 'completed' || report.status === 'مكتمل') ? (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 animate-in fade-in zoom-in duration-500">
                                                            <CheckCircle2 size={12} className="text-green-500" />
                                                            <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">مؤكد</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-secondary/20 text-xs">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()} className="overflow-visible">
                                                <div className="relative flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-10 h-10 p-0 rounded-full"
                                                        onClick={(e) => toggleMenu(report.id, e)}
                                                    >
                                                        <MoreHorizontal size={20} />
                                                    </Button>

                                                    {activeMenuId === report.id && (
                                                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border border-black/5 rounded-2xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                            <button
                                                                className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between"
                                                                onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/${report.id}/edit`}
                                                            >
                                                                <span>تعديل التقرير</span>
                                                                <Edit size={16} className="text-primary" />
                                                            </button>
                                                            <button
                                                                className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between"
                                                                onClick={(e) => handleShareClick(report, e)}
                                                            >
                                                                <span className="text-[#25D366]">مشاركة واتساب</span>
                                                                <Share2 size={16} className="text-[#25D366]" />
                                                            </button>
                                                            <div className="h-[1px] bg-black/5 mx-2" />
                                                            <button
                                                                className="w-full text-right px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-between"
                                                                onClick={() => handleDeleteReport(report.id)}
                                                            >
                                                                <span>حذف التقرير</span>
                                                                <Trash2 size={16} className="text-destructive" />
                                                            </button>
                                                        </div>
                                                    )}
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
            </div>
        </DashboardLayout>
    );
}

