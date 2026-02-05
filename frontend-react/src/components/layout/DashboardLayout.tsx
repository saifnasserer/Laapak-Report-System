'use client';

import React, { useState } from 'react';

import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { usePathname } from '@/i18n/routing';
import { Menu } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
                <section className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth relative">
                    {/* Floating Menu Trigger (aligned with header) - Hidden for clients */}
                    {!isClient && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className={cn(
                                "absolute top-6 md:top-8 z-30 p-3 bg-white border border-black/10 rounded-2xl text-primary hover:bg-primary hover:text-white transition-all active:scale-95 no-ripple",
                                isRtl ? "right-6 md:right-8" : "left-6 md:left-8"
                            )}
                        >
                            <Menu size={24} />
                        </button>
                    )}
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
