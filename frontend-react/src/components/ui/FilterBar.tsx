'use client';

import React from 'react';
import { Search, Plus, Calendar, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    status?: string;
    onStatusChange?: (value: string) => void;
    statusOptions?: FilterOption[];
    startDate?: string;
    onStartDateChange?: (value: string) => void;
    endDate?: string;
    onEndDateChange?: (value: string) => void;
    onClear: () => void;
    className?: string;
    showStatus?: boolean;
    showDate?: boolean;
    children?: React.ReactNode;
}

export function FilterBar({
    search,
    onSearchChange,
    placeholder = "بحث...",
    status = 'all',
    onStatusChange,
    statusOptions = [],
    startDate = '',
    onStartDateChange,
    endDate = '',
    onEndDateChange,
    onClear,
    className,
    showStatus = true,
    showDate = true,
    children
}: FilterBarProps) {
    return (
        <div className={cn(
            "laapak-glass p-1.5 rounded-[2rem] flex flex-wrap items-center gap-3",
            className
        )}>
            {children}
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/40" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pr-11 pl-11 h-11 rounded-full border border-black/5 bg-white/40 focus:bg-white transition-all font-bold text-sm outline-none"
                />
                {search && (
                    <button 
                        onClick={() => onSearchChange('')}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-destructive transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            
            {/* Status Tabs */}
            {showStatus && onStatusChange && statusOptions && statusOptions.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar no-scrollbar pb-1 sm:pb-0">
                    <span className="text-[10px] font-black text-secondary/40 uppercase mr-1 flex items-center gap-1 shrink-0">
                        <Filter size={10} /> الحالة:
                    </span>
                    <div className="flex bg-black/5 p-1 rounded-full gap-1 shrink-0 max-w-full overflow-x-auto custom-scrollbar no-scrollbar scroll-smooth">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onStatusChange(option.value)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap",
                                    status === option.value 
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-secondary/40 hover:text-secondary"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Date Range Selection */}
            {showDate && onStartDateChange && onEndDateChange && (
                <div className="flex items-center bg-black/5 p-1 rounded-full gap-1 shrink-0 border border-black/5 transition-all hover:bg-black/[0.07]">
                    <div className="flex items-center px-3 gap-2">
                        <Calendar size={14} className="text-primary" />
                        <span className="text-[10px] font-black text-secondary/60 uppercase">الفترة</span>
                    </div>
                    <div className="flex items-center bg-white rounded-full shadow-sm border border-black/5">
                        <div className="relative group flex items-center">
                            <span className="absolute right-3 text-[10px] font-black text-secondary/40 pointer-events-none z-10">من</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => onStartDateChange(e.target.value)}
                                className="h-9 pr-8 pl-3 text-center rounded-r-full border-none bg-transparent text-[11px] font-bold text-secondary outline-none hover:bg-primary/5 focus:bg-primary/10 transition-all w-[110px] sm:w-[130px] font-mono cursor-pointer relative [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-clear-button]:hidden"
                            />
                        </div>
                        <div className="w-px h-5 bg-black/10"></div>
                        <div className="relative group flex items-center">
                            <span className="absolute right-3 text-[10px] font-black text-secondary/40 pointer-events-none z-10">إلى</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => onEndDateChange(e.target.value)}
                                className="h-9 pr-8 pl-3 text-center rounded-l-full border-none bg-transparent text-[11px] font-bold text-secondary outline-none hover:bg-primary/5 focus:bg-primary/10 transition-all w-[110px] sm:w-[130px] font-mono cursor-pointer relative [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-clear-button]:hidden"
                            />
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}
