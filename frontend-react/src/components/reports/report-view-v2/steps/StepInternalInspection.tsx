import React from 'react';
import { motion } from 'framer-motion';
import DataInspectionSection from '../sections/DataInspectionSection';
import InternalInspectionSection from '../sections/InternalInspectionSection';

interface StepInternalInspectionProps {
    report: any;
    agentData: any;
    hw: any;
    onImageClick: (url: string) => void;
}

export function StepInternalInspection({
    report,
    agentData,
    hw,
    onImageClick
}: StepInternalInspectionProps) {
    let stressResults: any[] = [];
    try {
        stressResults = typeof report.stress_results === 'string'
            ? JSON.parse(report.stress_results)
            : (report.stress_results || []);
    } catch (e) {
        console.error(e);
    }

    let interactiveMap: Record<string, any> = {};
    try {
        interactiveMap = typeof report.interactive_tests === 'string'
            ? JSON.parse(report.interactive_tests)
            : (report.interactive_tests || {});
    } catch (e) {
        console.error(e);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
        >
            {stressResults.length > 0 ? (
                <div className="space-y-6">
                    <h3 className="text-lg font-black text-secondary pr-3 border-r-4 border-primary text-right" style={{ borderRightWidth: '4px' }}>
                        الفحص البرمجي ونتائج اختبارات الأداء
                    </h3>
                    <DataInspectionSection
                        stressResults={stressResults}
                        hw={hw}
                        interactiveMap={interactiveMap}
                    />
                </div>
            ) : (
                <InternalInspectionSection
                    report={report}
                    agentData={agentData}
                    onImageClick={onImageClick}
                />
            )}
        </motion.div>
    );
}
export default StepInternalInspection;
