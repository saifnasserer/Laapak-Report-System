import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import api from '@/lib/api';

interface ExpenseCategory {
    id: number;
    name_ar: string;
    color: string;
}

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [type, setType] = useState('operating'); // operating, marketing, administrative
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [repeatMonthly, setRepeatMonthly] = useState(false);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            // Reset form
            setName('');
            setAmount('');
            setCategoryId('');
            setType('operating');
            setDate(new Date().toISOString().split('T')[0]);
            setRepeatMonthly(false);
            setDescription('');
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/financial/expense-categories');
            if (response.data.success) {
                setCategories(response.data.data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post('/financial/expenses', {
                name_ar: name, // Using name_ar as main name
                name: name,
                amount: parseFloat(amount),
                category_id: categoryId,
                type,
                date,
                repeat_monthly: repeatMonthly,
                description
            });

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error creating expense:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>إضافة مصروف جديد</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>عنوان المصروف</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="مثال: فاتورة كهرباء"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>المبلغ</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>التصنيف</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر التصنيف" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: cat.color || '#ccc' }}
                                                />
                                                {cat.name_ar}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>نوع المصروف</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="operating">تشغيلي</SelectItem>
                                    <SelectItem value="marketing">تسويقي</SelectItem>
                                    <SelectItem value="administrative">إداري</SelectItem>
                                    <SelectItem value="salary">رواتب</SelectItem>
                                    <SelectItem value="other">أخرى</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>تاريخ المصروف</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>تفاصيل إضافية</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="اختياري"
                        />
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse pt-2">
                        <Checkbox
                            id="repeat"
                            checked={repeatMonthly}
                            onCheckedChange={(checked) => setRepeatMonthly(checked === true)}
                        />
                        <Label htmlFor="repeat" className="cursor-pointer">تكرار هذا المصروف شهرياً</Label>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'جاري الحفظ...' : 'حفظ المصروف'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
