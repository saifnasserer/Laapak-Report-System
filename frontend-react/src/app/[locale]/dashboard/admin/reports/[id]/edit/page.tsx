'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportForm from '@/components/reports/ReportForm';
import { use } from 'react';

export default function EditReportPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = use(params);

    return (
        <DashboardLayout>
            <React.Suspense fallback={<div className="p-12 text-center font-bold text-secondary">جاري التحميل...</div>}>
                <ReportForm locale={locale} reportId={id} />
            </React.Suspense>
        </DashboardLayout>
    );
}
