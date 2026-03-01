"use client"

import { useState } from "react"
import SidebarFilters from "@modules/store/components/sidebar-filters"
import { ProductFilters } from "@lib/data/products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Adjustments, XMark } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

const StoreTemplate = ({
  sortBy,
  filters,
  categories,
  children,
}: {
  sortBy?: SortOptions
  filters?: ProductFilters
  categories?: string[]
  children: React.ReactNode
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const sort = sortBy || "created_at"

  return (
    <div
      className="flex flex-col small:flex-row small:items-start pt-4 pb-6 small:py-6 content-container gap-x-0"
      data-testid="category-container"
    >
      <div
        className={clx(
          "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
          isSidebarOpen ? "w-full max-h-[1500px] small:max-h-none small:w-64 opacity-100 small:ml-8" : "w-0 max-h-[0px] small:max-h-none opacity-0 pointer-events-none ml-0"
        )}
      >
        <SidebarFilters
          currentFilters={filters || {}}
          categories={categories}
          sortBy={sort}
        />
      </div>
      <div className="flex-1 w-full min-w-0 transition-all duration-300">
        <div className="mb-8 flex flex-col small:flex-row small:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700 flex items-center justify-center"
              title={isSidebarOpen ? "إغلاق الفلاتر" : "فتح الفلاتر"}
            >
              {isSidebarOpen ? <XMark className="w-6 h-6" /> : <Adjustments className="w-6 h-6" />}
            </button>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="store-page-title">
              كل أجهزة اللابتوب
            </h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default StoreTemplate
