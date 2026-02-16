'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (methodId: string) => void;
    selectedMethod?: string;
    showInvoiceWarning?: boolean;
}

export const PaymentMethodModal = ({
    isOpen,
    onClose,
    onConfirm,
    selectedMethod = 'cash',
    showInvoiceWarning = false
}: PaymentMethodModalProps) => {
    const [localMethod, setLocalMethod] = React.useState(selectedMethod);

    const methods: Array<{
        id: string;
        name: string;
        logo?: string;
        icon?: React.ComponentType<any>;
        color: string;
        bgColor: string;
    }> = [
            { id: 'cash', name: 'نقداً (Cash)', logo: '/images/payment-methods/cash.svg', color: 'text-green-500', bgColor: 'bg-green-500/10' },
            { id: 'instapay', name: 'Instapay', logo: '/images/payment-methods/instapay.png', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
            { id: 'wallet', name: 'محفظة (Wallet)', logo: '/images/payment-methods/wallet.svg', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
            { id: 'bank_transfer', name: 'تحويل بنكي (Bank)', icon: CreditCard, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' }
        ];

    React.useEffect(() => {
        if (isOpen) {
            setLocalMethod(selectedMethod);
        }
    }, [isOpen, selectedMethod]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="طريقة الدفع"
            className="max-w-md"
        >
            <div className="space-y-4">
                {showInvoiceWarning ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4 text-amber-800 text-sm">
                        <p className="font-bold mb-1">تنبيه: لا توجد فاتورة لهذا التقرير</p>
                        <p>عند التأكيد، سيتم إنشاء فاتورة تلقائياً وربطها بهذا التقرير، ثم تسجيل الإيراد.</p>
                    </div>
                ) : (
                    <p className="text-sm text-secondary/60">يرجى اختيار طريقة الدفع لتسجيل الإيراد في الحساب المالي:</p>
                )}
                {methods.map((method) => (
                    <button
                        key={method.id}
                        type="button"
                        onClick={() => setLocalMethod(method.id)}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-right w-full",
                            localMethod === method.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-black/5 hover:border-black/10 bg-white"
                        )}
                    >
                        <div className={cn("p-3 rounded-xl", method.bgColor)}>
                            {method.logo ? (
                                <Image
                                    src={method.logo}
                                    alt={method.name}
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                />
                            ) : (
                                <method.icon className={cn("w-6 h-6", method.color)} />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-secondary">{method.name}</h3>
                        </div>
                    </button>
                ))}
                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-full font-bold"
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="button"
                        onClick={() => onConfirm(localMethod)}
                        className="flex-[2] h-12 rounded-full font-bold"
                    >
                        تأكيد
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
