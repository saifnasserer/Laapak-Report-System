import React from 'react';
import { cn } from '@/lib/utils';

interface TechStatCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    color?: string;
}

export function TechStatCard({ label, value, icon, color }: TechStatCardProps) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-secondary/30 uppercase mb-0.5">{label}</p>
                <p className={cn("text-xs font-black truncate", color || "text-secondary")}>{value}</p>
            </div>
        </div>
    );
}
export default TechStatCard;
