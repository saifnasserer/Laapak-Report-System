'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface TextFieldProps {
    label: string;
    name?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: React.ReactNode;
    placeholder?: string;
    error?: string;
    required?: boolean;
    type?: string;
    wrapperClassName?: string;
    inputClassName?: string;
    disabled?: boolean;
    readOnly?: boolean;
    autoComplete?: string;
    prefix?: string;
    badge?: React.ReactNode;
    children?: React.ReactNode;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
    ({ label, error, required, icon, children, badge, wrapperClassName, inputClassName, ...props }, ref) => {
        return (
            <div className={cn("space-y-2", wrapperClassName)}>
                {label && (
                    <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter flex items-center gap-1.5">
                        {label}
                        {required && <span className="text-destructive">*</span>}
                    </label>
                )}
                <div className="relative">
                    <Input
                        ref={ref}
                        icon={icon}
                        error={error}
                        required={required}
                        className={cn(
                            "rounded-full bg-white border border-black/[0.06] h-14 transition-all",
                            "hover:border-black/[0.15]",
                            "focus:border-primary/30 focus:ring-2 focus:ring-primary/10",
                            badge && "pl-20",
                            inputClassName
                        )}
                        {...props}
                    />
                    {badge && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1 z-10 pointer-events-none">
                            {badge}
                        </div>
                    )}
                </div>
                {children && <div className="px-1">{children}</div>}
            </div>
        );
    }
);

TextField.displayName = 'TextField';
