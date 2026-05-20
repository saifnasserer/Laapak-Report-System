import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw } from 'lucide-react';

interface ReportHistorySectionProps {
    history: any[];
}

export function ReportHistorySection({ history }: ReportHistorySectionProps) {
    if (!history || history.length === 0) return null;

    const sortedHistory = [...history].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm" dir="rtl">
            <h3 className="text-lg font-black text-secondary flex items-center gap-3 mb-6">
                <RefreshCw size={18} className="text-primary/50" />
                تاريخ التحديثات
            </h3>
            <div className="space-y-6">
                {sortedHistory.map((entry, i) => (
                    <div key={i} className="relative flex gap-6 pb-6 last:pb-0 group">
                        {i !== sortedHistory.length - 1 && (
                            <div className="absolute top-9 bottom-0 right-4 w-px bg-black/[0.03] group-hover:bg-primary/10 transition-colors" />
                        )}
                        <div className="w-8 h-8 shrink-0 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-primary z-10 shadow-sm">
                            <RefreshCw size={14} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">
                                    {new Date(entry.timestamp).toLocaleString('ar-EG', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {entry.status_at_update && (
                                    <Badge variant="outline" circular className="text-[9px] font-black opacity-60 bg-black/[0.02] border-none px-2 h-5 w-fit">
                                        الحالة: {entry.status_at_update}
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm font-bold text-secondary/80 leading-relaxed bg-black/[0.02] p-4 rounded-2xl border border-transparent group-hover:border-primary/10 group-hover:bg-white group-hover:shadow-sm transition-all">
                                {entry.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default ReportHistorySection;
