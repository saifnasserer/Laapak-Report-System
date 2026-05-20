import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, CreditCard, Printer, Edit3, Package, Share2, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getStatusInfo } from '../utils';
import { statusMap } from '../constants';

interface StepConfirmShareProps {
    report: any;
    cartItems: any[];
    calculateFinalTotal: () => { baseTotal: number; fee: number; finalTotal: number; feeReason: string };
    viewMode: 'admin' | 'client' | 'public';
    isConfirmed: boolean;
    handleConfirmOrder: () => void;
    handlePrint: (invoiceId: string) => void;
    setWarehouseModalOpen: (open: boolean) => void;
    setShareModalOpen: (open: boolean) => void;
    updateStatus: (newStatus: string) => void;
}

export function StepConfirmShare({
    report,
    cartItems,
    calculateFinalTotal,
    viewMode,
    isConfirmed,
    handleConfirmOrder,
    handlePrint,
    setWarehouseModalOpen,
    setShareModalOpen,
    updateStatus
}: StepConfirmShareProps) {
    const finalTotalDetails = calculateFinalTotal();

    const paymentLabels: Record<string, string> = {
        'cash': 'كاش عند الاستلام (للمندوب)',
        'vodafone_cash': 'فودافون كاش - عند الاستلام',
        'instapay': 'انستاباي - عند الاستلام'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-right"
            dir="rtl"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-3xl bg-white border border-black/[0.03] p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between pb-6 border-b border-black/[0.02]">
                            <h3 className="text-lg font-black text-secondary flex items-center gap-3">
                                <ShoppingBag size={20} className="text-primary/50" />
                                ملخص الفاتورة
                            </h3>
                            <span className="text-[10px] font-black text-secondary/30 uppercase tracking-wider">طلب الدفع عند الاستلام</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-bold text-secondary">{report.device_model}</span>
                                <span className="text-sm font-black text-secondary">{(parseFloat(report.amount || 0)).toLocaleString()} ج.م</span>
                            </div>

                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-2 text-secondary/60">
                                    <span className="text-xs font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {item.name}
                                    </span>
                                    <span className="text-xs font-black">{(parseFloat(item.price || 0)).toLocaleString()} ج.م</span>
                                </div>
                            ))}

                            <div className="pt-4 border-t border-black/[0.02] flex justify-between items-center text-secondary/50">
                                <span className="text-xs font-bold">الإجمالي الفرعي:</span>
                                <span className="text-xs font-bold">{finalTotalDetails.baseTotal.toLocaleString()} ج.م</span>
                            </div>

                            {finalTotalDetails.fee > 0 && (
                                <div className="flex justify-between items-center text-rose-500 text-xs">
                                    <span>الرسوم الإضافية{finalTotalDetails.feeReason}:</span>
                                    <span className="font-black">+{finalTotalDetails.fee.toLocaleString()} ج.م</span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-black/[0.03] flex justify-between items-center">
                                <span className="font-black text-secondary">الإجمالي المطلوب:</span>
                                <span className="text-xl font-black text-primary">{finalTotalDetails.finalTotal.toLocaleString()} ج.m</span>
                            </div>
                        </div>

                        {isConfirmed && report?.payment_method && (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                                <CreditCard size={18} className="text-primary shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <h4 className="font-bold text-primary text-xs">طريقة الدفع المختارة</h4>
                                    <p className="text-secondary/70 text-xs font-bold leading-relaxed">{paymentLabels[report.payment_method] || report.payment_method}</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-black/[0.02] flex flex-wrap gap-3">
                            {!isConfirmed ? (
                                <Button
                                    onClick={handleConfirmOrder}
                                    className="flex-1 rounded-2xl py-5 text-sm font-black shadow-md"
                                >
                                    تأكيد الأوردر ومتابعة الشحن
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleConfirmOrder}
                                    variant="outline"
                                    className="flex-1 rounded-2xl py-5 text-sm font-black"
                                >
                                    تعديل طريقة الدفع
                                </Button>
                            )}

                            {report.invoice?.id && (
                                <Button
                                    onClick={() => handlePrint(report.invoice.id)}
                                    variant="outline"
                                    className="rounded-2xl px-6 py-5 border-black/[0.04] text-secondary/60 hover:text-secondary"
                                    icon={<Printer size={16} />}
                                >
                                    طباعة الفاتورة
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-secondary/30 uppercase tracking-[0.2em]">إجراءات المشرف</h3>
                        <div className="space-y-3">
                            {viewMode === 'admin' && (
                                <>
                                    <Button
                                        href={`/dashboard/admin/reports/${report.id}/edit`}
                                        variant="outline"
                                        className="w-full justify-start rounded-2xl py-5 font-bold border-black/[0.03]"
                                        icon={<Edit3 size={15} className="ml-2 text-secondary/40" />}
                                    >
                                        تعديل التقرير
                                    </Button>

                                    <Button
                                        onClick={() => setWarehouseModalOpen(true)}
                                        variant="outline"
                                        className="w-full justify-start rounded-2xl py-5 font-bold border-black/[0.03]"
                                        icon={<Package size={15} className="ml-2 text-secondary/40" />}
                                    >
                                        إضافة للمخزن (Laapak)
                                    </Button>
                                </>
                            )}

                            <Button
                                onClick={() => setShareModalOpen(true)}
                                variant="outline"
                                className="w-full justify-start rounded-2xl py-5 font-bold border-black/[0.03]"
                                icon={<Share2 size={15} className="ml-2 text-secondary/40" />}
                            >
                                مشاركة التقرير
                            </Button>
                        </div>
                    </div>

                    {viewMode === 'admin' && (
                        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-black/[0.02]">
                                <h3 className="text-sm font-black text-secondary flex items-center gap-2">
                                    <Zap size={14} className="text-primary" />
                                    تحديث حالة الطلب
                                </h3>
                                <Badge className="text-[9px] font-black h-5 px-2" variant={getStatusInfo(report.status).variant as any}>
                                    {getStatusInfo(report.status).label}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(statusMap).filter(([k]) => ['pending', 'shipped', 'completed', 'cancelled'].includes(k)).map(([key, val]) => {
                                    const isCurrent = report.status === key;
                                    return (
                                        <button
                                            key={key}
                                            disabled={isCurrent}
                                            onClick={() => updateStatus(key)}
                                            className={cn(
                                                "w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between",
                                                isCurrent
                                                    ? "bg-secondary/[0.02] border-black/[0.03] opacity-50 cursor-not-allowed"
                                                    : "bg-white border-black/[0.03] hover:border-primary/20"
                                            )}
                                        >
                                            <span className="text-xs font-bold text-secondary">{val.label}</span>
                                            {isCurrent && <CheckCircle2 size={14} className="text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
export default StepConfirmShare;
