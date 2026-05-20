import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getComponentIcon, getComponentTitle, getComponentNameArabic } from '../utils';

interface StepTechnicalTestProps {
    report: any;
}

export function StepTechnicalTest({ report }: StepTechnicalTestProps) {
    let hardwareStatus: any[] = [];
    try {
        hardwareStatus = typeof report.hardware_status === 'string'
            ? JSON.parse(report.hardware_status)
            : (report.hardware_status || []);
    } catch (e) {
        console.error(e);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-right"
            dir="rtl"
        >
            <div className="hidden md:block rounded-3xl bg-white border border-black/[0.03] overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="border-b border-black/[0.02] bg-black/[0.01]">
                            <th className="py-4 px-6 text-xs font-black text-secondary/30 uppercase tracking-wider">المكون</th>
                            <th className="py-4 px-6 text-xs font-black text-secondary/30 uppercase tracking-wider">الحالة الفنية</th>
                            <th className="py-4 px-6 text-xs font-black text-secondary/30 uppercase tracking-wider">التقييم العام</th>
                            <th className="py-4 px-6 text-xs font-black text-secondary/30 uppercase tracking-wider">التعليق والملحوظات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.01]">
                        {hardwareStatus.map((item: any, idx: number) => {
                            const isCommentObj = item.comment && (item.comment.startsWith('{') || item.comment.startsWith('['));
                            let displayComment = item.comment;
                            if (isCommentObj) {
                                try {
                                    const parsed = JSON.parse(item.comment);
                                    displayComment = parsed.note || parsed.comment || 'تم الفحص بنجاح';
                                } catch (e) { }
                            }

                            return (
                                <tr key={idx} className="hover:bg-black/[0.005] transition-colors">
                                    <td className="py-4 px-6 font-bold text-secondary flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
                                            {getComponentIcon(item.componentName)}
                                        </div>
                                        {getComponentTitle(item.componentName)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            {item.status === 'pass' && <><CheckCircle2 className="text-primary" size={16} /><span className="text-xs font-bold text-primary">سليم تماماً</span></>}
                                            {item.status === 'fail' && <><XCircle className="text-rose-500" size={16} /><span className="text-xs font-bold text-rose-500">يحتاج صيانة</span></>}
                                            {item.status === 'warning' && <><AlertCircle className="text-amber-500" size={16} /><span className="text-xs font-bold text-amber-500">ملاحظات طفيفة</span></>}
                                            {!['pass', 'fail', 'warning'].includes(item.status) && <><Circle className="text-secondary/20" size={16} /><span className="text-xs font-bold text-secondary/40">لم يحدد</span></>}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <Badge
                                            variant="outline"
                                            circular
                                            className={cn(
                                                "text-[10px] font-black h-6 px-3",
                                                item.grade === 'A' ? "bg-primary/5 text-primary border-primary/10" :
                                                    item.grade === 'B' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        "bg-rose-50 text-rose-600 border-rose-100"
                                            )}
                                        >
                                            GRADE {item.grade || 'A'}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-6 text-xs font-bold text-secondary/50 max-w-xs truncate">
                                        {displayComment || 'لا توجد تعليقات إضافية'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden space-y-4">
                {hardwareStatus.map((item: any, idx: number) => {
                    const isCommentObj = item.comment && (item.comment.startsWith('{') || item.comment.startsWith('['));
                    let displayComment = item.comment;
                    if (isCommentObj) {
                        try {
                            const parsed = JSON.parse(item.comment);
                            displayComment = parsed.note || parsed.comment || 'تم الفحص بنجاح';
                        } catch (e) { }
                    }

                    return (
                        <div key={idx} className="bg-white border border-black/[0.03] rounded-2xl p-4 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
                                        {getComponentIcon(item.componentName)}
                                    </div>
                                    <span className="font-bold text-secondary text-sm">{getComponentTitle(item.componentName)}</span>
                                </div>
                                <Badge
                                    variant="outline"
                                    circular
                                    className={cn(
                                        "text-[9px] font-black h-5 px-2",
                                        item.grade === 'A' ? "bg-primary/5 text-primary border-primary/10" :
                                            item.grade === 'B' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                    )}
                                >
                                    GRADE {item.grade || 'A'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between border-t border-black/[0.01] pt-2.5">
                                <div className="flex items-center gap-1.5">
                                    {item.status === 'pass' && <><CheckCircle2 className="text-primary" size={14} /><span className="text-[11px] font-bold text-primary">سليم تماماً</span></>}
                                    {item.status === 'fail' && <><XCircle className="text-rose-500" size={14} /><span className="text-[11px] font-bold text-rose-500">يحتاج صيانة</span></>}
                                    {item.status === 'warning' && <><AlertCircle className="text-amber-500" size={14} /><span className="text-[11px] font-bold text-amber-500">ملاحظات طفيفة</span></>}
                                    {!['pass', 'fail', 'warning'].includes(item.status) && <><Circle className="text-secondary/20" size={14} /><span className="text-[11px] font-bold text-secondary/40">لم يحدد</span></>}
                                </div>
                                <span className="text-[10px] font-bold text-secondary/40 max-w-[150px] truncate">{displayComment || 'بدون تعليق'}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
export default StepTechnicalTest;
