import React, { use } from 'react';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NewInvoicePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    return (
        <DashboardLayout>
            <InvoiceForm locale={locale} />
        </DashboardLayout>
    );
}
