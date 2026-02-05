'use client';

import React, { use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportView from '@/components/reports/ReportView';

export default function ClientReportDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = use(params);

    return (
        <DashboardLayout>
            <ReportView id={id} locale={locale} viewMode="client" />
        </DashboardLayout>
    );
}
