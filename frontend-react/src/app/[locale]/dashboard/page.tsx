'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

import { use } from 'react';

export default function DashboardIndex({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
            } else if (user.type === 'admin') {
                router.replace('/dashboard/admin');
            } else {
                router.replace('/dashboard/client');
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
