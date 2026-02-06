'use client';

import React, { useState } from 'react';

import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { usePathname } from '@/i18n/routing';
import { Menu, Plus, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useRouter } from '@/i18n/routing';


function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const isRtl = !pathname.startsWith('/en');

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-secondary font-medium animate-pulse">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        redirect('/login');
    }

    const isClient = user?.type === 'client';

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Sidebar Overlay (Mobile/Closed state) */}
            {isSidebarOpen && !isClient && (
                <div
                    className="fixed inset-0 bg-black/10 z-[90] transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {!isClient && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Integrated Header for Sidebar Toggle */}
                {!isClient && (
                    <header className="h-16 md:h-20 shrink-0 grid grid-cols-3 items-center px-4 md:px-8 border-b border-black/5 bg-white/50 backdrop-blur-md z-30 relative">
                        {/* Left Side: Menu & Welcome */}
                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className={cn(
                                    "w-10 h-10 md:w-11 md:h-11 bg-white border border-black/10 rounded-xl text-primary hover:bg-primary hover:text-white transition-all active:scale-95 no-ripple flex items-center justify-center",
                                    isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
                                )}
                            >
                                <Menu size={20} />
                            </button>

                            <div className="hidden lg:flex items-center gap-3">
                                <div className="h-6 w-[1px] bg-black/10" />
                                <div>
                                    <h1 className="text-sm font-bold tracking-tight">مرحباً، {user?.username}</h1>
                                    <p className="text-[10px] text-secondary font-medium">لوحة تحكم النظام</p>
                                </div>
                            </div>
                        </div>

                        {/* Center: Logo */}
                        <div className="flex justify-center items-center h-full">
                            <Image
                                src="/logo.png"
                                alt="Laapak"
                                width={120}
                                height={34}
                                className="h-6 md:h-7 w-auto object-contain"
                                priority
                            />
                        </div>

                        {/* Right Side: Actions */}
                        <div className="flex items-center justify-end gap-2 md:gap-3">
                            <Button
                                size="sm"
                                icon={<Plus size={16} className="md:w-5 md:h-5" />}
                                onClick={() => router.push('/dashboard/admin/reports/new')}
                                className="bg-primary text-white hover:scale-105 active:scale-95 transition-all font-black h-9 md:h-10 px-3 md:px-6 rounded-full text-[10px] md:text-xs"
                            >
                                <span className="hidden sm:inline">إضافة تقرير</span>
                                <span className="sm:hidden">تقرير</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-destructive hover:bg-destructive/5 rounded-xl font-bold px-2 md:px-3 h-9 md:h-10 hidden sm:flex items-center gap-1 md:gap-2 text-[10px] md:text-xs"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">خروج</span>
                            </Button>
                        </div>
                    </header>
                )}



                <section className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth relative">

                    <div className={cn(
                        "max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700",
                        isClient && "pt-0" // Clients will have their own header in the page
                    )}>
                        {children}
                    </div>
                </section>
            </main>
        </div>
    );
}
