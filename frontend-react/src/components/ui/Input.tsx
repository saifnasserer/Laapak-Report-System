import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
    icon?: React.ReactNode;
    prefix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, label, icon, prefix, type, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-sm font-medium text-foreground/80 px-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors">
                            {icon}
                        </div>
                    )}
                    {prefix && (
                        <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-primary font-black font-mono select-none",
                            icon ? "left-11" : "left-4"
                        )}>
                            {prefix}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            'flex h-12 w-full rounded-input border-0 bg-surface-variant px-4 py-2 text-base ring-offset-background transition-all outline-none',
                            'placeholder:text-foreground/30',
                            'focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            icon && 'pl-12',
                            prefix && (icon ? 'pl-[4.5rem]' : 'pl-16'),
                            error && 'ring-2 ring-destructive/20 border-destructive/30',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs font-medium text-destructive px-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
