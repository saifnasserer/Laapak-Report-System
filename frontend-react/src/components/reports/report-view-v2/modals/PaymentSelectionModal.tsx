import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Zap, CreditCard, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PaymentSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPaymentMethod: 'cash' | 'vodafone_cash' | 'instapay' | null;
    setSelectedPaymentMethod: (method: 'cash' | 'vodafone_cash' | 'instapay' | null) => void;
    calculateFinalTotal: (methodOverride?: string | null) => { baseTotal: number; fee: number; finalTotal: number; feeReason: string };
    handleFinalConfirmation: () => void;
}

export function PaymentSelectionModal({
    isOpen,
    onClose,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    calculateFinalTotal,
    handleFinalConfirmation
}: PaymentSelectionModalProps) {
    const finalTotalDetails = calculateFinalTotal();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تأكيد طريقة الدفع"
            className="max-w-md"
        >
            <div className="space-y-6" dir="rtl">
                <p className="text-secondary/60 text-sm">بالنسبة للدفع ف فية ٣ طرق (الدفع عند الاستلام) ، يرجى اختيار الأنسب لك:</p>

                <div className="space-y-3">
                    {[
                        {
                            id: 'instapay',
                            title: 'انستاباي (الأفضل)',
                            desc: 'دفع عند الاستلام - مش بيخصم اي حاجة زيادة',
                            icon: <Zap className="text-indigo-500" />,
                        },
                        {
                            id: 'cash',
                            title: 'كاش عند الاستلام',
                            desc: 'المندوب بيستلم المبلغ بزيادة ١٪ عشان شركة الشحن بتخصمهم',
                            icon: <CreditCard className="text-orange-500" />,
                        },
                        {
                            id: 'vodafone_cash',
                            title: 'فودافون كاش',
                            desc: 'زياده ١٪ ع المبلغ رسوم سحب فودافون - دفع عند الاستلام',
                            icon: <Smartphone className="text-red-500" />,
                        }
                    ].map((method) => (
                        <div
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id as any)}
                            className={cn(
                                "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4",
                                selectedPaymentMethod === method.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-black/[0.03] bg-white hover:border-primary/20"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                method.id === 'instapay' ? "bg-indigo-50" :
                                    method.id === 'cash' ? "bg-orange-50" : "bg-red-50"
                            )}>
                                {method.icon}
                            </div>
                            <div className="text-right">
                                <h4 className="font-bold text-secondary">{method.title}</h4>
                                <p className="text-[11px] text-secondary/50 leading-relaxed mt-0.5">{method.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedPaymentMethod && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 rounded-2xl bg-surface-variant/10 border border-black/[0.03] space-y-2"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-secondary/60">الإجمالي الأساسي:</span>
                            <span className="font-bold text-secondary">{finalTotalDetails.baseTotal.toLocaleString()} ج.م</span>
                        </div>
                        {finalTotalDetails.fee > 0 && (
                            <div className="flex justify-between items-center text-destructive">
                                <span className="text-xs">الرسوم الإضافية (1%):</span>
                                <span className="font-bold">+{finalTotalDetails.fee.toLocaleString()} ج.م</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-black/[0.03] flex justify-between items-center">
                            <span className="font-black text-secondary">الإجمالي النهائي:</span>
                            <span className="text-xl font-black text-primary">{finalTotalDetails.finalTotal.toLocaleString()} ج.م</span>
                        </div>
                    </motion.div>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={handleFinalConfirmation}
                        className="flex-1 rounded-2xl py-6 text-base font-black"
                        disabled={!selectedPaymentMethod}
                    >
                        تأكيد وإرسال
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-2xl px-6"
                    >
                        إلغاء
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
export default PaymentSelectionModal;
