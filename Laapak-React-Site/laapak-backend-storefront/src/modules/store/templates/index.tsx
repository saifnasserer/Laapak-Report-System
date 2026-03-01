"use client"

import React, { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import SidebarFilters from "@modules/store/components/sidebar-filters"
import { ProductFilters } from "@lib/data/products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { clx } from "@medusajs/ui"
import { useStoreContext } from "@lib/context/store-context"

const StoreTemplate = ({
  sortBy,
  filters,
  categories,
  children,
  footerProps,
}: {
  sortBy?: SortOptions
  filters?: ProductFilters
  categories?: string[]
  children: React.ReactNode
  footerProps?: { collections: any[], productCategories: any[] }
}) => {
  const { isSidebarOpen, setIsSidebarOpen } = useStoreContext()
  const sort = sortBy || "created_at"

  return (
    <div
      className="flex flex-col small:flex-row small:items-start pt-0 pb-0 small:py-6 content-container !px-0 small:!px-8 gap-x-0 store-reels-container relative"
      data-testid="category-container"
    >
      <div
        className={clx(
          "transition-all duration-300 ease-in-out flex-shrink-0 z-50 bg-white small:bg-transparent overflow-y-auto small:overflow-hidden",
          isSidebarOpen ? "fixed top-[64px] inset-x-0 bottom-0 w-full px-6 py-4 small:static small:w-64 opacity-100 small:p-0 small:ml-8" : "w-0 max-h-[0px] small:max-h-none opacity-0 pointer-events-none ml-0"
        )}
      >
        <SidebarFilters
          currentFilters={filters || {}}
          categories={categories}
          sortBy={sort}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      <div className="flex-1 w-full min-w-0 transition-all duration-300 relative">
        <div className="w-full">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { footerProps } as any)
            }
            return child
          })}
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
