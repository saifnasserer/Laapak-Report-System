'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// Dialog Context to share open state and close handler
interface DialogContextType {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) => {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
};

export const DialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error('DialogContent must be used within Dialog');

    const { open, onOpenChange } = context;
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onOpenChange(false);
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [open, onOpenChange]);

    if (!open) return null;

    const content = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={cn(
                    "bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-0">
                    {children}
                </div>
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 p-2 hover:bg-black/5 rounded-full transition-colors opacity-70 hover:opacity-100"
                >
                    <X size={18} />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    );

    return typeof document !== 'undefined'
        ? createPortal(content, document.body)
        : null;
};

export const DialogHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-right p-6 pb-2", className)}>
        {children}
    </div>
);

export const DialogFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse p-6 pt-2 font-bold", className)}>
        {children}
    </div>
);

export const DialogTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
        {children}
    </h3>
);

// Exports to match Shadcn import pattern
export {
    // Dialog, // exported above
    // DialogContent, // exported above
    // DialogHeader,
    // DialogFooter,
    // DialogTitle
};
