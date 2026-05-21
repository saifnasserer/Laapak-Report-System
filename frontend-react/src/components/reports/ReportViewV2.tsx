'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

// Import the two layouts
import ReportViewManual from './ReportView';
import ReportViewSaaS from './ReportViewFromInventory';

export * from './report-view-v2/types';
export * from './report-view-v2/constants';
export * from './report-view-v2/utils';

interface ReportViewProps {
    id: string;
    locale: string;
    viewMode: 'admin' | 'client' | 'public';
    initialReport?: any;
}

export default function ReportViewV2({ id, locale, viewMode, initialReport }: ReportViewProps) {
    const [report, setReport] = useState<any>(initialReport || null);
    const [isLoading, setIsLoading] = useState(!initialReport);
    const [error, setError] = useState<string | null>(null);
    const [viewLayout, setViewLayout] = useState<'manual' | 'saas'>('manual');

    useEffect(() => {
        if (initialReport) {
            setReport(initialReport);
            const hasScan = !!(initialReport.agent_json || initialReport.full_specs);
            const defaultLayout = initialReport.view_mode === 'advanced' ? 'saas' : (initialReport.view_mode === 'standard' ? 'manual' : (hasScan ? 'saas' : 'manual'));
            setViewLayout(defaultLayout);
            setIsLoading(false);
            return;
        }

        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/reports/${id}`);
                const rData = response.data.report;
                setReport(rData);
                const hasScan = !!(rData.agent_json || rData.full_specs);
                const defaultLayout = rData.view_mode === 'advanced' ? 'saas' : (rData.view_mode === 'standard' ? 'manual' : (hasScan ? 'saas' : 'manual'));
                setViewLayout(defaultLayout);
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch report in root orchestrator:', err);
                setError('فشل في تحميل تفاصيل التقرير.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [id, initialReport]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-[#00C853] border-t-transparent animate-spin" />
                    <div className="text-secondary/40 text-sm font-bold">جاري التحميل...</div>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center space-y-6" dir="rtl">
                <div className="w-16 h-16 rounded-full bg-destructive/5 flex items-center justify-center mx-auto">
                    <AlertCircle className="text-destructive" size={32} />
                </div>
                <div className="text-destructive text-xl font-black">{error || 'التقرير غير موجود'}</div>
                <Button onClick={() => window.history.back()} variant="outline" className="rounded-full">العودة للخلف</Button>
            </div>
        );
    }

    const hasScanData = !!(report.agent_json || report.full_specs);

    return (
        <div className="min-h-screen bg-transparent transition-colors duration-300" dir="rtl">


            <div className="transition-all duration-500 ease-in-out">
                {viewLayout === 'saas' ? (
                    <ReportViewSaaS id={id} locale={locale} viewMode={viewMode} initialReport={report} />
                ) : (
                    <ReportViewManual id={id} locale={locale} viewMode={viewMode} initialReport={report} />
                )}
            </div>
        </div>
    );
}
