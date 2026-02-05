'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
    className?: string;
    circular?: boolean;
}

export const Badge = ({ children, variant = 'primary', className, circular }: BadgeProps) => {
    const variants = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary/10 text-secondary border-secondary/20',
        success: 'bg-green-100 text-green-600 border-green-200',
        warning: 'bg-yellow-100 text-yellow-600 border-yellow-200',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        outline: 'bg-transparent border-black/10 text-secondary',
    };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-all inline-flex items-center justify-center",
            circular && "rounded-full px-4 py-1",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};
