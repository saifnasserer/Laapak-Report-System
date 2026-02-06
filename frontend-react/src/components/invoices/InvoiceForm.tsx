'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    User,
    Calendar,
    Receipt,
    Plus,
    Search,
    ArrowRight,
    Save,
    Clock,
    Trash2,
    DollarSign,
    Smartphone,
    Hash
} from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';

interface InvoiceFormProps {
    invoiceId?: string;
    locale: string;
}

export default function InvoiceForm({ invoiceId, locale }: InvoiceFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [showClientResults, setShowClientResults] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '', address: '', orderCode: '' });
    const [isSubmittingNewClient, setIsSubmittingNewClient] = useState(false);

    const [formData, setFormData] = useState({
        client_id: '',
        client_name: '',
        client_phone: '',
        date: new Date().toISOString().split('T')[0],
        items: [] as { description: string, amount: string, quantity: number }[],
        taxRate: '0',
        discount: '0',
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        notes: ''
    });

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await api.get('/clients');
                setClients(res.data.clients || []);
            } catch (err) {
                console.error('Failed to fetch clients:', err);
            }
        };
        fetchClients();

        if (invoiceId) {
            // Edit Mode: Fetch Invoice Data
            const fetchInvoice = async () => {
                try {
                    const res = await api.get(`/invoices/${invoiceId}`);
                    const inv = res.data;
                    setFormData({
                        client_id: inv.client_id,
                        client_name: inv.client?.name || '',
                        client_phone: inv.client?.phone || '',
                        date: inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        items: inv.InvoiceItems ? inv.InvoiceItems.map((i: any) => ({
                            description: i.description,
                            amount: i.amount,
                            quantity: i.quantity
                        })) : [],
                        taxRate: String(inv.taxRate || 0),
                        discount: String(inv.discount || 0),
                        paymentMethod: inv.paymentMethod || 'cash',
                        paymentStatus: inv.paymentStatus || 'unpaid',
                        notes: inv.notes || ''
                    });
                } catch (err) {
                    console.error('Failed to fetch invoice:', err);
                    alert('فشل في تحميل بيانات الفاتورة');
                }
            };
            fetchInvoice();
        } else {
            // New Mode: Add one empty item by default
            setFormData(prev => ({ ...prev, items: [{ description: '', amount: '0', quantity: 1 }] }));
        }
    }, [invoiceId]);

    const handleClientSelect = (client: any) => {
        setFormData(prev => ({
            ...prev,
            client_id: client.id,
            client_name: client.name,
            client_phone: client.phone
        }));
        setShowClientResults(false);
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingNewClient(true);
        try {
            const finalOrderCode = newClient.orderCode.startsWith('LPK') ? newClient.orderCode : `LPK${newClient.orderCode}`;
            const res = await api.post('/clients', { ...newClient, orderCode: finalOrderCode, status: 'active' });
            handleClientSelect(res.data.client);
            // Refresh clients list
            const clientsRes = await api.get('/clients');
            setClients(clientsRes.data.clients || []);

            setIsClientModalOpen(false);
            setNewClient({ name: '', phone: '', address: '', orderCode: '' });
            alert('تم إنشاء العميل بنجاح');
        } catch (err: any) {
            console.error('Failed to create client:', err);
            alert('فشل في إنشاء العميل');
        } finally {
            setIsSubmittingNewClient(false);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleAddItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { description: '', amount: '0', quantity: 1 }] }));
    };

    const handleRemoveItem = (index: number) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
        }
    };

    // Calculations
    const subtotal = formData.items.reduce((sum, item) => sum + ((Number(item.amount) || 0) * (Number(item.quantity) || 1)), 0);
    const taxAmount = (subtotal * (Number(formData.taxRate) || 0)) / 100;
    const discountAmount = Number(formData.discount) || 0;
    const total = Math.max(0, subtotal + taxAmount - discountAmount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.client_id) {
            alert('يرجى اختيار العميل أولاً');
            return;
        }

        if (formData.items.some(i => !i.description || Number(i.amount) <= 0)) {
            alert('يرجى التأكد من ملء بيانات جميع البنود (الوصف والسعر)');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                client_id: formData.client_id,
                date: formData.date,
                items: formData.items,
                subtotal: subtotal,
                taxRate: Number(formData.taxRate),
                tax: taxAmount,
                discount: discountAmount,
                total: total,
                paymentMethod: formData.paymentMethod,
                paymentStatus: formData.paymentStatus,
                notes: formData.notes
            };

            if (invoiceId) {
                await api.put(`/invoices/${invoiceId}`, payload);
                alert('تم تحديث الفاتورة بنجاح');
            } else {
                await api.post('/invoices', payload);
                alert('تم إنشاء الفاتورة بنجاح');
            }
            router.push('/dashboard/admin/invoices');
        } catch (error: any) {
            console.error('Failed to save invoice:', error);
            alert('فشل في حفظ الفاتورة');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-primary">
                    <Receipt className="text-primary" size={32} />
                    {invoiceId ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}
                </h1>
                <p className="text-secondary/60 font-bold text-sm">
                    {invoiceId ? 'تعديل بيانات وبيانات الدفع للفاتورة الحالية' : 'إصدار فاتورة مبيعات أو صيانة لعميل'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Client Selection */}
                {/* Added overflow-visible to Card and relative to container to allow dropdown to overlay */}
                <Card variant="glass" className="overflow-visible border-primary/10 relative z-20">
                    <CardHeader className="p-8 border-b border-black/5 bg-primary/[0.02] flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                            <User size={24} />
                            بيانات العميل
                        </CardTitle>
                        {!invoiceId && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsClientModalOpen(true)}
                                className="rounded-full h-9 px-6 border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold"
                                icon={<Plus size={14} />}
                            >
                                عميل جديد
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-8">
                        {/* Removed overflow-hidden from inner styling and ensured z-index for dropdown container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-[2.5rem] bg-black/[0.02] border border-black/5 relative">
                            <div className="space-y-2 relative z-30">
                                <label className="text-[10px] font-black text-secondary/40 uppercase px-2">ابحث عن العميل</label>
                                <Input
                                    placeholder="اسم العميل أو رقم الهاتف..."
                                    icon={<Search size={18} />}
                                    value={formData.client_name}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, client_name: e.target.value }));
                                        setShowClientResults(true);
                                        if (!e.target.value && !invoiceId) setFormData(prev => ({ ...prev, client_id: '', client_phone: '' }));
                                    }}
                                    onFocus={() => setShowClientResults(true)}
                                    // Disabled in edit mode if strict about not changing client, but usually allowed. Left enabled.
                                    className="rounded-full h-12 bg-white border-black/5 text-secondary/80 font-bold"
                                />
                                {showClientResults && (formData.client_name || clients.length > 0) && (
                                    <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white border border-black/5 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                        {clients
                                            .filter(c =>
                                                c.name.toLowerCase().includes(formData.client_name.toLowerCase()) ||
                                                c.phone.includes(formData.client_name)
                                            )
                                            .slice(0, 5)
                                            .map(client => (
                                                <div
                                                    key={client.id}
                                                    className="px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-black/5 last:border-0 flex justify-between items-center bg-white"
                                                    onClick={() => handleClientSelect(client)}
                                                >
                                                    <div>
                                                        <div className="font-bold text-sm">{client.name}</div>
                                                        <div className="text-xs text-secondary/50 font-mono">{client.phone}</div>
                                                    </div>
                                                    <ArrowRight size={14} className="text-primary/20" />
                                                </div>
                                            ))}
                                        {clients.filter(c => c.name.toLowerCase().includes(formData.client_name.toLowerCase()) || c.phone.includes(formData.client_name)).length === 0 && (
                                            <div className="px-4 py-3 text-center text-secondary/50 text-sm bg-white">لا توجد نتائج</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 relative z-10">
                                <label className="text-[10px] font-black text-secondary/40 uppercase px-2">رقم الهاتف</label>
                                <Input
                                    readOnly
                                    value={formData.client_phone}
                                    className="rounded-full h-12 bg-white border-black/5 text-secondary/60 font-mono"
                                    placeholder="-"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Items */}
                <Card variant="glass" className="overflow-hidden border-primary/10 relative z-10">
                    <CardHeader className="p-8 border-b border-black/5 bg-primary/[0.02] flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                            <Receipt size={24} className="text-primary" />
                            بنود الفاتورة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300 p-6 rounded-[2rem] bg-black/[0.02] border border-black/5">
                                <div className="md:col-span-5 space-y-2">
                                    <label className="text-[10px] font-black text-secondary/40 uppercase px-2">الوصف / المنتج</label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="اسم المنتج أو الخدمة..."
                                        className="rounded-full h-12 bg-white border-black/5 font-bold text-secondary/80"
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[10px] font-black text-secondary/40 uppercase px-2">السعر</label>
                                    <Input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                        className="rounded-full h-12 bg-white border-primary/20 font-mono text-primary font-bold"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-secondary/40 uppercase px-2">الكمية</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                        className="rounded-full h-12 bg-white border-black/5 font-mono text-center font-bold"
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black text-secondary/40 uppercase px-2 md:hidden">الإجمالي</label>
                                        <div className="h-12 flex items-center justify-center px-4 bg-white rounded-full border border-black/5 font-black font-mono text-primary">
                                            {((Number(item.amount) || 0) * (Number(item.quantity) || 1)).toLocaleString()}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => handleRemoveItem(index)}
                                        className="h-12 w-12 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100"
                                        disabled={formData.items.length === 1}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddItem}
                            className="w-full rounded-full border-dashed border-primary/20 text-primary h-14 hover:bg-primary/5 mt-4 font-bold"
                            icon={<Plus size={18} />}
                        >
                            إضافة بند جديد
                        </Button>
                    </CardContent>
                </Card>

                {/* Financials & Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-0">
                    {/* Additional Info */}
                    <Card variant="glass" className="overflow-hidden border-primary/10 h-fit">
                        <CardHeader className="p-8 border-b border-black/5 bg-primary/[0.02]">
                            <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                                <Calendar size={24} />
                                تفاصيل إضافية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary/40 uppercase px-2">تاريخ الفاتورة</label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="rounded-full h-12 bg-white border-black/5 font-bold"
                                />
                            </div>
                            <div className="p-6 rounded-[2rem] bg-black/[0.02] border border-black/5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary/40 uppercase px-2">طريقة الدفع</label>
                                    <select
                                        className="w-full h-12 rounded-full border-black/5 bg-white px-4 text-sm font-bold focus:border-primary/30 outline-none appearance-none"
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    >
                                        <option value="cash">نقداً (Cash)</option>
                                        <option value="card">بطاقة (Card)</option>
                                        <option value="instapay">Instapay</option>
                                        <option value="bank_transfer">تحويل بنكي</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary/40 uppercase px-2">حالة الدفع</label>
                                    <select
                                        className="w-full h-12 rounded-full border-black/5 bg-white px-4 text-sm font-bold focus:border-primary/30 outline-none appearance-none"
                                        value={formData.paymentStatus}
                                        onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                    >
                                        <option value="paid">مدفوع بالكامل</option>
                                        <option value="unpaid">غير مدفوع</option>
                                        <option value="partially_paid">مدفوع جزئياً</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary/40 uppercase px-2">ملاحظات</label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-[2rem] border-black/5 bg-white p-4 text-sm font-bold focus:border-primary/30 outline-none resize-none"
                                    placeholder="أي ملاحظات إضافية..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Totals Calculation */}
                    <Card variant="glass" className="overflow-hidden border-primary/10 h-fit">
                        <CardHeader className="p-8 border-b border-black/5 bg-primary/[0.02]">
                            <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                                <DollarSign size={24} />
                                الحسابات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="p-8 rounded-[2.5rem] bg-black/[0.02] border border-black/5 space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-sm font-black text-secondary/60">المجموع الفرعي</span>
                                    <span className="font-mono font-black text-xl">{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-secondary/60">الضريبة (%)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.taxRate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                                            className="w-20 h-10 rounded-full border-black/10 text-center text-sm font-mono font-bold bg-white"
                                        />
                                    </div>
                                    <span className="font-mono font-bold text-red-500">+{taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center px-2 pb-4 border-b border-black/5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-secondary/60">الخصم</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.discount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                                            className="w-24 h-10 rounded-full border-black/10 text-center text-sm font-mono font-bold bg-white"
                                        />
                                    </div>
                                    <span className="font-mono font-bold text-green-500">-{discountAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-primary text-white rounded-[2rem] shadow-xl shadow-primary/20">
                                    <span className="text-lg font-black">الإجمالي النهائي</span>
                                    <span className="text-3xl font-black font-mono">{total.toLocaleString()} <span className="text-sm font-sans opacity-80">ج.م</span></span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-8 border-t border-black/5">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-full h-16 px-16 text-lg font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all bg-primary text-white"
                        icon={isLoading ? <Clock className="animate-spin" /> : <Save />}
                    >
                        {isLoading ? 'جاري الحفظ...' : (invoiceId ? 'تحديث الفاتورة' : 'حفظ الفاتورة')}
                    </Button>
                </div>
            </form>

            {/* New Client Modal */}
            <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="إضافة عميل جديد" className="max-w-md">
                <form onSubmit={handleCreateClient} className="space-y-6">
                    <div className="space-y-4">
                        <Input placeholder="اسم العميل..." icon={<User size={18} />} value={newClient.name} onChange={(e) => setNewClient(p => ({ ...p, name: e.target.value }))} className="rounded-2xl h-12" required />
                        <Input placeholder="رقم الموبايل..." icon={<Smartphone size={18} />} value={newClient.phone} onChange={(e) => setNewClient(p => ({ ...p, phone: e.target.value }))} className="rounded-2xl h-12" required />
                        <Input placeholder="كود العميل..." icon={<Hash size={18} />} value={newClient.orderCode} onChange={(e) => setNewClient(p => ({ ...p, orderCode: e.target.value }))} className="rounded-2xl h-12" required />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)} className="flex-1 rounded-full h-12">إلغاء</Button>
                        <Button type="submit" disabled={isSubmittingNewClient} className="flex-2 rounded-full h-12 px-8" icon={isSubmittingNewClient ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}>
                            {isSubmittingNewClient ? 'جاري الحفظ...' : 'حفظ العميل'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
