import React from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from '@/i18n/routing';

interface StepNavBottomProps {
    visibleSteps: Array<{ id: number; title: string }>;
    activeStep: number;
    setActiveStep: (step: number) => void;
    viewMode: 'admin' | 'client' | 'public';
    lastStepId: number;
}

export function StepNavBottom({
    visibleSteps,
    activeStep,
    setActiveStep,
    viewMode,
    lastStepId
}: StepNavBottomProps) {
    const router = useRouter();

    return (
        <div className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-white/90 backdrop-blur-3xl rounded-full border border-black/[0.03] shadow-sm z-50 w-[calc(100%-2rem)] md:w-auto max-w-lg justify-between md:justify-center">
            {activeStep > 1 && (
                <Button
                    variant="ghost"
                    size="lg"
                    className="rounded-full h-11 md:h-14 px-3 md:px-8 font-black hover:bg-black/[0.02] disabled:opacity-0 transition-opacity text-xs md:text-base flex-1 md:flex-initial"
                    onClick={() => {
                        const currentIdx = visibleSteps.findIndex(s => s.id === activeStep);
                        const prevStep = visibleSteps[currentIdx - 1];
                        if (prevStep) setActiveStep(prevStep.id);
                    }}
                    icon={<ChevronRight size={18} />}
                >
                    السابق
                </Button>
            )}

            <div className="flex gap-1.5 px-2">
                {visibleSteps.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveStep(s.id)}
                        className={cn(
                            "rounded-full transition-all duration-500",
                            activeStep === s.id
                                ? "bg-primary w-8 h-2.5"
                                : "bg-black/[0.06] hover:bg-black/[0.12] w-2.5 h-2.5"
                        )}
                    />
                ))}
            </div>

            <Button
                size="lg"
                className={cn(
                    "rounded-full h-11 md:h-14 px-4 md:px-10 font-black shadow-sm text-xs md:text-base flex-1 md:flex-initial",
                    activeStep === 1 && "flex-1 md:w-full max-w-none"
                )}
                onClick={() => {
                    const currentIdx = visibleSteps.findIndex(s => s.id === activeStep);
                    const nextStep = visibleSteps[currentIdx + 1];
                    if (nextStep) setActiveStep(nextStep.id);
                    else {
                        if (viewMode === 'admin') router.push(`/dashboard/admin/reports`);
                        else if (viewMode === 'client') router.push(`/dashboard/client`);
                        else router.push(`/`);
                    }
                }}
            >
                {activeStep === lastStepId ? 'إغلاق' : 'التالي'}
                {activeStep < lastStepId && <ChevronLeft size={16} className="mr-1 md:mr-2" />}
            </Button>
        </div>
    );
}
export default StepNavBottom;
