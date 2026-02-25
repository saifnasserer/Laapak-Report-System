import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Store, Hash, Phone, Mail, FileText, Save, Clock } from 'lucide-react';
import api from '@/lib/api';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (supplier: any) => void;
    initialData?: any;
    isEditMode?: boolean;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialData,
    isEditMode = false
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        phone: '',
        contact_person: '',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                code: initialData.code || '',
                phone: initialData.phone || '',
                contact_person: initialData.contact_person || '',
                notes: initialData.notes || ''
            });
        } else {
            setFormData({
                name: '',
                code: '',
                phone: '',
                contact_person: '',
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let res;
            if (isEditMode && initialData?.id) {
                res = await api.put(`/suppliers/${initialData.id}`, formData);
            } else {
                res = await api.post('/suppliers', formData);
            }

            onSuccess(res.data.data);
            onClose();
            // alert(isEditMode ? 'تم تحديث بيانات المورد بنجاح' : 'تم إضافة المورد بنجاح');
        } catch (err: any) {
            console.error('Failed to save supplier:', err);
            alert(err.response?.data?.message || 'فشل في حفظ بيانات المورد');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "تعديل بيانات المورد" : "إضافة مورد جديد"}
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 mr-2">اسم المورد</label>
                        <Input
                            name="name"
                            placeholder="اسم المورد..."
                            icon={<Store size={18} />}
                            value={formData.name}
                            onChange={handleChange}
                            className="rounded-2xl h-12"
                            required
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-1 flex-1">
                            <label className="text-xs font-bold text-gray-500 mr-2">كود المورد</label>
                            <Input
                                name="code"
                                placeholder="كود..."
                                icon={<Hash size={18} />}
                                value={formData.code}
                                onChange={handleChange}
                                className="rounded-2xl h-12"
                            />
                        </div>
                        <div className="space-y-1 flex-1">
                            <label className="text-xs font-bold text-gray-500 mr-2">مسئول التواصل</label>
                            <Input
                                name="contact_person"
                                placeholder="الاسم..."
                                icon={<FileText size={18} />}
                                value={formData.contact_person}
                                onChange={handleChange}
                                className="rounded-2xl h-12"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 mr-2">رقم الهاتف</label>
                        <Input
                            name="phone"
                            placeholder="رقم الهاتف..."
                            icon={<Phone size={18} />}
                            value={formData.phone}
                            onChange={handleChange}
                            className="rounded-2xl h-12"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 mr-2">ملاحظات</label>
                        <div className="relative">
                            <textarea
                                name="notes"
                                placeholder="ملاحظات إضافية..."
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full rounded-2xl border-primary/20 bg-primary/[0.03] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                            />
                            <div className="absolute top-3 left-3 text-primary/40">
                                <FileText size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full h-12">إلغاء</Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !formData.name}
                        className="flex-[2] rounded-full h-12 px-8"
                        icon={isSubmitting ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                    >
                        {isSubmitting ? 'جاري الحفظ...' : (isEditMode ? 'تحديث البيانات' : 'حفظ المورد')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
