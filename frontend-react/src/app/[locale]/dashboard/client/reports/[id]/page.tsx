'use client';

import React, { use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportViewV2 from '@/components/reports/ReportViewV2';

export default function ClientReportDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = use(params);

    return (
        <DashboardLayout>
            <ReportViewV2 id={id} locale={locale} viewMode="client" />
        </DashboardLayout>
    );
}
