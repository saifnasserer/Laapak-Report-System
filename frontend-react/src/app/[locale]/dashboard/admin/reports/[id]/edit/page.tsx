'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportForm from '@/components/reports/ReportForm';
import { use } from 'react';

export default function EditReportPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = use(params);

    return (
        <DashboardLayout>
            <ReportForm locale={locale} reportId={id} />
        </DashboardLayout>
    );
}
