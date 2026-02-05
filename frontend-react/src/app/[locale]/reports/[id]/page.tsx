'use client';

import React, { use } from 'react';
import ReportView from '@/components/reports/ReportView';

export default function PublicReportDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = use(params);

    return (
        <div className="bg-background min-h-screen">
            <ReportView id={id} locale={locale} viewMode="public" />
        </div>
    );
}
