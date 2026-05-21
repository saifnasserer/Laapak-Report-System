import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { steps } from '../constants';

export function useReportData(id: string, initialReport?: any) {
    const [report, setReport] = useState<any>(initialReport || null);
    const [isLoading, setIsLoading] = useState(!initialReport);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(initialReport ? !!initialReport.is_confirmed : false);
    const [agentData, setAgentData] = useState<any>(() => {
        if (initialReport?.agent_json) {
            try {
                return typeof initialReport.agent_json === 'string'
                    ? JSON.parse(initialReport.agent_json)
                    : initialReport.agent_json;
            } catch (e) {
                console.error('Failed to parse agent_json from initialReport:', e);
            }
        }
        return null;
    });
    const [showConfetti, setShowConfetti] = useState(false);

    const [activeStep, setActiveStep] = useState(() => {
        const isReload = typeof window !== 'undefined' && (window.performance?.getEntriesByType?.('navigation')?.[0] as any)?.type === 'reload';
        if (isReload) {
            const saved = localStorage.getItem('lrs_activeStep');
            if (saved) return Math.min(Math.max(parseInt(saved, 10), 1), 7);
        }
        return 1;
    });

    useEffect(() => {
        localStorage.setItem('lrs_activeStep', String(activeStep));
    }, [activeStep]);

    useEffect(() => {
        const isCompleted = report?.status === 'completed' || report?.status === 'مكتمل';
        if (isCompleted && (activeStep === 5 || activeStep === 7)) {
            const visibleSteps = steps.filter(s => !isCompleted || (s.id !== 5 && s.id !== 7));
            const firstValid = visibleSteps[0]?.id ?? 1;
            setActiveStep(firstValid);
        }
    }, [report?.status, activeStep]);

    useEffect(() => {
        if (report?.status === 'completed' || report?.status === 'مكتمل') {
            setShowConfetti(true);
        } else {
            setShowConfetti(false);
        }
    }, [report?.status]);

    useEffect(() => {
        if (initialReport) {
            setReport(initialReport);
            setIsConfirmed(!!initialReport.is_confirmed);
            if (initialReport.agent_json) {
                try {
                    const parsed = typeof initialReport.agent_json === 'string'
                        ? JSON.parse(initialReport.agent_json)
                        : initialReport.agent_json;
                    setAgentData(parsed);
                } catch (e) {
                    console.error('Failed to parse agent_json:', e);
                }
            }
            setIsLoading(false);
            return;
        }
        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/reports/${id}`);
                const reportData = response.data.report;
                setReport(reportData);
                setIsConfirmed(!!reportData.is_confirmed);

                if (reportData.agent_json) {
                    try {
                        const parsed = typeof reportData.agent_json === 'string'
                            ? JSON.parse(reportData.agent_json)
                            : reportData.agent_json;
                        setAgentData(parsed);
                    } catch (e) {
                        console.error('Failed to parse agent_json:', e);
                    }
                }

                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch report:', err);
                setError('فشل في تحميل تفاصيل التقرير.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [id, initialReport]);

    return {
        report,
        setReport,
        isLoading,
        error,
        activeStep,
        setActiveStep,
        isConfirmed,
        setIsConfirmed,
        agentData,
        showConfetti,
        setShowConfetti
    };
}
