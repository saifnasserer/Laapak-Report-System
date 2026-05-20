import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StepNavSidebarProps {
    visibleSteps: Array<{ id: number; title: string }>;
    activeStep: number;
    setActiveStep: (step: number) => void;
}

export function StepNavSidebar({ visibleSteps, activeStep, setActiveStep }: StepNavSidebarProps) {
    return (
        <aside className="hidden lg:block lg:w-64 sticky top-24 space-y-12">
            <div className="space-y-6">
                <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.5em] pr-4">إجراءات الفحص</p>
                <nav className="space-y-1">
                    {visibleSteps.map((step) => {
                        const isActive = activeStep === step.id;
                        return (
                            <button
                                key={step.id}
                                onClick={() => setActiveStep(step.id)}
                                className={cn(
                                    "w-full flex items-center gap-5 py-4 px-4 rounded-3xl transition-all duration-500 group relative",
                                    isActive ? "bg-white shadow-sm border border-black/[0.03]" : "hover:bg-black/[0.01]"
                                )}
                            >
                                <span className={cn(
                                    "text-lg font-black transition-colors duration-500",
                                    isActive ? "text-primary" : "text-secondary/20 group-hover:text-secondary/40"
                                )}>
                                    {step.id.toString().padStart(2, '0')}
                                </span>
                                <span className={cn(
                                    "text-sm font-bold transition-all duration-500 text-right flex-1",
                                    isActive ? "text-secondary" : "text-secondary/40 group-hover:text-secondary/60"
                                )}>
                                    {step.title}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-indicator-v2"
                                        className="absolute left-4 w-1.5 h-6 bg-primary rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
export default StepNavSidebar;
