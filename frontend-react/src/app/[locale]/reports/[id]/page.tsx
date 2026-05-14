'use client';

import React, { use } from 'react';
import ReportViewV2 from '@/components/reports/ReportViewV2';

export default function PublicReportDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = use(params);

    return (
        <div className="bg-background min-h-screen">
            <ReportViewV2 id={id} locale={locale} viewMode="public" />
        </div>
    );
}
