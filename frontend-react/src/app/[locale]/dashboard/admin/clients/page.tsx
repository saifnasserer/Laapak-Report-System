'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Search, Plus, Filter, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { use } from 'react';

export default function ClientsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/clients');
            setClients(response.data.clients || []);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">العملاء</h1>
                        <p className="text-secondary font-medium">إدارة قاعدة بيانات العملاء والشركات المتعاملة</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-full max-w-[240px]">
                            <Input
                                placeholder="البحث عن عميل..."
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
                            className="bg-primary text-white scale-105 hover:scale-110 active:scale-100 transition-all font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                        >
                            إضافة عميل
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-secondary/60">جاري التحميل...</div>
                        ) : (
                            <Table headers={['الاسم', 'رقم الهاتف', 'كود الطلب', 'الحالة', 'تاريخ الانضمام', '']}>
                                {filteredClients.length > 0 ? filteredClients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {client.name[0]}
                                                </div>
                                                <span className="font-bold">{client.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-secondary/80 dir-ltr text-right">{client.phone}</TableCell>
                                        <TableCell>
                                            <span className="font-mono bg-surface-variant/50 px-2 py-1 rounded text-xs">{client.orderCode}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={client.status === 'active' ? 'primary' : 'outline'}>
                                                {client.status === 'active' ? 'نشط' : client.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-secondary/60">
                                            {new Date(client.createdAt).toLocaleDateString('ar-EG')}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full">
                                                <MoreHorizontal size={20} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-secondary/60">لا يوجد نتائج</TableCell>
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
