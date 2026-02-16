import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Copy, Send, Check } from 'lucide-react';
import api from '@/lib/api';

interface WhatsAppShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any;
    locale: string;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({ isOpen, onClose, report, locale }) => {
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                setSettings(response.data);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };

        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    useEffect(() => {
        if (report) {
            const password = report.client?.orderCode || report.order_number || report.id || '';
            const username = report.client_phone || report.client?.phone || '';
            const clientName = report.client_name || report.client?.name || 'عميلنا العزيز';
            const deviceModel = report.device_model || '';

            const template = settings.template_report_ready;

            if (template) {
                const msg = template
                    .replace(/{{client_name}}/g, clientName)
                    .replace(/{{device_model}}/g, deviceModel)
                    .replace(/{{username}}/g, username)
                    .replace(/{{password}}/g, password);
                setMessage(msg);
            } else {
                // Fallback to legacy hardcoded message
                const msg = `التقرير الخاص بحضرتك دلوقتي جاهز تقدر تشوف تفاصيله كامله دلوقتي من هنا\nhttps://reports.laapak.com\n\nUsername: ${username}\nPassword: ${password}`;
                setMessage(msg);
            }
        }
    }, [report, settings]);

    if (!report) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        if (!report.id) return;

        try {
            setIsSending(true);
            await api.post(`/reports/${report.id}/share/whatsapp`, {
                message: message
            });
            alert('تم إرسال التقرير عبر واتساب بنجاح');
            onClose();
        } catch (error) {
            console.error('Failed to share report:', error);
            alert('فشل إرسال التقرير عبر واتساب');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="مشاركة عبر الواتساب" className="max-w-md">
            <div className="space-y-6">
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3 text-primary">
                        <MessageSquare size={20} />
                        <span className="font-bold text-sm">معاينة الرسالة</span>
                    </div>
                    <textarea
                        className="w-full bg-white/50 rounded-xl p-4 text-sm font-medium whitespace-pre-wrap leading-relaxed dir-rtl text-right min-h-[120px] outline-none border border-transparent focus:border-primary/20 transition-all resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl gap-2 h-12"
                        onClick={handleCopy}
                    >
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        {copied ? 'تم النسخ' : 'نسخ النص'}
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-[2] rounded-2xl gap-2 h-12 bg-[#25D366] hover:bg-[#20ba56] border-none text-white font-black"
                        onClick={handleSend}
                        disabled={isSending}
                    >
                        <Send size={18} className={isSending ? "animate-pulse" : ""} />
                        {isSending ? 'جاري الإرسال...' : 'إرسال الآن'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
