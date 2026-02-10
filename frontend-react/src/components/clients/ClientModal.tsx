import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Smartphone, Hash, Save, Clock, MapPin } from 'lucide-react';
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
        address: ''
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
                address: initialData.address || ''
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                orderCode: '',
                address: ''
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

            const payload = {
                ...formData,
                orderCode: finalOrderCode,
                // Keep other fields if editing
                ...(isEditMode ? initialData : {})
            };

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
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <Input
                        placeholder="اسم العميل..."
                        icon={<User size={18} />}
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="rounded-2xl h-12"
                        required
                    />
                    <Input
                        placeholder="رقم الموبايل..."
                        icon={<Smartphone size={18} />}
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="rounded-2xl h-12"
                        required
                    />
                    <Input
                        placeholder="0000"
                        icon={<Hash size={18} />}
                        prefix="LPK"
                        value={formData.orderCode}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ''); // Only numbers
                            setFormData(p => ({ ...p, orderCode: val }));
                        }}
                        className="rounded-2xl h-12 font-mono"
                        required
                    />
                    <Input
                        placeholder="العنوان بالتفصيل..."
                        icon={<MapPin size={18} />}
                        value={formData.address}
                        onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                        className="rounded-2xl h-12"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full h-12">إلغاء</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-2 rounded-full h-12 px-8" icon={isSubmitting ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}>
                        {isSubmitting ? 'جاري الحفظ...' : (isEditMode ? 'تحديث البيانات' : 'حفظ العميل')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
