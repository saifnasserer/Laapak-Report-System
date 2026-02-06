import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ArrowRightLeft, Download, Upload } from 'lucide-react';
import api from '@/lib/api';

interface Location {
    id: number;
    name_ar: string;
    type: string;
    balance: number;
}

interface MoneyActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    type: 'transfer' | 'deposit' | 'withdrawal';
    locations: Location[];
}

export default function MoneyActionModals({ isOpen, onClose, onSuccess, type, locations }: MoneyActionModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens/closes or type changes
    useEffect(() => {
        if (isOpen) {
            setFromLocationId('');
            setToLocationId('');
            setAmount('');
            setDescription('');
            setError(null);
        }
    }, [isOpen, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let endpoint = '';
            const payload: any = {
                amount: parseFloat(amount),
                description
            };

            if (type === 'transfer') {
                endpoint = '/money/transfer';
                payload.fromLocationId = fromLocationId;
                payload.toLocationId = toLocationId;
            } else if (type === 'deposit') {
                endpoint = '/money/deposit';
                payload.toLocationId = toLocationId;
            } else if (type === 'withdrawal') {
                endpoint = '/money/withdrawal';
                payload.fromLocationId = fromLocationId;
            }

            const response = await api.post(endpoint, payload);

            if (response.data.success) {
                onSuccess();
                onClose();
            } else {
                setError(response.data.message || 'فشلت العملية');
            }
        } catch (err: any) {
            console.error('Money action error:', err);
            setError(err.response?.data?.message || err.message || 'حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'transfer': return 'تحويل أموال';
            case 'deposit': return 'إيداع أموال';
            case 'withdrawal': return 'سحب أموال';
            default: return '';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'transfer': return <ArrowRightLeft className="h-5 w-5 text-primary" />;
            case 'deposit': return <Download className="h-5 w-5 text-green-600" />;
            case 'withdrawal': return <Upload className="h-5 w-5 text-red-600" />;
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {getIcon()}
                        <DialogTitle>{getTitle()}</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    {(type === 'transfer' || type === 'withdrawal') && (
                        <div className="space-y-2">
                            <Label>من الحساب / الخزينة</Label>
                            <Select value={fromLocationId} onValueChange={setFromLocationId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحساب" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id.toString()}>
                                            {loc.name_ar} ({Number(loc.balance).toLocaleString()} ج.م)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {(type === 'transfer' || type === 'deposit') && (
                        <div className="space-y-2">
                            <Label>إلى الحساب / الخزينة</Label>
                            <Select value={toLocationId} onValueChange={setToLocationId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحساب" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id.toString()}>
                                            {loc.name_ar}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>المبلغ</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>ملاحظات (اختياري)</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="وصف العملية..."
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={
                                type === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                                    type === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' : ''
                            }
                        >
                            {isLoading ? 'جاري التنفيذ...' : 'تأكيد العملية'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
