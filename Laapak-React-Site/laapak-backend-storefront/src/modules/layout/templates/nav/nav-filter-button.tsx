"use client"

import { usePathname } from "next/navigation"
import { useStoreContext } from "@lib/context/store-context"
import { clx } from "@medusajs/ui"

export default function NavFilterButton() {
    const pathname = usePathname()
    const { isSidebarOpen, setIsSidebarOpen } = useStoreContext()
    const isStorePage = pathname?.includes("/store")

    if (!isStorePage) return null

    return (
        <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:text-laapak-green transition-all group/filter flex items-center justify-center w-10 h-10 rounded-full border border-gray-100 bg-white shadow-sm hover:bg-gray-50 p-0"
            title={isSidebarOpen ? "إغلاق الفلاتر" : "الفلاتر"}
        >
            {isSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-gray-700 group-hover/filter:text-laapak-green transition-colors w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-gray-700 group-hover/filter:text-laapak-green transition-colors w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
            )}
        </button>
    )
}
