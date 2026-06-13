'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Modals from parent directory or other folders
import { WhatsAppShareModal } from '@/components/reports/WhatsAppShareModal';
import { TrackingCodeModal } from '@/components/reports/TrackingCodeModal';
import { PaymentMethodModal } from '@/components/invoices/PaymentMethodModal';

// Local types, constants, utils
import { ReportViewProps } from './types';
import { steps } from './constants';

// Local hooks
import { useReportData } from './hooks/useReportData';
import { useProducts } from './hooks/useProducts';
import { useReportActions } from './hooks/useReportActions';

// Local layouts
import StepNavSidebar from './layout/StepNavSidebar';
import StepNavMobile from './layout/StepNavMobile';
import StepNavBottom from './layout/StepNavBottom';

// Local modals
import PaymentSelectionModal from './modals/PaymentSelectionModal';
import WarehouseModal from './modals/WarehouseModal';
import ImageLightbox from './modals/ImageLightbox';

// Local steps
import StepDataAndSpecs from './steps/StepDataAndSpecs';
import StepExternalExam from './steps/StepExternalExam';
import StepTechnicalTest from './steps/StepTechnicalTest';
import StepInternalInspection from './steps/StepInternalInspection';
import StepAccessories from './steps/StepAccessories';
import StepConfirmShare from './steps/StepConfirmShare';

