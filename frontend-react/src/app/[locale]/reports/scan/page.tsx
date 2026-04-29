import ScanReportView from '@/components/reports/scan/ScanReportView';

export default function ScanReportPage({ params }: { params: { locale: string } }) {
    return <ScanReportView locale={params.locale} />;
}
