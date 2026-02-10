'use client';

import React from 'react';
import {
    Users,
    Activity,
    ChevronLeft
} from 'lucide-react';
import UserManagement from '@/components/management/UserManagement';
import { Link } from '@/i18n/routing';

export default function ManagementPage() {
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
                        إدارة المستخدمين
                        <div className="h-2 w-2 rounded-full bg-primary" />
                    </h1>
                    <p className="text-secondary/50 font-medium text-lg max-w-lg leading-relaxed">
                        إدارة حسابات الموظفين، تعيين الصلاحيات، ومتابعة آخر ظهور
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

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                <UserManagement />
            </div>
        </div>
    );
}
