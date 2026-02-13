'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface AnalysisKpiCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    trend?: number;
    icon: LucideIcon;
    isLoading?: boolean;
    variant?: 'primary' | 'success' | 'warning' | 'info';
}

export const AnalysisKpiCard = ({
    title,
    value,
    subValue,
    trend,
    icon: Icon,
    isLoading = false,
    variant = 'primary'
}: AnalysisKpiCardProps) => {
    const variantStyles = {
        primary: 'bg-primary/[0.02] border-primary/20 text-primary hover:bg-primary/[0.05]',
        success: 'bg-success-500/[0.02] border-success-500/20 text-success-600 hover:bg-success-500/[0.05]',
        warning: 'bg-warning-500/[0.02] border-warning-500/20 text-warning-600 hover:bg-warning-500/[0.05]',
        info: 'bg-info-500/[0.02] border-info-500/20 text-info-600 hover:bg-info-500/[0.05]'
    };

    const isTrendUp = trend !== undefined && trend > 0;
    const isTrendDown = trend !== undefined && trend < 0;

    return (
        <Card
            variant="glass"
            className={clsx(
                "relative overflow-hidden group transition-all duration-300 rounded-3xl border-2 p-1",
                variantStyles[variant]
            )}
        >
            <CardContent className="p-5 md:p-6 space-y-4 relative z-10">
                <div className="flex justify-between items-start">
                    <div className={clsx(
                        "p-3 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                        variant === 'primary' ? 'bg-primary/10' : 'bg-surface-variant'
                    )}>
                        <Icon size={24} className={clsx(variant === 'primary' ? 'text-primary' : '')} />
                    </div>
                    {trend !== undefined && trend !== 0 && (
                        <div className={clsx(
                            "flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full",
                            isTrendUp ? "bg-success-500/10 text-success-700" : "bg-warning-500/10 text-warning-700"
                        )}>
                            {isTrendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-1">{title}</h3>
                    {isLoading ? (
                        <div className="h-10 w-24 bg-secondary/5 animate-pulse rounded-lg mt-2" />
                    ) : (
                        <h2 className="text-3xl font-black tracking-tighter text-foreground font-mono">{value}</h2>
                    )}
                    {subValue && !isLoading && (
                        <p className="text-[11px] text-secondary/50 mt-1.5 font-bold">{subValue}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
