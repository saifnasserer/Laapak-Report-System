import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import {
    Tag,
    DollarSign,
    Calendar as CalendarIcon,
    FileText,
    Plus,
    Save,
    Layout,
    RefreshCcw,
    Trash2,
    Wallet,
    Store
} from 'lucide-react';

interface ExpenseCategory {
    id: number;
    name_ar: string;
    color: string;
}

interface MoneyLocation {
    id: number;
    name_ar: string;
    name: string;
    balance: number;
}

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    expense?: any;
}

export default function ExpenseModal({ isOpen, onClose, onSuccess, expense }: ExpenseModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [locations, setLocations] = useState<MoneyLocation[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchLocations();
            fetchSuppliers();

            if (expense) {
                setName(expense.name_ar || expense.name || '');
                setAmount(expense.amount?.toString() || '');
                setCategoryId(expense.category_id?.toString() || '');
                setLocationId(expense.money_location_id?.toString() || '');
                setSupplierId(expense.supplier_id?.toString() || '');
                const expenseDate = expense.date ? new Date(expense.date) : new Date();
                setDate(expenseDate.toISOString().split('T')[0]);
                setDescription(expense.description || '');
            } else {
                // Reset form for addition
                setName('');
                setAmount('');
                setCategoryId('');
                setLocationId('');
                setSupplierId('');
                setDate(new Date().toISOString().split('T')[0]);
                setDescription('');
            }
        }
    }, [isOpen, expense]);

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

    const fetchLocations = async () => {
        try {
            const response = await api.get('/money/locations');
            if (response.data.success) {
                setLocations(response.data.data.locations || []);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            if (response.data.success) {
                setSuppliers(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            name_ar: name,
            name: name,
            amount: parseFloat(amount),
            category_id: parseInt(categoryId),
            money_location_id: locationId ? parseInt(locationId) : null,
            supplier_id: supplierId ? parseInt(supplierId) : null,
            date,
            description
        };

        try {
            const response = expense
                ? await api.put(`/financial/expenses/${expense.id}`, payload)
                : await api.post('/financial/expenses', payload);

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error saving expense:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!expense || !window.confirm('هل أنت متأكد من حذف هذا المصروف؟ سيتم استرداد المبلغ إلى الحساب.')) return;

        setIsDeleting(true);
        try {
            const response = await api.delete(`/financial/expenses/${expense.id}`);
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={expense ? "تعديل مصروف" : "إضافة مصروف جديد"}
            className="max-w-[550px]"
        >
            <form onSubmit={handleSubmit} className="space-y-6 text-right" dir="rtl">
                {/* Section 1: Identity */}
                <div className="space-y-4 bg-black/[0.02] p-6 rounded-[2.5rem] border border-primary/5">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase px-2 justify-start">
                            <FileText size={12} className="text-primary" />
                            عنوان المصروف
                        </Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="مثال: فاتورة كهرباء، إيجار المكتب..."
                            required
                            className="h-12 rounded-full bg-white border-primary/10 focus:border-primary transition-all px-6 font-bold text-secondary"
                        />
                    </div>

                    <div className="space-y-2 text-right">
                        <Label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase px-2 justify-start">
                            <Tag size={12} className="text-primary" />
                            التصنيف
                        </Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-12 rounded-full bg-white border-primary/10 flex-row-reverse text-sm font-bold text-secondary">
                                <SelectValue placeholder="اختر التصنيف..." className="text-right w-full" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[2rem] border-primary/20 shadow-2xl bg-white">
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id.toString()} className="rounded-xl">
                                        <div className="flex items-center gap-2 justify-end w-full">
                                            <span className="font-bold">{cat.name_ar}</span>
                                            <div
                                                className="w-3 h-3 rounded-full shadow-sm"
                                                style={{ backgroundColor: cat.color || '#ccc' }}
                                            />
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 text-right">
                        <Label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase px-2 justify-start">
                            <Wallet size={12} className="text-primary" />
                            حساب الدفع
                        </Label>
                        <Select value={locationId} onValueChange={setLocationId}>
                            <SelectTrigger className="h-12 rounded-full bg-white border-primary/10 flex-row-reverse text-sm font-bold text-secondary">
                                <SelectValue placeholder="اختر الحساب (نقد، بنك...)" className="text-right w-full" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[2rem] border-primary/20 shadow-2xl bg-white">
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id.toString()} className="rounded-xl">
                                        <div className="flex items-center gap-2 justify-end w-full">
                                            <span className="font-bold">{loc.name_ar}</span>
                                            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {Number(loc.balance || 0).toLocaleString()} ج.م
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 text-right">
                        <Label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase px-2 justify-start">
                            <Store size={12} className="text-primary" />
                            المورد (اختياري)
                        </Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger className="h-12 rounded-full bg-white border-primary/10 flex-row-reverse text-sm font-bold text-secondary">
                                <SelectValue placeholder="اختر المورد المرتبط بالمصروف..." className="text-right w-full" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[2rem] border-primary/20 shadow-2xl bg-white">
                                <SelectItem value="none" className="rounded-xl">بدون مورد</SelectItem>
                                {suppliers.map(sup => (
                                    <SelectItem key={sup.id} value={sup.id.toString()} className="rounded-xl">
                                        <div className="flex items-center gap-2 justify-end w-full">
                                            <span className="font-bold">{sup.name}</span>
                                            {sup.code && <span className="text-[10px] text-secondary/40 font-mono">({sup.code})</span>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Section 2: Financial Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-black/[0.02] p-5 rounded-[2.5rem] border border-primary/5">
                        <Label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase px-2 justify-start">
                            <DollarSign size={12} className="text-primary" />
                            المبلغ
                        </Label>
                        <div className="relative">
                            <Input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="h-12 rounded-full bg-white border-primary/10 focus:border-primary transition-all pl-12 pr-6 font-mono font-black text-primary text-lg"
                            />
                            <span className="absolute left-5 top-3.5 text-[10px] text-secondary/30 font-black">ج.م</span>
                        </div>
                    </div>

                    <div className="space-y-2 bg-black/[0.02] p-5 rounded-[2.5rem] border border-primary/5">
                        <Label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase px-2 justify-start">
                            <CalendarIcon size={12} className="text-primary" />
                            تاریخ المصروف
                        </Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="h-12 rounded-full bg-white border-primary/10 focus:border-primary transition-all px-6 font-bold text-secondary text-sm"
                        />
                    </div>
                </div>

                {/* Section 3: Notes */}
                <div className="space-y-2 bg-primary/[0.02] p-5 rounded-[2.5rem] border border-primary/5">
                    <Label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase px-2 justify-start">
                        <FileText size={12} className="text-primary" />
                        ملاحظات وتفاصيل إضافية
                    </Label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="أضف أي ملاحظات هنا..."
                        className="w-full min-h-[80px] rounded-[1.8rem] bg-white border-primary/10 focus:border-primary transition-all p-5 text-sm font-medium text-secondary/80 outline-none resize-none"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-black/5">
                    <Button
                        type="submit"
                        disabled={isLoading || isDeleting}
                        className="flex-[2] h-14 rounded-full gap-3 font-black text-lg transition-all active:scale-[0.98] bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/30"
                    >
                        {isLoading ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                        {isLoading ? (expense ? 'جاري التعديل...' : 'جاري الحفظ...') : (expense ? 'تعديل المصروف' : 'حفظ المصروف')}
                    </Button>

                    {expense && (
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isLoading || isDeleting}
                            onClick={handleDelete}
                            className="flex-1 h-14 rounded-full font-black bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-200 transition-all border-none"
                        >
                            {isDeleting ? <RefreshCcw className="animate-spin" size={20} /> : <Trash2 size={20} />}
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading || isDeleting}
                        className="flex-1 h-14 rounded-full font-black border-primary/20 text-secondary/60 hover:bg-black/5 hover:text-secondary transition-all"
                    >
                        إلغاء
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

