'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Coins, Clock, AlertCircle, ArrowUpRight, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { use } from 'react';

export default function ExpectedMoneyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReceivables = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/invoices');
            const allInvoices = response.data || [];
            // Filter for unpaid or pending invoices
            const receivables = allInvoices.filter((inv: any) =>
                inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'pending' || inv.paymentStatus === 'overdue'
            );
            setInvoices(receivables);
        } catch (error) {
            console.error('Failed to fetch receivables:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReceivables();
    }, []);

    const statusMap: any = {
        pending: { label: 'انتظار', variant: 'warning' },
        unpaid: { label: 'غير مدفوعة', variant: 'warning' },
        overdue: { label: 'متأخر', variant: 'destructive' },
    };

    const totalPending = invoices
        .filter(inv => inv.paymentStatus === 'pending' || inv.paymentStatus === 'unpaid')
        .reduce((sum, inv) => sum + Number(inv.total), 0);

    const totalOverdue = invoices
        .filter(inv => inv.paymentStatus === 'overdue')
        .reduce((sum, inv) => sum + Number(inv.total), 0);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">المستحقات المرجوة</h1>
                        <p className="text-secondary font-medium">متابعة المبالغ المتوقع تحصيلها والديون المستحقة</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" size="sm" onClick={fetchReceivables} icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />}>تحديث</Button>
                        <Button size="sm" icon={<Coins size={18} />}>إضافة مستحق</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card variant="glass" className="border-yellow-200 bg-yellow-50/50">
                        <CardContent className="p-8 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-yellow-700 uppercase tracking-widest">إجمالي المنتظر</p>
                                <h3 className="text-3xl font-bold mt-2"> {Number(totalPending).toLocaleString()}</h3>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                                <Clock size={28} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass" className="border-red-200 bg-red-50/50">
                        <CardContent className="p-8 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-red-700 uppercase tracking-widest">إجمالي المتأخرات</p>
                                <h3 className="text-3xl font-bold mt-2 text-red-600"> {Number(totalOverdue).toLocaleString()}</h3>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                                <AlertCircle size={28} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="p-8 border-b border-black/5 bg-surface-variant/20">
                        <CardTitle className="text-xl font-bold">قائمة المستحقات</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-secondary/60">جاري التحميل...</div>
                        ) : (
                            <Table headers={['المعرف', 'العميل', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', '']}>
                                {invoices.length > 0 ? invoices.map((rec) => (
                                    <TableRow key={rec.id}>
                                        <TableCell className="font-mono text-xs font-bold text-primary">{rec.id}</TableCell>
                                        <TableCell className="font-semibold">{rec.client?.name || '---'}</TableCell>
                                        <TableCell className="font-bold">{Number(rec.total).toLocaleString()} </TableCell>
                                        <TableCell className="text-sm text-secondary/60">
                                            {new Date(rec.due_date || rec.created_at).toLocaleDateString('ar-EG')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[rec.paymentStatus]?.variant || 'outline'}>
                                                {statusMap[rec.paymentStatus]?.label || rec.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" icon={<ArrowUpRight size={18} />}>تحصيل</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-secondary/60">لا توجد مستحقات حالية</TableCell>
                                    </TableRow>
                                )}
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
