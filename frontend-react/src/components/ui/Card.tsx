import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'flat' | 'outline' | 'glass';
}

export const Card = ({ className, variant = 'flat', ...props }: CardProps) => {
    const variants = {
        flat: 'bg-white border border-black/[0.03]',
        outline: 'bg-white border border-black/10',
        glass: 'laapak-glass',
    };

    return (
        <div
            className={cn(
                'rounded-card p-6 overflow-hidden shadow-none transition-all',
                variants[variant],
                className
            )}
            {...props}
        />
    );
};

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('text-xl font-semibold tracking-tight', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6', className)} {...props} />
);
