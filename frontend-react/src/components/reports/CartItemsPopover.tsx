/**
 * Cart Items Popover Component
 * Displays shopping cart items in a compact popover
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItem {
    id: number;
    name: string;
    quantity: number;
    price?: number;
}

interface CartItemsPopoverProps {
    items: CartItem[];
    isOpen: boolean;
    onClose: () => void;
    anchorEl: HTMLElement | null;
}

export default function CartItemsPopover({ items, isOpen, onClose, anchorEl }: CartItemsPopoverProps) {
    if (!isOpen || !anchorEl) return null;

    // Calculate position relative to anchor element
    const rect = anchorEl.getBoundingClientRect();
    const isRtl = document.dir === 'rtl';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Popover */}
            <div
                className={cn(
                    "fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden",
                    "animate-in fade-in-0 zoom-in-95 duration-200"
                )}
                style={{
                    top: `${rect.bottom + 8}px`,
                    [isRtl ? 'right' : 'left']: `${isRtl ? window.innerWidth - rect.right : rect.left}px`,
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-sm text-gray-900">
                        العناصر المضافة ({items.length})
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>

                {/* Items List */}
                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            لا توجد عناصر
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {items.map((item, index) => (
                                <div
                                    key={item.id || index}
                                    className="px-4 py-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                {item.name}
                                            </p>
                                            {item.price && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.price.toLocaleString()} جنيه
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                {item.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Total */}
                {items.length > 0 && items.some(item => item.price) && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">الإجمالي:</span>
                            <span className="text-sm font-bold text-gray-900">
                                {items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toLocaleString()} جنيه
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
