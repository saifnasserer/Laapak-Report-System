'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { clsx } from 'clsx';

interface AnalysisChartProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    isLoading?: boolean;
}

export const AnalysisChart = ({
    title,
    description,
    children,
    className,
    isLoading = false
}: AnalysisChartProps) => {
    return (
        <Card variant="glass" className={clsx("rounded-3xl border-2 border-black/5 bg-white/80 backdrop-blur-xl transition-all duration-300", className)}>
            <CardHeader className="pb-0 pt-6 px-6">
                <CardTitle className="text-xl font-black tracking-tight text-foreground">{title}</CardTitle>
                {description && <p className="text-[11px] font-bold text-secondary/40 uppercase tracking-wider mt-1">{description}</p>}
            </CardHeader>
            <CardContent className="h-[320px] w-full p-4 md:p-6">
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 opacity-50">
                        <div className="w-10 h-10 border-[3px] border-primary/10 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">تحميل البيانات...</p>
                    </div>
                ) : (
                    <div className="w-full h-full">
                        {children}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
