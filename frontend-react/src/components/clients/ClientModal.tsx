import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Smartphone, Hash, Save, Clock, Mail, Building, FileText, MapPin } from 'lucide-react';
import api from '@/lib/api';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: any) => void;
    initialData?: any;
    isEditMode?: boolean;
}

export const ClientModal: React.FC<ClientModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialData,
    isEditMode = false
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    useEffect(() => {
        if (initialData) {
            // Remove LPK prefix for visual editing if it exists
            const displayCode = initialData.orderCode?.startsWith('LPK')
                ? initialData.orderCode.substring(3)
                : initialData.orderCode || '';

            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                orderCode: displayCode,
                email: initialData.email || '',
                address: initialData.address || '',
                companyName: initialData.companyName || '',
                taxNumber: initialData.taxNumber || '',
                notes: initialData.notes || '',
                status: initialData.status || 'active'
            });
        } else {
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
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Ensure LPK prefix is added
            const finalOrderCode = formData.orderCode.startsWith('LPK')
                ? formData.orderCode
                : `LPK${formData.orderCode}`;

            const payload = { ...formData, orderCode: finalOrderCode };

            let res;
            if (isEditMode && initialData?.id) {
                res = await api.put(`/clients/${initialData.id}`, payload);
            } else {
                res = await api.post('/clients', payload);
            }

            onSuccess(res.data.client || res.data);
            onClose();
            alert(isEditMode ? 'تم تحديث بيانات العميل بنجاح' : 'تم إضافة العميل بنجاح');
        } catch (err: any) {
            console.error('Failed to save client:', err);
            alert(err.response?.data?.message || 'فشل في حفظ بيانات العميل');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
            className="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="اسم العميل"
                        placeholder="اسم العميل..."
                        icon={<User size={18} />}
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="rounded-2xl h-12"
                        required
                    />
                    <Input
                        label="رقم الموبايل"
                        placeholder="05xxxxxxxx"
                        icon={<Smartphone size={18} />}
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="rounded-2xl h-12"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="كود العميل"
                        placeholder="1234"
                        prefix="LPK"
                        icon={<Hash size={18} />}
                        value={formData.orderCode}
                        onChange={(e) => setFormData(p => ({ ...p, orderCode: e.target.value }))}
                        className="rounded-2xl h-12 font-mono"
                        required
                    />
                    <Input
                        label="البريد الإلكتروني"
                        placeholder="email@example.com"
                        icon={<Mail size={18} />}
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        className="rounded-2xl h-12"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="اسم الشركة / المؤسسة"
                        placeholder="اسم الشركة"
                        icon={<Building size={18} />}
                        value={formData.companyName}
                        onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                        className="rounded-2xl h-12"
                    />
                    <Input
                        label="الرقم الضريبي"
                        placeholder="الرقم الضريبي"
                        icon={<FileText size={18} />}
                        value={formData.taxNumber}
                        onChange={(e) => setFormData(p => ({ ...p, taxNumber: e.target.value }))}
                        className="rounded-2xl h-12"
                    />
                </div>

                <Input
                    label="العنوان"
                    placeholder="العنوان بالتفصيل..."
                    icon={<MapPin size={18} />}
                    value={formData.address}
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    className="rounded-2xl h-12"
                />

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80 px-1">ملاحظات</label>
                    <textarea
                        className="flex w-full rounded-2xl border-0 bg-surface-variant px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                        value={formData.notes}
                        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                        placeholder="أي ملاحظات إضافية..."
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t border-black/5">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-full h-12">إلغاء</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-2 rounded-full h-12 px-10" icon={isSubmitting ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}>
                        {isSubmitting ? 'جاري الحفظ...' : (isEditMode ? 'تحديث البيانات' : 'حفظ العميل')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
