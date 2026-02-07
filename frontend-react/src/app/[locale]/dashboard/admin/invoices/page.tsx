'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Receipt, Search, Plus, Download, Eye, Filter, Edit } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { use } from 'react';
import { useRouter } from '@/i18n/routing';
import { Modal } from '@/components/ui/Modal'; // Assuming Modal is created
import { MessageCircle, Send, X } from 'lucide-react';

export default function InvoicesAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [shareMessage, setShareMessage] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/invoices');
            setInvoices(response.data || []);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const statusMap: any = {
        completed: { label: 'مكتملة', variant: 'success' },
        pending: { label: 'انتظار', variant: 'warning' },
        cancelled: { label: 'ملغاة', variant: 'destructive' },
    };

    const getStatusInfo = (status: string) => {
        return statusMap[status] || { label: status, variant: 'outline' };
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.client?.name && inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = selectedStatus === 'all' || inv.paymentStatus === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.put(`/invoices/${id}`, { paymentStatus: newStatus });
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paymentStatus: newStatus } : inv));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('فشل تحديث الحالة');
        }
    };

    const handlePrint = (id: string) => {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const printUrl = `${baseUrl}/invoices/${id}/print?token=${token}`;
        window.open(printUrl, '_blank');
    };

    const openWhatsAppModal = (id: string, clientName: string) => {
        setSelectedInvoiceId(id);
        setShareMessage(`تقدر تشوف فاتورتك من هنا !:\nhttps://laapak.com/invoices/${id}\n\nشكراً لتعاملك معنا.`);
        setWhatsAppModalOpen(true);
    };

    const handleConfirmShare = async () => {
        if (!selectedInvoiceId) return;

        try {
            // In a real scenario, you might send the custom message to the backend too
            await api.post(`/invoices/${selectedInvoiceId}/share/whatsapp`, {
                message: shareMessage // Assuming backend accepts custom message, if not it will use default
            });
            alert('تم إرسال الفاتورة عبر واتساب بنجاح');
            setWhatsAppModalOpen(false);
        } catch (error) {
            console.error('Failed to share invoice:', error);
            alert('فشل إرسال الفاتورة عبر واتساب');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">الفواتير</h1>
                        <p className="text-secondary font-medium">إدارة الفواتير والمدفوعات المالية</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-full max-w-[240px]">
                            <Input
                                placeholder="البحث عن فاتورة..."
                                icon={<Search size={18} />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white h-11 rounded-full"
                            />
                        </div>
                        <Button
                            variant={isFilterOpen ? "primary" : "outline"}
                            size="md"
                            className={`w-11 h-11 p-0 rounded-full ${isFilterOpen ? '' : 'bg-white border-black/10'}`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <Filter size={18} />
                        </Button>
                        <Button
                            size="md"
                            icon={<Plus size={20} />}
                            onClick={() => router.push('/dashboard/admin/invoices/new')}
                            className="bg-primary text-white scale-105 hover:scale-110 active:scale-100 transition-all font-black h-12 px-8 rounded-full shadow-lg shadow-primary/20"
                        >
                            فاتورة جديدة
                        </Button>
                    </div>
                </div>

                {isFilterOpen && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Badge
                            variant={selectedStatus === 'all' ? 'primary' : 'outline'}
                            className="cursor-pointer hover:bg-primary/5 transition-colors"
                            circular
                            onClick={() => setSelectedStatus('all')}
                        >
                            الكل
                        </Badge>
                        {['completed', 'pending', 'cancelled'].map((key) => {
                            const value = statusMap[key];
                            if (!value) return null;
                            return (
                                <div key={key} onClick={() => setSelectedStatus(key)}>
                                    <Badge
                                        variant={selectedStatus === key ? value.variant : 'outline'}
                                        className={`cursor-pointer transition-colors ${selectedStatus === key ? '' : 'hover:bg-black/5'}`}
                                        circular
                                    >
                                        {value.label}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                )}

                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-secondary/60 font-medium">جاري التحميل...</div>
                        ) : (
                            <Table headers={['رقم الفاتورة', 'العميل', 'المبلغ', 'الحالة', 'التاريخ', '']}>
                                {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => {
                                    const statusInfo = getStatusInfo(inv.paymentStatus);
                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell
                                                className="font-mono text-xs font-bold text-primary cursor-pointer hover:underline"
                                                onClick={() => handlePrint(inv.id)}
                                            >
                                                {inv.id}
                                            </TableCell>
                                            <TableCell className="font-semibold">{inv.client?.name || '---'}</TableCell>
                                            <TableCell className="font-bold whitespace-nowrap">{Number(inv.total).toLocaleString()} </TableCell>
                                            <TableCell>
                                                <div className="flex justify-start">
                                                    <select
                                                        value={inv.paymentStatus}
                                                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                                                        className={`appearance-none cursor-pointer text-xs font-bold px-4 py-1.5 rounded-full border transition-all text-center outline-none w-28 ${statusInfo.variant === 'success' ? 'bg-green-100 text-green-600 border-green-200' :
                                                            statusInfo.variant === 'warning' ? 'bg-yellow-100 text-yellow-600 border-yellow-200' :
                                                                statusInfo.variant === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                                    'bg-primary/10 text-primary border-primary/20'
                                                            }`}
                                                    >
                                                        <option value="completed">مكتملة</option>
                                                        <option value="pending">انتظار</option>
                                                        <option value="cancelled">ملغاة</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-secondary/60">
                                                {new Date(inv.created_at || inv.date).toLocaleDateString('ar-EG')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-10 h-10 p-0 rounded-full"
                                                        title="عرض"
                                                        onClick={() => handlePrint(inv.id)}
                                                    >
                                                        <Eye size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-10 h-10 p-0 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        title="تعديل"
                                                        onClick={() => router.push(`/dashboard/admin/invoices/${inv.id}/edit`)}
                                                    >
                                                        <Edit size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-10 h-10 p-0 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        title="مشاركة واتساب"
                                                        onClick={() => openWhatsAppModal(inv.id, inv.client?.name || 'الكريم')}
                                                    >
                                                        <MessageCircle size={18} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-secondary/60 font-medium">لا توجد فواتير تطابق البحث</TableCell>
                                    </TableRow>
                                )}
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Modal
                    isOpen={whatsAppModalOpen}
                    onClose={() => setWhatsAppModalOpen(false)}
                    title="مشاركة الفاتورة عبر واتساب"
                >
                    <div className="space-y-4">
                        <div className="bg-surface-variant/30 p-4 rounded-2xl border border-black/5">
                            <p className="text-sm font-medium text-secondary/60 mb-2">معاينة الرسالة:</p>
                            <textarea
                                className="w-full bg-transparent border-none resize-none focus:ring-0 text-foreground font-medium h-32 outline-none"
                                value={shareMessage}
                                onChange={(e) => setShareMessage(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setWhatsAppModalOpen(false)}
                                className="hover:bg-surface-variant text-secondary"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleConfirmShare}
                                className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 px-6"
                            >
                                <Send size={18} />
                                إرسال
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}

