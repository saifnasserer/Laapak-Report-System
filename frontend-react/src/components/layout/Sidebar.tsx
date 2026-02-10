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
    ShieldCheck,
    Package
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
    const [showFinancial, setShowFinancial] = React.useState(false);
    const [clickCount, setClickCount] = React.useState(0);
    const [lastClickTime, setLastClickTime] = React.useState(0);

    React.useEffect(() => {
        const saved = localStorage.getItem('showFinancialDashboard');
        if (saved === 'true') {
            setShowFinancial(true);
        }
    }, []);

    const handleVersionClick = () => {
        const now = Date.now();
        if (now - lastClickTime < 1000) {
            const newCount = clickCount + 1;
            if (newCount >= 5) {
                const newState = !showFinancial;
                setShowFinancial(newState);
                localStorage.setItem('showFinancialDashboard', newState.toString());
                setClickCount(0);
            } else {
                setClickCount(newCount);
            }
        } else {
            setClickCount(1);
        }
        setLastClickTime(now);
    };

    const adminLinks = [
        { href: '/dashboard/admin', label: t('overview'), icon: LayoutDashboard },
        { href: '/dashboard/admin/reports', label: t('reports'), icon: FileText },
        { href: '/dashboard/admin/invoices', label: t('invoices'), icon: Receipt },
        { href: '/dashboard/admin/clients', label: t('clients'), icon: Users },
        { href: '/dashboard/admin/inventory', label: 'المخزن', icon: Package },
        ...(showFinancial ? [
            { href: '/dashboard/admin/financial', label: t('financial'), icon: TrendingUp },
            { href: '/dashboard/admin/financial/money-management', label: 'إدارة الأموال', icon: Wallet },
            { href: '/dashboard/admin/financial/profit-management', label: 'إدارة الأرباح', icon: FileText },
            { href: '/dashboard/admin/financial/expenses', label: 'المصروفات', icon: Receipt },
        ] : []),
        { href: '/dashboard/admin/management', label: 'إدارة النظام', icon: Settings },
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
                "fixed inset-y-0 w-[280px] md:w-72 h-screen bg-white/80 backdrop-blur-xl flex flex-col z-[100] transition-transform duration-500 ease-in-out",
                isRtl ? "right-0 border-l border-black/5" : "left-0 border-r border-black/5",
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
                    className="p-2.5 md:p-2 hover:bg-black/5 rounded-2xl transition-all active:scale-95 text-secondary"
                >
                    <X size={20} className="md:w-5 md:h-5" />
                </button>
            </div>

            <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] px-4 mb-4">القائمة الرئيسية</p>
                <nav className="space-y-1.5">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    'group flex items-center justify-between px-4 py-3 md:py-3 rounded-2xl transition-all no-ripple active:scale-[0.98]',
                                    isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-secondary/60 hover:bg-primary/5 hover:text-primary'
                                )}
                            >
                                <div className="flex items-center">
                                    <Icon size={20} className={cn('transition-colors md:w-[20px] md:h-[20px]', isActive ? 'text-white' : 'group-hover:text-primary')} />
                                    <div className="w-3 md:w-4" />
                                    <span className="font-bold text-sm md:text-[14px]">{link.label}</span>
                                </div>
                                <ChevronRight size={14} className={cn(
                                    'transition-all',
                                    isActive
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 translate-x-2 flip-h'
                                )} />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-6 mt-auto">
                <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2rem] border border-black/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary shadow-inner">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider truncate">المستخدم الحالي</p>
                            <p className="text-sm font-black text-secondary truncate">{user?.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-destructive font-black text-[13px] bg-destructive/5 hover:bg-destructive/10 rounded-xl transition-all active:scale-95 no-ripple"
                    >
                        <LogOut size={16} />
                        <span>{t('logout')}</span>
                    </button>
                </div>
                <p
                    onClick={handleVersionClick}
                    className="text-[9px] text-center text-secondary/20 font-black tracking-[0.3em] mt-6 cursor-default select-none transition-all active:scale-95 active:opacity-50"
                >
                    LAAPAK v1.0.0
                </p>
            </div>
        </aside>
    );
};
