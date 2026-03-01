"use client"

import { usePathname } from "next/navigation"
import { clx } from "@medusajs/ui"

export default function NavHeader({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isStorePage = pathname?.includes("/store")

    return (
        <header className={clx(
            "h-16 md:h-20 mx-auto duration-200 w-full",
            // If it's the store page (Reels UI), make it absolute and transparent on mobile, regular on desktop
            isStorePage
                ? "absolute top-0 inset-x-0 z-50 bg-gradient-to-b from-white/90 via-white/50 to-transparent small:relative small:bg-white small:border-b small:border-ui-border-base small:shadow-sm"
                : "relative bg-white border-b border-ui-border-base shadow-sm"
        )}>
            {children}
        </header>
    )
}
