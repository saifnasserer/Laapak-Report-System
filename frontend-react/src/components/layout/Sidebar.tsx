'use client';
import Image from 'next/image';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
    LayoutDashboard,
    FileText,
    Users,
    Receipt,
    Settings,
    LogOut,
    ChevronRight,
    TrendingUp,
    Wallet,
    X,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
    const t = useTranslations('dashboard.navigation');
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const adminLinks = [
        { href: '/dashboard/admin', label: t('overview'), icon: LayoutDashboard },
        { href: '/dashboard/admin/reports', label: t('reports'), icon: FileText },
        { href: '/dashboard/admin/clients', label: t('clients'), icon: Users },
        { href: '/dashboard/admin/invoices', label: t('invoices'), icon: Receipt },
        { href: '/dashboard/admin/financial', label: t('financial'), icon: TrendingUp },
        { href: '/dashboard/admin/money', label: t('money'), icon: Wallet },
    ];

    const clientLinks = [
        { href: '/dashboard/client', label: t('overview'), icon: LayoutDashboard },
        { href: '/dashboard/client/warranty', label: 'الضمان', icon: ShieldCheck },
    ];

    const links = user?.type === 'admin' ? adminLinks : clientLinks;
    const isRtl = !pathname.startsWith('/en');

    return (
        <aside
            className={cn(
                "fixed inset-y-0 w-[280px] md:w-72 h-screen bg-white flex flex-col z-[100] transition-transform duration-500 ease-in-out",
                isRtl ? "right-0 border-l border-black/10" : "left-0 border-r border-black/10",
                isOpen
                    ? "translate-x-0"
                    : (isRtl ? "translate-x-full" : "-translate-x-full")
            )}
        >
            <div className="p-6 md:p-8 pb-4 flex items-center justify-between">
                <Image
                    src="/logo.png"
                    alt="Laapak"
                    width={180}
                    height={60}
                    className="h-8 md:h-10 w-auto object-contain"
                    priority
                />
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 md:p-2 hover:bg-surface-variant rounded-xl transition-all active:scale-95 text-secondary border border-transparent active:border-black/5"
                >
                    <X size={20} className="md:w-5 md:h-5" />
                </button>
            </div>

            <div className="px-6 py-4">
                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-4 mb-4">القائمة الرئيسية</p>
                <nav className="space-y-2">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    'group flex items-center justify-between px-4 py-3 md:py-3.5 rounded-2xl transition-all no-ripple active:scale-[0.98]',
                                    isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-secondary/70 hover:bg-primary/5 hover:text-primary'
                                )}
                            >
                                <div className="flex items-center">
                                    <Icon size={20} className={cn('transition-colors md:w-[22px] md:h-[22px]', isActive ? 'text-white' : 'group-hover:text-primary')} />
                                    {/* Sizedbox equivalent */}
                                    <div className="w-3 md:w-4" />
                                    <span className="font-bold text-sm md:text-[15px]">{link.label}</span>
                                </div>
                                <ChevronRight size={16} className={cn(
                                    'transition-all',
                                    isActive
                                        ? 'opacity-100 translate-x-0'
                                        : cn('opacity-0', isRtl ? '-translate-x-2' : 'translate-x-2 flip-h')
                                )} />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 md:p-6 space-y-4">
                <div className="bg-surface-variant/50 p-4 rounded-3xl border border-black/5">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 flex items-center justify-center font-black text-primary shadow-sm">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-wider">مرحباً</p>
                            <p className="text-sm font-black text-secondary">{user?.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 text-destructive font-black text-[13px] bg-destructive/5 hover:bg-destructive/10 rounded-2xl transition-all active:scale-95 no-ripple"
                    >
                        <LogOut size={16} />
                        <span>{t('logout')}</span>
                    </button>
                </div>
                <p className="text-[10px] text-center text-secondary/20 font-black tracking-[0.2em]">LAAPAK v1.0.0</p>
            </div>
        </aside>
    );
};
