import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Plus, Check, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface StepAccessoriesProps {
    products: any[];
    isLoadingProducts: boolean;
    cartItems: any[];
    toggleCartItem: (product: any) => void;
    calculateFinalTotal: () => { baseTotal: number; fee: number; finalTotal: number };
    handleConfirmOrder: () => void;
    isConfirmed: boolean;
}

export function StepAccessories({
    products,
    isLoadingProducts,
    cartItems,
    toggleCartItem,
    calculateFinalTotal,
    handleConfirmOrder,
    isConfirmed
}: StepAccessoriesProps) {
    const finalTotalDetails = calculateFinalTotal();

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-right"
            dir="rtl"
        >
            <div className="text-center max-w-xl mx-auto space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-primary/5 text-primary">
                    <Sparkles size={24} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-secondary">إضافات مهمة ومفيدة لجهازك الجديد!</h3>
                <p className="text-xs font-bold text-secondary/40 leading-relaxed">
                    تقدر تضيف الإكسسوارات اللي محتاجها مع اللابتوب بضغطة واحدة، وهتوصلك مع نفس شحنة الجهاز والدفع عند الاستلام.
                </p>
            </div>

            {isLoadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="bg-white border border-black/[0.03] rounded-3xl p-5 space-y-4 animate-pulse shadow-sm">
                            <div className="aspect-square w-full bg-black/[0.02] rounded-2xl" />
                            <div className="h-4 bg-black/[0.03] rounded-full w-2/3" />
                            <div className="h-3 bg-black/[0.02] rounded-full w-full" />
                            <div className="h-10 bg-black/[0.03] rounded-2xl w-full" />
                        </div>
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                        const isAdded = cartItems.some((item) => item.id === product.id);
                        return (
                            <div
                                key={product.id}
                                className={cn(
                                    "bg-white border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 shadow-sm relative group",
                                    isAdded ? "border-primary bg-primary/[0.005]" : "border-black/[0.03] hover:border-black/[0.08]"
                                )}
                            >
                                <div className="space-y-4">
                                    <div className="aspect-square w-full rounded-2xl bg-black/[0.02] overflow-hidden border border-black/[0.02] relative">
                                        {product.images?.[0]?.src ? (
                                            <img
                                                src={product.images[0].src}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-secondary/15">
                                                <ShoppingBag size={48} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-secondary text-sm md:text-base leading-snug">{product.name}</h4>
                                            <span className="text-sm font-black text-primary shrink-0">
                                                {parseFloat(product.price).toLocaleString()} ج.م
                                            </span>
                                        </div>
                                        {product.description && (
                                            <p className="text-[11px] text-secondary/40 leading-relaxed font-bold mt-1">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4 mt-4 border-t border-black/[0.02]">
                                    <Button
                                        onClick={() => toggleCartItem(product)}
                                        variant={isAdded ? "ghost" : "outline"}
                                        className={cn(
                                            "w-full rounded-2xl py-5 text-xs font-black",
                                            isAdded ? "bg-primary text-white hover:bg-primary/95" : ""
                                        )}
                                    >
                                        {isAdded ? (
                                            <><Check size={14} className="ml-1.5" /> تمت الإضافة</>
                                        ) : (
                                            <><Plus size={14} className="ml-1.5" /> إضافة للسلة</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-16 text-center border-2 border-dashed border-black/[0.03] rounded-3xl">
                    <ShoppingBag className="mx-auto mb-4 text-secondary/20 animate-pulse" size={40} />
                    <p className="text-sm font-black text-secondary/40">لا توجد إضافات متاحة حالياً</p>
                </div>
            )}

            {cartItems.length > 0 && (
                <div className="fixed bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl border border-black/[0.03] shadow-lg p-4 md:p-5 flex items-center justify-between z-[40]">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 overflow-hidden select-none">
                            {cartItems.slice(0, 3).map((item) => (
                                <div key={item.id} className="w-10 h-10 rounded-xl bg-white border border-black/[0.04] p-1 flex items-center justify-center shrink-0">
                                    {item.images?.[0]?.src ? (
                                        <img src={item.images[0].src} className="w-full h-full object-cover rounded-lg" alt="" />
                                    ) : (
                                        <ShoppingBag size={12} className="text-secondary/30" />
                                    )}
                                </div>
                            ))}
                            {cartItems.length > 3 && (
                                <div className="w-10 h-10 rounded-xl bg-secondary/5 border border-black/[0.04] flex items-center justify-center text-xs font-black text-secondary">
                                    +{cartItems.length - 3}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-secondary/30 uppercase">سلة الملحقات</p>
                            <p className="text-xs font-black text-secondary mt-0.5">{cartItems.length} إضافات مختارة</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-left">
                            <p className="text-[10px] font-black text-secondary/30 uppercase">الإجمالي النهائي</p>
                            <p className="text-sm font-black text-primary mt-0.5">
                                {finalTotalDetails.baseTotal.toLocaleString()} ج.م
                            </p>
                        </div>
                        <Button
                            onClick={handleConfirmOrder}
                            className="rounded-2xl shadow-sm px-6 text-xs font-black h-11"
                        >
                            {isConfirmed ? 'تحديث وتأكيد الأوردر' : 'تأكيد الأوردر'}
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
export default StepAccessories;
