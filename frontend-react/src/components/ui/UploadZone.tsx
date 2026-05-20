'use client';

import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '@/lib/utils';
import { Plus, Link2, Loader2, Trash2, Image as ImageIcon, Upload, Camera } from 'lucide-react';

export interface UploadItem {
    url: string;
    type?: string;
    component?: string;
    comment?: string;
}

interface UploadZoneProps {
    icon?: React.ReactNode;
    accept?: string;
    multiple?: boolean;
    items: UploadItem[];
    uploading: boolean;
    dragActive: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUrlSubmit: (url: string) => void;
    onRemove: (item: UploadItem) => void;
    urlInput: string;
    setUrlInput: (val: string) => void;
    fileInputId: string;
    placeholder?: string;
    renderItem?: (item: UploadItem) => React.ReactNode;
    compact?: boolean;
    header?: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        hasItems?: boolean;
    };
    extra?: React.ReactNode;
}

export function UploadZone({
    icon,
    accept = 'image/*',
    multiple = true,
    items,
    uploading,
    dragActive,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    onUrlSubmit,
    onRemove,
    urlInput,
    setUrlInput,
    fileInputId,
    placeholder = 'أضف رابطاً هنا...',
    renderItem,
    compact = false,
    header,
    extra,
}: UploadZoneProps) {
    const content = (
        <>
            <div
                className={cn(
                    "border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden relative",
                    compact ? "p-6" : "p-10",
                    dragActive
                        ? "border-primary bg-primary/[0.05] ring-4 ring-primary/10 ring-inset"
                        : "border-black/5 bg-black/[0.01] hover:bg-black/[0.02] hover:border-black/10"
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById(fileInputId)?.click()}
            >
                <input
                    id={fileInputId}
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={onFileSelect}
                />
                {uploading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs font-black text-primary animate-pulse">جاري الرفع...</p>
                    </div>
                )}
                <div className={cn(
                    "rounded-full flex items-center justify-center transition-all mx-auto",
                    compact ? "w-12 h-12" : "w-16 h-16",
                    dragActive ? "bg-primary text-white scale-110" : "bg-primary/10 text-primary"
                )}>
                    {icon || <ImageIcon size={compact ? 22 : 32} />}
                </div>
                <div className="text-center mt-3">
                    <p className={cn("font-black text-secondary", compact ? "text-sm" : "text-lg")}>اسحب الملفات هنا</p>
                    <p className={cn("text-secondary/40 font-bold mt-1", compact ? "text-xs" : "text-sm")}>أو اضغط لاختيارها من جهازك</p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-black/[0.01] p-1 pr-5 rounded-full border border-black/5">
                <Link2 size={14} className="text-secondary/30 shrink-0" />
                <Input
                    placeholder={placeholder}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onUrlSubmit(urlInput);
                        }
                    }}
                    className="rounded-full border-transparent bg-transparent h-11 text-xs flex-1 focus:ring-0 font-medium"
                />
                <Button type="button" onClick={() => onUrlSubmit(urlInput)} className="rounded-full h-10 px-6 shadow-md shadow-primary/10 text-xs font-bold" icon={<Plus size={16} />}>إضافة</Button>
            </div>

            {items.length > 0 && (
                <div className={cn(
                    "grid gap-4",
                    compact ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                )}>
                    {items.map((item, i) => (
                        renderItem ? (
                            <div key={i}>{renderItem(item)}</div>
                        ) : (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group/img border border-black/5 bg-black/5 animate-in zoom-in duration-300">
                                <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => onRemove(item)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}

            {extra}
        </>
    );

    if (header) {
        return (
            <div className="bg-white border border-black/5 rounded-2xl overflow-hidden hover:shadow-sm transition-all">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            header.hasItems ? "bg-emerald-50 text-emerald-500" : "bg-black/[0.04] text-secondary/40"
                        )}>
                            {header.icon}
                        </div>
                        <div>
                            <h5 className="font-bold text-sm">{header.title}</h5>
                            {header.subtitle && <span className="text-[10px] text-secondary/40">{header.subtitle}</span>}
                            {header.hasItems && !header.subtitle && <span className="text-[10px] text-emerald-600 font-medium">تم إرفاق النتيجة</span>}
                        </div>
                    </div>
                    <input
                        id={fileInputId}
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={onFileSelect}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(fileInputId)?.click()}
                        className="rounded-full h-9 text-[10px] px-4 border-black/10"
                        icon={<Upload size={14} />}
                    >
                        رفع
                    </Button>
                </div>
                <div className="border-t border-black/[0.03] p-4 space-y-3">
                    {content}
                </div>
            </div>
        );
    }

    return <div className="space-y-4">{content}</div>;
}
