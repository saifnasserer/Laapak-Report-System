import React from 'react';

interface SpecCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
}

export function SpecCard({ label, value, icon }: SpecCardProps) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-secondary/30 uppercase">{label}</p>
                <p className="text-sm font-bold text-secondary mt-1">{value}</p>
            </div>
        </div>
    );
}
export default SpecCard;
