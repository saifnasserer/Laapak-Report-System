'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Search, Plus, Filter, MoreHorizontal, Save, Trash, X } from 'lucide-react';
import api from '@/lib/api';
import { use } from 'react';

export default function ClientsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClient, setCurrentClient] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        orderCode: '',
        email: '',
        address: '',
        companyName: '',
        taxNumber: '',
        notes: '',
        status: 'active'
    });

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            orderCode: '',
            email: '',
            address: '',
            companyName: '',
            taxNumber: '',
            notes: '',
            status: 'active'
        });
        setIsEditMode(false);
        setCurrentClient(null);
    };

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

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (client: any) => {
        setFormData({
            name: client.name || '',
            phone: client.phone || '',
            orderCode: client.orderCode || '',
            email: client.email || '',
            address: client.address || '',
            companyName: client.companyName || '',
            taxNumber: client.taxNumber || '',
            notes: client.notes || '',
            status: client.status || 'active'
        });
        setCurrentClient(client);
        setIsEditMode(true);
        setIsModalOpen(true);
        setActiveMenuId(null); // Close menu
    };

    const handleSave = async () => {
        if (!formData.name || !formData.phone || !formData.orderCode) {
            alert('يرجى تعبئة الحقول الأساسية (الاسم، الهاتف، كود الطلب)');
            return;
        }

        try {
            if (isEditMode && currentClient) {
                await api.put(`/clients/${currentClient.id}`, formData);
                setClients(prev => prev.map(c => c.id === currentClient.id ? { ...c, ...formData } : c));
            } else {
                const response = await api.post('/clients', formData);
                setClients(prev => [response.data.client, ...prev]);
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            console.error('Failed to save client:', error);
            alert(error.response?.data?.message || 'فشل حفظ البيانات');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم نقله للأرشيف.')) return;

        try {
            await api.delete(`/clients/${id}`);
            // Check if soft delete (update status) or hard delete
            // Based on backend implementation plan, it's soft delete (status inactive)
            // But usually UI removes it or greys it out. Let's assume we remove from active list if filter hides inactive
            // Or just update local state status
            setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'inactive' } : c));
            setActiveMenuId(null);
        } catch (error) {
            console.error('Failed to delete client:', error);
            alert('فشل حذف العميل');
        }
    };

    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

    const toggleMenu = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const filteredClients = clients.filter(client =>
        (client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone?.includes(searchTerm)) &&
        client.status !== 'inactive' // Optionally hide inactive clients or show them with badge
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
                        <Button
                            size="md"
                            icon={<Plus size={20} />}
                            onClick={handleOpenCreate}
                            className="bg-primary text-white scale-105 hover:scale-110 active:scale-100 transition-all font-black h-12 px-8 rounded-full shadow-lg shadow-primary/20"
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
                                                    {client.name?.[0]}
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
                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-10 h-10 p-0 rounded-full"
                                                    onClick={(e) => toggleMenu(client.id, e)}
                                                >
                                                    <MoreHorizontal size={20} />
                                                </Button>

                                                {activeMenuId === client.id && (
                                                    <div className="absolute left-0 top-full mt-2 w-40 bg-white border border-black/5 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            className="w-full text-right px-4 py-3 text-sm font-bold hover:bg-black/5 transition-colors flex items-center justify-between"
                                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(client); }}
                                                        >
                                                            <span>تعديل</span>
                                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                                        </button>
                                                        <button
                                                            className="w-full text-right px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-between"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                                                        >
                                                            <span>حذف</span>
                                                            <div className="w-2 h-2 rounded-full bg-destructive" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
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

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={isEditMode ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
                    className="max-w-2xl"
                >
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary">اسم العميل <span className="text-red-500">*</span></label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="اسم العميل"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary">رقم الهاتف <span className="text-red-500">*</span></label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="05xxxxxxxx"
                                    className="dir-ltr text-right"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary">انشاء كود للعميل (للدخول) <span className="text-red-500">*</span></label>
                                <Input
                                    value={formData.orderCode}
                                    onChange={(e) => setFormData({ ...formData, orderCode: e.target.value })}
                                    placeholder="مثال: 1234"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary">البريد الإلكتروني</label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className="dir-ltr text-right"
                                />
                            </div>
                        </div>

                        {/* Company & Tax Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary">اسم الشركة / المؤسسة</label>
                                <Input
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    placeholder="اسم الشركة"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary">الرقم الضريبي</label>
                                <Input
                                    value={formData.taxNumber}
                                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                                    placeholder="الرقم الضريبي"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary">العنوان</label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="العنوان بالتفصيل"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary">ملاحظات</label>
                            <textarea
                                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="أي ملاحظات إضافية..."
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleSave} className="bg-primary text-white px-8">
                                <Save size={18} className="ml-2" />
                                حفظ
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
