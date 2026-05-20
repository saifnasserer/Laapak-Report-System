import React from 'react';
import { motion } from 'framer-motion';
import ExternalExaminationSection from '../sections/ExternalExaminationSection';

interface StepExternalExamProps {
    report: any;
    onImageClick: (url: string) => void;
}

export function StepExternalExam({ report, onImageClick }: StepExternalExamProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
        >
            <ExternalExaminationSection report={report} onImageClick={onImageClick} />
        </motion.div>
    );
}
export default StepExternalExam;
