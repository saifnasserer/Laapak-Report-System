'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TableProps {
    headers: string[];
    children: React.ReactNode;
    className?: string;
}

export const Table = ({ headers, children, className }: TableProps) => {
    return (
        <div className={cn("overflow-x-auto rounded-xl", className)}>
            <table className="w-full text-right border-collapse">
                <thead>
                    <tr className="bg-surface-variant/30">
                        {headers.map((header, index) => (
                            <th key={index} className="px-8 py-4 text-sm font-bold text-secondary/60">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export const TableRow = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => (
    <tr
        onClick={onClick}
        className={cn(
            "hover:bg-primary/5 transition-colors group",
            onClick && "cursor-pointer",
            className
        )}
    >
        {children}
    </tr>
);

export const TableCell = ({ children, className, colSpan, ...props }: { children: React.ReactNode, className?: string, colSpan?: number, [key: string]: any }) => (
    <td className={cn("px-8 py-4", className)} colSpan={colSpan} {...props}>
        {children}
    </td>
);
