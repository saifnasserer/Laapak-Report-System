'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, ShoppingCart, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';
import { clsx } from 'clsx';

interface AddToListModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: { device_brand: string; device_model: string; count: number } | null;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({ isOpen, onClose, item }) => {
    const [lists, setLists] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [newListName, setNewListName] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('EGP');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);

    useEffect(() => {
        if (isOpen) {
            fetchLists();
            setIsSuccess(false);
            setNewListName('');
            setSelectedCurrency('EGP');
            setIsCreatingNew(false);
            setSelectedListId(null);
            setQuantity(1);
            setPrice(0);
        }
    }, [isOpen]);

    const fetchLists = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/shopping-lists');
            if (res.data.success) {
                const fetchedLists = res.data.data;
                setLists(fetchedLists);

                // Find first list that doesn't contain the item
                const availableList = fetchedLists.find((list: any) =>
                    !list.items?.some((i: any) =>
                        item && i.brand.toLowerCase() === item.device_brand.toLowerCase() &&
                        i.model.toLowerCase() === item.device_model.toLowerCase()
                    )
                );

                if (availableList) {
                    setSelectedListId(availableList.id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch lists:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!item || (!selectedListId && !newListName)) return;

        setIsAdding(true);
        try {
            let listId = selectedListId;

            if (isCreatingNew && newListName) {
                const newListRes = await api.post('/shopping-lists', {
                    name: newListName,
                    currency: selectedCurrency
                });
                if (newListRes.data.success) {
                    listId = newListRes.data.data.id;
                }
            }

            if (listId) {
                await api.post(`/shopping-lists/${listId}/items`, {
                    brand: item.device_brand,
                    model: item.device_model,
                    quantity,
                    price
                });
                setIsSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (err) {
            console.error('Failed to add to list:', err);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 border-2 border-black/5 backdrop-blur-3xl bg-white/90">
                <DialogHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <ShoppingCart size={24} />
                    </div>
                    <DialogTitle className="text-2xl font-black text-foreground">إضافة لقائمة الطلبات</DialogTitle>
                    <DialogDescription className="text-secondary/60 font-bold">
                        أضف <span className="text-primary">{item?.device_brand} {item?.device_model}</span> إلى إحدى قوائم التسوق الخاصة بك.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* List Selection */}
                    {!isCreatingNew ? (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest px-1">اختر قائمة</label>
                            {isLoading ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" /></div>
                            ) : lists.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {lists.map((list) => {
                                        const isAlreadyInList = list.items?.some((i: any) =>
                                            item && i.brand.toLowerCase() === item.device_brand.toLowerCase() &&
                                            item && i.model.toLowerCase() === item.device_model.toLowerCase()
                                        );

                                        return (
                                            <button
                                                key={list.id}
                                                disabled={isAlreadyInList}
                                                type="button"
                                                onClick={() => setSelectedListId(list.id)}
                                                className={clsx(
                                                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-right group",
                                                    isAlreadyInList
                                                        ? "border-black/5 bg-black/[0.02] opacity-50 cursor-not-allowed"
                                                        : selectedListId === list.id
                                                            ? "border-primary bg-primary/5 text-primary"
                                                            : "border-black/5 hover:border-black/10 text-secondary/70 hover:bg-black/[0.02]"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{list.name}</span>
                                                    {isAlreadyInList && (
                                                        <span className="text-[10px] text-primary font-black uppercase">موجودة بالفعل</span>
                                                    )}
                                                </div>
                                                {selectedListId === list.id && !isAlreadyInList && <Check size={18} />}
                                            </button>
                                        );
                                    })}
                                    <Button
                                        variant="ghost"
                                        className="h-14 rounded-2xl border-2 border-dashed border-black/10 hover:border-primary/20 hover:bg-primary/5 text-secondary/40 hover:text-primary gap-2"
                                        onClick={() => setIsCreatingNew(true)}
                                    >
                                        <Plus size={18} />
                                        <span>إنشاء قائمة جديدة</span>
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="w-full h-14 rounded-2xl border-2 border-dashed border-black/10 hover:border-primary/20 hover:bg-primary/5 text-secondary/40 hover:text-primary gap-2"
                                    onClick={() => setIsCreatingNew(true)}
                                >
                                    <Plus size={18} />
                                    <span>إنشاء قائمة أولى</span>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest px-1">اسم القائمة الجديدة</label>
                                <Input
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="مثلاً: طلبية الأسبوع"
                                    className="h-14 rounded-2xl font-bold text-right"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest px-1">العملة</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['EGP', 'AED'].map((curr) => (
                                        <button
                                            key={curr}
                                            type="button"
                                            onClick={() => setSelectedCurrency(curr)}
                                            className={clsx(
                                                "h-12 rounded-xl border-2 font-bold transition-all",
                                                selectedCurrency === curr
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-black/5 text-secondary/40 hover:border-black/10"
                                            )}
                                        >
                                            {curr === 'EGP' ? 'جنيه مصري (EGP)' : 'درهم إماراتي (AED)'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCreatingNew(false)}
                                className="text-xs text-primary font-bold hover:underline px-2"
                            >
                                العودة للاختيار من القوائم
                            </button>
                        </div>
                    )}

                    {/* Quantity and Price */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-black/5">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest px-1 text-right block">الكمية</label>
                            <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                className="h-14 rounded-2xl font-bold text-center"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest px-1 text-right block">السعر المتوقع</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                className="h-14 rounded-2xl font-bold text-center"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-3 pt-6 border-t-2 border-black/5">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl font-bold h-12"
                        onClick={onClose}
                    >
                        إلغاء
                    </Button>
                    <Button
                        className="flex-1 rounded-2xl font-black h-12 gap-2"
                        onClick={handleAdd}
                        disabled={isAdding || isSuccess || (!selectedListId && !newListName)}
                    >
                        {isAdding ? <Loader2 size={18} className="animate-spin" /> :
                            isSuccess ? <Check size={18} /> : null}
                        <span>{isSuccess ? 'تمت الإضافة' : 'إضافة'}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
