import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Package, Truck, Check } from 'lucide-react';

interface TrackingCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { trackingMethod: string, trackingCode: string }) => void;
    report: any;
}

export const TrackingCodeModal: React.FC<TrackingCodeModalProps> = ({ isOpen, onClose, onConfirm, report }) => {
    const [trackingMethod, setTrackingMethod] = useState('ENO');
    const [trackingCode, setTrackingCode] = useState('');

    useEffect(() => {
        if (isOpen && report) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTrackingMethod(report.tracking_method || 'ENO');
            setTrackingCode(report.tracking_code || '');
        }
    }, [isOpen, report]);

    const handleSubmit = () => {
        if (!trackingCode.trim()) {
            alert('يرجى إدخال كود التتبع');
            return;
        }
        onConfirm({ trackingMethod, trackingCode });
        setTrackingCode('');
    };

    if (!report) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إدخال كود التتبع" className="max-w-md">
            <div className="space-y-6">
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                        <Package size={20} />
                        <span className="font-bold text-sm">تفاصيل الشحن لجهاز {report.device_model}</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary px-1">شركة الشحن / طريقة التتبع</label>
                            <select
                                value={trackingMethod}
                                onChange={(e) => setTrackingMethod(e.target.value)}
                                className="w-full bg-white rounded-xl px-4 h-12 text-sm font-bold border border-black/5 outline-none focus:border-primary/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="ENO">Egypt Post (ENO)</option>
                                <option value="Bosta">Bosta</option>
                                <option value="Aramex">Aramex</option>
                                <option value="Other">أخرى</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary px-1">كود التتبع (ENO / Ship Code)</label>
                            <Input
                                placeholder="مثلاً: 12345678"
                                value={trackingCode}
                                onChange={(e) => setTrackingCode(e.target.value)}
                                className="bg-white h-12 rounded-xl"
                                icon={<Truck size={18} />}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl h-12"
                        onClick={onClose}
                    >
                        إلغاء
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-[2] rounded-2xl gap-2 h-12 font-black"
                        onClick={handleSubmit}
                    >
                        <Check size={18} />
                        تأكيد الشحن
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
