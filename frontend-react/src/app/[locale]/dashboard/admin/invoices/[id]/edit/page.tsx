import React, { use } from 'react';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditInvoicePage({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = use(params);
    return (
        <DashboardLayout>
            <InvoiceForm locale={locale} invoiceId={id} />
        </DashboardLayout>
    );
}
