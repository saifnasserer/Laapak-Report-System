'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    MessageSquare,
    Info,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Calendar,
    Settings,
    Activity,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const MessageTemplates = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({});
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
        type: null,
        message: ''
    });
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setStatus({ type: 'error', message: 'فشل في تحميل الإعدادات' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setStatus({ type: null, message: '' });
        try {
            const templatesToSave = {
                template_warranty_alert_6m: settings.template_warranty_alert_6m,
                template_warranty_alert_12m: settings.template_warranty_alert_12m,
                template_report_ready: settings.template_report_ready
            };

            await api.put('/settings', templatesToSave);
            setStatus({ type: 'success', message: 'تم حفظ القوالب بنجاح' });
            setTimeout(() => setStatus({ type: null, message: '' }), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setStatus({ type: 'error', message: 'فشل في حفظ القوالب' });
        } finally {
            setSaving(false);
        }
    };

    const handleTemplateChange = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const templateItems = [
        {
            key: 'template_warranty_alert_6m',
            title: 'تنبيه الصيانة (6 أشهر)',
            icon: Smartphone,
            color: '#3b82f6',
            description: 'يُرسل هذا القالب آلياً لتذكير العميل بموعد الصيانة بعد 6 أشهر من الفحص.'
        },
        {
            key: 'template_warranty_alert_12m',
            title: 'تنبيه الصيانة السنوي (12 شهر)',
            icon: Calendar,
            color: '#a855f7',
            description: 'يُرسل هذا القالب آلياً لتذكير العميل بموعد الصيانة السنوية.'
        },
        {
            key: 'template_report_ready',
            title: 'جاهزية التقرير (Share)',
            icon: Settings,
            color: '#22c55e',
            description: 'القالب المستخدم عند مشاركة التقرير مع العميل عبر الواتساب يدوياً.'
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground">قوالب الرسائل</h1>
                        <p className="text-sm text-secondary/50 font-bold">تخصيص محتوى رسائل الواتساب التلقائية</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="primary"
                    className="h-12 rounded-full px-8 gap-2 bg-primary text-white hover:scale-105 transition-all font-bold shadow-lg shadow-primary/20"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>حفظ جميع القوالب</span>
                </Button>
            </div>

            {/* Status Feedback */}
            {status.type && (
                <div className={cn(
                    "p-4 rounded-[2rem] flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    status.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                )}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold">{status.message}</span>
                </div>
            )}

            {/* Templates List */}
            <div className="space-y-4 pt-4">
                {templateItems.map((item) => {
                    const Icon = item.icon;
                    const isExpanded = expanded === item.key;

                    return (
                        <div
                            key={item.key}
                            className="relative group rounded-[2.5rem] p-1 transition-all duration-300 bg-white/40 hover:bg-white/60 shadow-sm"
                        >
                            <div className={cn(
                                "flex flex-col p-4 md:p-6 rounded-[2.2rem] bg-white/80 backdrop-blur-md border border-primary/10 transition-all",
                                isExpanded && "ring-2 ring-primary/20"
                            )}>
                                {/* Row Header */}
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpanded(isExpanded ? null : item.key)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-14 h-14 rounded-[1.4rem] flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105"
                                            style={{ backgroundColor: `${item.color}15`, color: item.color }}
                                        >
                                            <Icon size={26} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-foreground text-lg mb-0.5">{item.title}</h3>
                                            <p className="text-secondary/40 text-xs font-bold">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="hidden border-primary/20 bg-white/50 font-bold px-3 py-1 md:flex">
                                            واتساب
                                        </Badge>
                                        <div className="p-2 rounded-full hover:bg-primary/5 text-secondary/30 group-hover:text-primary transition-colors">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Row Content (Expanded) */}
                                {isExpanded && (
                                    <div className="mt-6 pt-6 border-t border-black/5 animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Textarea Area */}
                                            <div className="lg:col-span-2 space-y-4">
                                                <div className="relative">
                                                    <textarea
                                                        value={settings[item.key] || ''}
                                                        onChange={(e) => {
                                                            handleTemplateChange(item.key, e.target.value);
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                                        }}
                                                        onFocus={(e) => {
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                                        }}
                                                        className="w-full bg-black/[0.02] border border-black/5 rounded-[1.8rem] p-6 font-medium text-secondary min-h-[140px] focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all leading-relaxed outline-none shadow-inner overflow-hidden resize-none"
                                                        dir="rtl"
                                                        placeholder="ادخل نص القالب هنا..."
                                                    />
                                                    <div className="absolute top-4 left-4 pointer-events-none opacity-10">
                                                        <Activity size={100} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Variables Helper Area */}
                                            <div className="lg:col-span-1">
                                                <div className="bg-primary/5 rounded-[1.8rem] p-5 h-full border border-primary/10 relative overflow-hidden">
                                                    <div className="absolute top-4 right-4 text-primary/10">
                                                        <Info size={120} />
                                                    </div>
                                                    <h4 className="font-black text-sm text-primary mb-4 flex items-center gap-2">
                                                        <Info size={16} />
                                                        المتغيرات المتاحة
                                                    </h4>
                                                    <div className="space-y-4 relative z-10">
                                                        {[
                                                            { tag: '{{client_name}}', label: 'اسم العميل' },
                                                            { tag: '{{device_model}}', label: 'موديل الجهاز' },
                                                            { tag: '{{warranty_date}}', label: 'تاريخ الضمان' },
                                                            { tag: '{{username}}', label: 'اسم المستخدم' },
                                                            { tag: '{{password}}', label: 'كلمة المرور' }
                                                        ].map((v) => (
                                                            <div key={v.tag} className="flex flex-col gap-1">
                                                                <code className="text-[11px] font-black text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-lg tracking-wider">
                                                                    {v.tag}
                                                                </code>
                                                                <span className="text-[10px] text-secondary/40 font-bold mr-1">{v.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* General Tips */}
            <div className="bg-white/30 backdrop-blur-sm rounded-[2.5rem] p-6 border border-dashed border-black/5 flex flex-col md:flex-row items-center gap-6 mt-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-yellow-500/10 flex items-center justify-center text-yellow-600 shrink-0">
                    <Info size={32} />
                </div>
                <div>
                    <h4 className="font-black text-foreground mb-1">نصيحة هامة</h4>
                    <p className="text-secondary/50 text-sm font-bold leading-relaxed">
                        تأكد من استخدام المتغيرات بشكل صحيح تماماً كما هي مكتوبة داخل الأقواس <code>{"{{ }}"}</code> ليتم استبدالها بالبيانات الحقيقية تلقائياً عند الإرسال.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MessageTemplates;
