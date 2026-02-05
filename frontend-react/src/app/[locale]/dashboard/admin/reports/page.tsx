'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Search, Plus, Filter, Download, MoreVertical } from 'lucide-react';

import api from '@/lib/api';
import { use } from 'react';

export default function ReportsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('dashboard.reports');
    const [searchTerm, setSearchTerm] = useState('');
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        'pending': { label: 'انتظار', variant: 'warning' },
        'انتظار': { label: 'انتظار', variant: 'warning' },
        'active': { label: 'نشط', variant: 'primary' },
        'in-progress': { label: 'قيد المعالجة', variant: 'primary' },
        'قيد المعالجة': { label: 'قيد المعالجة', variant: 'primary' },
        'cancelled': { label: 'ملغي', variant: 'destructive' },
        'ملغي': { label: 'ملغي', variant: 'destructive' },
        'ملغى': { label: 'ملغي', variant: 'destructive' },
    };

    const getStatusInfo = (status: string) => {
        return statusMap[status] || { label: status || 'غير معروف', variant: 'outline' };
    };

    const filteredReports = reports.filter(report => {
        const term = searchTerm.toLowerCase();
        return (
            report.order_number?.toLowerCase().includes(term) ||
            report.client_name?.toLowerCase().includes(term) ||
            report.device_model?.toLowerCase().includes(term) ||
            report.id?.toString().includes(term)
        );
    });

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
                        <Button variant="outline" size="md" className="w-11 h-11 p-0 rounded-xl bg-white border-black/10">
                            <Filter size={18} />
                        </Button>
                        <Button
                            size="md"
                            icon={<Plus size={20} />}
                            onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/new`}
                            className="bg-primary text-white scale-105 hover:scale-110 active:scale-100 transition-all font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                        >
                            تقرير جديد
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-secondary">جاري التحميل...</div>
                        ) : error ? (
                            <div className="p-12 text-center text-destructive font-bold">{error}</div>
                        ) : filteredReports.length === 0 ? (
                            <div className="p-12 text-center text-secondary">لا توجد تقارير حالياً</div>
                        ) : (
                            <Table headers={['رقم الطلب', 'العميل', 'الجهاز', 'الحالة', 'التاريخ', '']}>
                                {filteredReports.map((report) => {
                                    const statusInfo = getStatusInfo(report.status);
                                    return (
                                        <TableRow key={report.id} onClick={() => window.location.href = `/${locale}/dashboard/admin/reports/${report.id}`} className="cursor-pointer">
                                            <TableCell className="font-bold text-primary">{report.order_number || report.id}</TableCell>
                                            <TableCell className="font-semibold">{report.client_name}</TableCell>
                                            <TableCell className="text-secondary">{report.device_model}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <Badge variant={statusInfo.variant} circular>
                                                        {statusInfo.label}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-secondary/60">
                                                {report.inspection_date ? new Date(report.inspection_date).toLocaleDateString('ar-EG') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full">
                                                    <MoreVertical size={20} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