export default function ReportViewV2({ id, locale, viewMode, initialReport }: ReportViewProps) {
    const t = useTranslations();
    const router = useRouter();
    const { width, height } = useWindowSize();

    // 1. Data and general states hook
    const {
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
    } = useReportData(id, initialReport);

    // 2. Medusa products hook
    const { products, isLoadingProducts } = useProducts(activeStep);

    // 3. Report actions hook
    const {
        cartItems,
        toggleCartItem,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        calculateFinalTotal,
        handleConfirmOrder,
        handleFinalConfirmation,
        handlePrint,
        updateStatus,
        warehouseModalOpen,
        setWarehouseModalOpen,
        sourceDetails,
        setSourceDetails,
        warehouseSubmitting,
        showPaymentModal,
        setShowPaymentModal,
        pendingStatus,
        setPendingStatus,
        isCreatingInvoice,
        showTrackingModal,
        setShowTrackingModal,
        paymentModalOpen,
        setPaymentModalOpen,
        shareModalOpen,
        setShareModalOpen,
        isCopied,
        setIsCopied,
        handleAssignToWarehouse
    } = useReportActions(id, report, setReport, isConfirmed, setIsConfirmed, setActiveStep);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <div className="text-secondary/40 text-sm font-bold">جاري التحميل...</div>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-destructive/5 flex items-center justify-center mx-auto">
                    <AlertCircle className="text-destructive" size={32} />
                </div>
                <div className="text-destructive text-xl font-black">{error || 'التقرير غير موجود'}</div>
                <Button onClick={() => router.back()} variant="outline" className="rounded-full">العودة للخلف</Button>
            </div>
        );
    }

    // Normalizing specs for UI (as in original ReportViewV2)
    let specs: any = report.full_specs || report.agent_json;
    while (typeof specs === 'string' && specs.trim() !== '') {
        try {
            specs = JSON.parse(specs);
        } catch {
            break;
        }
    }
    const isNewFormat = specs && !specs.device && (specs.cpu || specs.ram || specs.storage);
    const hw = (() => {
        if (!specs) return null;
        if (!isNewFormat) return specs.device || null;
        const s = specs;
        const battDev = s.battery?.devices?.[0] ?? null;
        const disp = s.display?.active_displays?.[0] ?? null;
        const storDev: any[] = s.storage?.devices ?? [];
        const gpuDevs: any[] = s.gpu?.devices ?? [];
        return {
            summary: { model: s.system?.model || s.system?.motherboard_product || '', manufacturer: s.system?.manufacturer || '' },
            cpu: s.cpu ? { name: s.cpu.name, cores: s.cpu.physical_cores, threads: s.cpu.logical_cores, base_speed_ghz: s.cpu.base_speed_ghz } : null,
            memory: s.ram ? { total_ram: `${s.ram.total} GB`, total: `${s.ram.total} GB`, type: s.ram.type, speed: s.ram.speed_mhz ? `${s.ram.speed_mhz} MHz` : null } : null,
            storage: storDev.map((d: any) => ({ type: d.type || 'SSD', model: d.model || '', capacity: `${Math.round(d.size_gb || 0)} GB`, size: `${Math.round(d.size_gb || 0)} GB`, health_percent: d.health_pct ?? 100, health_status: d.status || 'OK', firmware: d.firmware || '' })),
            gpu: gpuDevs.map((g: any) => ({ name: g.name, vram: g.vram_mb ? `${g.vram_mb} MB` : null, driver_version: g.driver_version || '' })),
            battery: battDev ? (() => {
                const hp = battDev.health_percentage;
                const cleanHp = typeof hp === 'string' ? hp.replace('%', '').trim() : hp;
                const num = Number(cleanHp);
                const isNumeric = hp !== null && hp !== undefined && !isNaN(num);
                const healthStr = isNumeric ? `${num.toFixed(1)}%` : String(hp || 'Unknown');
                let percentage = 100;
                if (isNumeric) {
                    percentage = num;
                } else if (typeof hp === 'string') {
                    const str = hp.trim().toLowerCase();
                    if (str === 'excellent') percentage = 100;
                    else if (str === 'good') percentage = 85;
                    else if (str === 'fair' || str === 'normal') percentage = 75;
                    else if (str === 'poor') percentage = 50;
                }
                return {
                    health: healthStr,
                    health_percentage: percentage,
                    cycle_count: battDev.cycle_count ?? 0,
                    estimated_charge: battDev.estimated_charge ?? 0
                };
            })() : null,
            display: disp ? { resolution: `${disp.resolution?.width ?? 0}x${disp.resolution?.height ?? 0}`, refresh_rate_hz: disp.refresh_rate ?? 0, size_inch: disp.size_inch ?? 0, touch: disp.touch ?? false } : null,
            network: { wifi_signal: s.network?.wifi_signal_pct || '', bluetooth: s.bluetooth?.available ?? false },
        };
    })();

    const bsodCount: number = isNewFormat ? (specs?.stability?.bsod_count ?? 0) : 0;
    const hasRecentCrash: boolean = isNewFormat ? (specs?.stability?.has_recent_crashes ?? false) : false;
    
    // Robust diagnosis scoring and processing
    let diagnosis: any = specs?.diagnosis || null;
    if (!diagnosis && report.grade) {
        diagnosis = { grade: report.grade, status: report.status, score: undefined };
    }

    let diagScore: number = 0;
    if (diagnosis) {
        if (typeof diagnosis.score === 'number' && !isNaN(diagnosis.score) && diagnosis.score > 0) {
            diagScore = diagnosis.score;
        } else if (typeof diagnosis.score === 'string' && !isNaN(parseInt(diagnosis.score, 10)) && parseInt(diagnosis.score, 10) > 0) {
            diagScore = parseInt(diagnosis.score, 10);
        } else if (diagnosis.breakdown && Object.keys(diagnosis.breakdown).length > 0) {
            // Calculate average from breakdown values
            const values = Object.values(diagnosis.breakdown);
            let sum = 0;
            let count = 0;
            
            const gradeToScoreMap: Record<string, number> = {
                'A+': 98, 'A': 95, 'A-': 90,
                'B+': 88, 'B': 85, 'B-': 80,
                'C+': 78, 'C': 75, 'C-': 70,
                'D+': 68, 'D': 65, 'D-': 60,
                'F': 40
            };

            values.forEach((val: any) => {
                let num = 0;
                if (typeof val === 'number') {
                    num = val;
                } else if (typeof val === 'string') {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) {
                        num = parsed;
                    } else {
                        const cleanVal = val.trim().toUpperCase();
                        num = gradeToScoreMap[cleanVal] || (cleanVal.startsWith('A') ? 95 : cleanVal.startsWith('B') ? 85 : cleanVal.startsWith('C') ? 75 : cleanVal.startsWith('D') ? 65 : 40);
                    }
                }
                sum += num;
                count++;
            });
            if (count > 0) {
                diagScore = Math.round(sum / count);
            }
        }
        
        // Fallback to converting grade to score if still 0
        if (diagScore === 0 && (diagnosis.grade || report.grade)) {
            const cleanGrade = String(diagnosis.grade || report.grade).trim().toUpperCase();
            if (cleanGrade.startsWith('A')) diagScore = 95;
            else if (cleanGrade.startsWith('B')) diagScore = 85;
            else if (cleanGrade.startsWith('C')) diagScore = 75;
            else if (cleanGrade.startsWith('D')) diagScore = 65;
            else if (cleanGrade.startsWith('F')) diagScore = 40;
        }
    }

    const diagBreakdown = (() => {
        const bd = diagnosis?.breakdown && typeof diagnosis.breakdown === 'object' ? diagnosis.breakdown : {};
        return Object.entries(bd).map(([key, val]: [string, any]) => {
            const lowerKey = key.toLowerCase();
            const arabicName = 
                lowerKey === 'cpu' ? 'المعالج' :
                lowerKey === 'gpu' ? 'كارت الشاشة' :
                lowerKey === 'ram' || lowerKey === 'memory' ? 'الرامات' :
                lowerKey === 'storage' ? 'الهاردوير/التخزين' :
                lowerKey === 'battery' ? 'البطارية' :
                lowerKey === 'display' || lowerKey === 'screen' ? 'الشاشة' :
                lowerKey === 'system' ? 'النظام' :
                lowerKey === 'thermal' ? 'الحرارة' :
                lowerKey === 'ports' ? 'المنافذ' :
                lowerKey === 'audio' ? 'الصوت' :
                lowerKey === 'camera' ? 'الكاميرا' :
                lowerKey === 'input' ? 'وسائل الإدخال' : key;
            return {
                name: arabicName,
                grade: val
            };
        });
    })();

    const isReportCompleted = report.status === 'completed' || report.status === 'مكتمل';
    // Filter steps to hide active cart page (Step 5) and checkout (Step 7) when report status is completed
    const visibleSteps = steps.filter(s => !isReportCompleted || (s.id !== 5 && s.id !== 7));
    const lastStepId = visibleSteps[visibleSteps.length - 1]?.id ?? 7;

    const renderStepContent = () => {
        switch (activeStep) {
            case 1:
                return (
                    <StepDataAndSpecs
                        report={report}
                        agentData={agentData}
                        hw={hw}
                        bsodCount={bsodCount}
                        hasRecentCrash={hasRecentCrash}
                        diagScore={diagScore}
                        diagBreakdown={diagBreakdown}
                        showConfetti={showConfetti}
                        setShowConfetti={setShowConfetti}
                        viewMode={viewMode}
                        isCopied={isCopied}
                        setIsCopied={setIsCopied}
                    />
                );
            case 2:
                return (
                    <StepExternalExam
                        report={report}
                        onImageClick={setSelectedImage}
                    />
                );
            case 3:
                return (
                    <StepTechnicalTest
                        report={report}
                    />
                );
            case 4:
                return (
                    <StepInternalInspection
                        report={report}
                        agentData={agentData}
                        hw={hw}
                        onImageClick={setSelectedImage}
                    />
                );
            case 5:
                return (
                    <StepAccessories
                        products={products}
                        isLoadingProducts={isLoadingProducts}
                        cartItems={cartItems}
                        toggleCartItem={toggleCartItem}
                        calculateFinalTotal={calculateFinalTotal}
                        handleConfirmOrder={handleConfirmOrder}
                        isConfirmed={isConfirmed}
                    />
                );
            case 7:
                return (
                    <StepConfirmShare
                        report={report}
                        cartItems={cartItems}
                        calculateFinalTotal={calculateFinalTotal}
                        viewMode={viewMode}
                        isConfirmed={isConfirmed}
                        handleConfirmOrder={handleConfirmOrder}
                        handlePrint={handlePrint}
                        setWarehouseModalOpen={setWarehouseModalOpen}
                        setShareModalOpen={setShareModalOpen}
                        updateStatus={updateStatus}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFD] pb-36 pt-6 px-4 md:px-8 relative selection:bg-primary selection:text-white" dir="rtl">
            {showConfetti && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={250}
                    gravity={0.15}
                />
            )}

            <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                <StepNavSidebar
                    visibleSteps={visibleSteps}
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                />

                <div className="flex-1 w-full space-y-6">
                    <StepNavMobile
                        steps={steps}
                        visibleSteps={visibleSteps}
                        activeStep={activeStep}
                        setActiveStep={setActiveStep}
                    />

                    <div className="min-h-[400px]">
                        {renderStepContent()}
                    </div>
                </div>
            </div>

            <StepNavBottom
                visibleSteps={visibleSteps}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                viewMode={viewMode}
                lastStepId={lastStepId}
            />

            {/* Lightbox / Modals */}
            <ImageLightbox
                selectedImage={selectedImage}
                onClose={() => setSelectedImage(null)}
            />

            <PaymentSelectionModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                calculateFinalTotal={calculateFinalTotal}
                handleFinalConfirmation={handleFinalConfirmation}
            />

            <WarehouseModal
                isOpen={warehouseModalOpen}
                onClose={() => setWarehouseModalOpen(false)}
                sourceDetails={sourceDetails}
                setSourceDetails={setSourceDetails}
                handleAssignToWarehouse={handleAssignToWarehouse}
                warehouseSubmitting={warehouseSubmitting}
            />

            <WhatsAppShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                report={report}
                locale={locale}
            />

            <TrackingCodeModal
                isOpen={showTrackingModal}
                onClose={() => {
                    setShowTrackingModal(false);
                    setPendingStatus(null);
                }}
                onConfirm={(data: { trackingMethod: string, trackingCode: string }) => {
                    if (pendingStatus) {
                        updateStatus(pendingStatus, data);
                    }
                }}
                report={report}
            />

            <PaymentMethodModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPendingStatus(null);
                }}
                onConfirm={async (method: string) => {
                    if (pendingStatus) {
                        await updateStatus(pendingStatus, undefined, method);
                    }
                }}
            />
        </div>
    );
}
