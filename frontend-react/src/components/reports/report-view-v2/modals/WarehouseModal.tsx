import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface WarehouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceDetails: string;
    setSourceDetails: (val: string) => void;
    handleAssignToWarehouse: () => void;
    warehouseSubmitting: boolean;
}

export function WarehouseModal({
    isOpen,
    onClose,
    sourceDetails,
    setSourceDetails,
    handleAssignToWarehouse,
    warehouseSubmitting
}: WarehouseModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="إضافة الجهاز للمخزن"
        >
            <div className="space-y-6" dir="rtl">
                <p className="text-secondary/60">
                    سيتم نقل هذا الجهاز إلى ملكية <strong>Laapak</strong> وإضافته للمخزون.
                    يرجى تحديد مصدر الجهاز.
                </p>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary">مصدر الجهاز</label>
                    <Input
                        placeholder="مثال: شراء من العميل محمد أحمد، استيراد خارجي..."
                        value={sourceDetails}
                        onChange={(e) => setSourceDetails(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleAssignToWarehouse} disabled={warehouseSubmitting}>
                        {warehouseSubmitting ? 'جاري الإضافة...' : 'تأكيد الإضافة للمخزن'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
export default WarehouseModal;
