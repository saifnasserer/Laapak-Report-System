'use client';

import React from 'react';
import {
    Users,
    Activity,
    ChevronLeft,
    Globe
} from 'lucide-react';
import UserManagement from '@/components/management/UserManagement';
import WebhookManager from '@/components/management/WebhookManager';
import MessageTemplates from '@/components/management/MessageTemplates';
import { Link } from '@/i18n/routing';
import { clsx } from 'clsx';
import { Settings } from 'lucide-react';

export default function ManagementPage() {
    const [activeTab, setActiveTab] = React.useState<'users' | 'webhooks' | 'settings'>('users');

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-24 h-full relative">
            {/* Header section with glass effect */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest mb-1">
                        <Activity size={14} className="animate-pulse" />
                        لوحة التحكم الإدارية
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight flex items-center gap-3">
                        إدارة النظام
                        <div className="h-2 w-2 rounded-full bg-primary" />
                    </h1>
                    <p className="text-secondary/50 font-medium text-lg max-w-lg leading-relaxed">
                        {activeTab === 'users' ? 'إدارة حسابات الموظفين وصلاحياتهم' : activeTab === 'webhooks' ? 'مراقبة وإدارة الربط مع الأنظمة الخارجية' : 'تخصيص قوالب الرسائل وتفضيلات النظام'}
                    </p>
                </div>

                <Link
                    href="/dashboard/admin"
                    className="flex items-center gap-2 text-sm font-bold text-secondary/40 hover:text-primary transition-all group"
                >
                    <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    العودة للرئيسية
                </Link>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 p-1 bg-white border border-black/5 rounded-2xl w-fit flex-wrap">
                <button
                    onClick={() => setActiveTab('users')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                        activeTab === 'users' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-secondary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                >
                    <Users size={18} />
                    المستخدمين
                </button>
                <button
                    onClick={() => setActiveTab('webhooks')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                        activeTab === 'webhooks' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-secondary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                >
                    <Globe size={18} />
                    الـ Webhooks
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                        activeTab === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-secondary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                >
                    <Settings size={18} />
                    الإعدادات
                </button>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2">
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'webhooks' && <WebhookManager />}
                {activeTab === 'settings' && <MessageTemplates />}
            </div>
        </div>
    );
}
