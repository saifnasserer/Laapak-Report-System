import React, { use } from 'react';
import ScanReportView from '@/components/reports/scan/ScanReportView';

export default function ScanReportPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);

    return <ScanReportView locale={locale} />;
}
