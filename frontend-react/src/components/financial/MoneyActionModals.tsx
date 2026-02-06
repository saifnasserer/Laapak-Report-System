import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ArrowRightLeft, Download, Upload } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Location {
    id: number;
    name_ar: string;
    balance: number | string;
}

interface MoneyActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    type: 'transfer' | 'deposit' | 'withdrawal';
    locations: Location[];
}

export default function MoneyActionModals({ isOpen, onClose, onSuccess, type, locations }: MoneyActionModalProps) {
    const [amount, setAmount] = useState('');
    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setFromLocationId('');
            setToLocationId('');
            setDescription('');
            setError(null);
        }
    }, [isOpen]);

    const getTitle = () => {
        switch (type) {
            case 'transfer': return 'تحويل بين الحسابات';
            case 'deposit': return 'إيداع نقدي';
            case 'withdrawal': return 'سحب نقدي';
            default: return '';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'transfer': return <ArrowRightLeft size={24} />;
            case 'deposit': return <Download size={24} />;
            case 'withdrawal': return <Upload size={24} />;
            default: return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data: any = {
                amount: parseFloat(amount),
                description,
                type: type === 'transfer' ? 'transfer' :
                    type === 'deposit' ? 'deposit' : 'withdrawal'
            };

            if (type === 'transfer') {
                data.from_location_id = parseInt(fromLocationId);
                data.to_location_id = parseInt(toLocationId);
            } else if (type === 'deposit') {
                data.to_location_id = parseInt(toLocationId);
            } else if (type === 'withdrawal') {
                data.from_location_id = parseInt(fromLocationId);
            }

            await api.post('/money/movement', data);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Movement failed:', err);
            setError(err.response?.data?.message || 'فشلت العملية، يرجى المحاولة مرة أخرى');
        } finally {
            setIsLoading(false);
        }
    };

    const getSelectedLabel = (id: string) => {
        return locations.find(l => l.id.toString() === id)?.name_ar || '';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                        type === 'deposit' ? "bg-green-100 text-green-600" :
                            type === 'withdrawal' ? "bg-red-100 text-red-600" :
                                "bg-blue-100 text-blue-600"
                    )}>
                        {getIcon()}
                    </div>
                    <div>
                        <h4 className="font-bold text-secondary">{getTitle()}</h4>
                        <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-widest">أدخل تفاصيل العملية المالية أدناه</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {(type === 'transfer' || type === 'withdrawal') && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">من الحساب / الخزينة</label>
                            <Select value={fromLocationId} onValueChange={setFromLocationId}>
                                <SelectTrigger className="h-14 rounded-2xl bg-black/[0.02] border-transparent focus:ring-primary/20">
                                    <SelectValue placeholder="اختر الحساب" label={getSelectedLabel(fromLocationId)} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-black/5 shadow-2xl bg-white/95 backdrop-blur-md">
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id.toString()} className="h-12 rounded-xl mx-1 my-0.5 font-medium">
                                            <div className="flex justify-between items-center w-full gap-8">
                                                <span>{loc.name_ar}</span>
                                                <span className="font-mono text-xs opacity-50">{Number(loc.balance || 0).toLocaleString()} ج.م</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {(type === 'transfer' || type === 'deposit') && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">إلى الحساب / الخزينة</label>
                            <Select value={toLocationId} onValueChange={setToLocationId}>
                                <SelectTrigger className="h-14 rounded-2xl bg-black/[0.02] border-transparent focus:ring-primary/20">
                                    <SelectValue placeholder="اختر الحساب" label={getSelectedLabel(toLocationId)} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-black/5 shadow-2xl bg-white/95 backdrop-blur-md">
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id.toString()} className="h-12 rounded-xl mx-1 my-0.5 font-medium">
                                            {loc.name_ar}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">المبلغ</label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            prefix="ج.م"
                            required
                            className="h-14 rounded-2xl bg-black/[0.02] border-transparent focus:ring-primary/20 font-mono text-lg font-black"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">ملاحظات (اختياري)</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="وصف العملية..."
                            className="h-14 rounded-2xl bg-black/[0.02] border-transparent focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-black/5 flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl font-bold"
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98]",
                            type === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                                type === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' :
                                    'bg-primary hover:bg-primary-dark'
                        )}
                    >
                        {isLoading ? 'جاري التنفيذ...' : 'تأكيد العملية'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
