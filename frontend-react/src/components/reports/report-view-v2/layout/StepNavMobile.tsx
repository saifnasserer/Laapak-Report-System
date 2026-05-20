import React from 'react';
import { cn } from '@/lib/utils';

interface StepNavMobileProps {
    steps: Array<{ id: number; title: string }>;
    visibleSteps: Array<{ id: number; title: string }>;
    activeStep: number;
    setActiveStep: (step: number) => void;
}

export function StepNavMobile({ steps, visibleSteps, activeStep, setActiveStep }: StepNavMobileProps) {
    return (
        <div className="w-full lg:hidden mb-5">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-secondary">
                    {steps.find(s => s.id === activeStep)?.title}
                </span>
                <span className="text-xs font-black text-secondary/30 tabular-nums">
                    {visibleSteps.findIndex(s => s.id === activeStep) + 1} / {visibleSteps.length}
                </span>
            </div>
            <div className="flex gap-2">
                {visibleSteps.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveStep(s.id)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-500 flex-1",
                            activeStep === s.id
                                ? "bg-primary"
                                : "bg-black/[0.06]"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
export default StepNavMobile;
