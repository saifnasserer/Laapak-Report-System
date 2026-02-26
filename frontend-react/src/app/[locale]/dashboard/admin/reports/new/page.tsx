'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportForm from '@/components/reports/ReportForm';
import { use } from 'react';

export default function NewReportPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);

    return (
        <DashboardLayout>
            <React.Suspense fallback={<div className="p-12 text-center font-bold text-secondary">جاري التحميل...</div>}>
                <ReportForm locale={locale} />
            </React.Suspense>
        </DashboardLayout>
    );
}
