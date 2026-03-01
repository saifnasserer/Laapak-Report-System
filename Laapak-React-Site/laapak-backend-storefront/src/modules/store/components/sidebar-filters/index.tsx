"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { ProductFilters } from "@lib/data/products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { clx } from "@medusajs/ui"

const FILTER_SECTIONS = [
    {
        id: "brand",
        title: "العلامة التجارية",
        options: [], // Will be populated dynamically
    },
    {
        id: "cpu",
        title: "المعالج",
        options: ["Core i3", "Core i5", "Core i7", "Core i9", "Ryzen 3", "Ryzen 5", "Ryzen 7"],
    },
    {
        id: "ram",
        title: "الرام",
        options: ["8GB", "16GB", "32GB", "64GB"],
    },
    {
        id: "storage",
        title: "التخزين",
        options: ["256GB", "512GB", "1TB", "2TB"],
    },
    {
        id: "gpu",
        title: "بطاقة الرسوميات",
        options: ["NVIDIA", "AMD", "Intel"],
    },
]

type SidebarFiltersProps = {
    currentFilters: ProductFilters
    categories?: string[]
    sortBy: SortOptions
}

const sortOptions = [
    { value: "created_at", label: "أحدث المضاف" },
    { value: "price_asc", label: "السعر: من الأقل للأعلى" },
    { value: "price_desc", label: "السعر: من الأعلى للأقل" },
]

const SidebarFilters = ({ currentFilters, categories = [], sortBy }: SidebarFiltersProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("sortBy", value)
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleCheckboxChange = (sectionId: string, option: string) => {
        const params = new URLSearchParams(searchParams)

        // Get current values for this section
        const currentValues = params.get(sectionId)?.split(",") || []

        if (currentValues.includes(option)) {
            // Remove option
            const newValues = currentValues.filter((v) => v !== option)
            if (newValues.length > 0) {
                params.set(sectionId, newValues.join(","))
            } else {
                params.delete(sectionId)
            }
        } else {
            // Add option
            currentValues.push(option)
            params.set(sectionId, currentValues.join(","))
        }

        // Reset to page 1 when filters change
        params.delete("page")

        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleClearFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams)
        FILTER_SECTIONS.forEach((section) => {
            params.delete(section.id)
        })
        params.delete("page")
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, [searchParams, pathname, router])

    const hasActiveFilters = useCallback(() => {
        return FILTER_SECTIONS.some((section) => searchParams.has(section.id))
    }, [searchParams])

    return (
        <div className="w-full flex-col gap-6 py-4 mb-8 flex transition-opacity duration-300">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                    تصفية النتائج
                </h2>
                {hasActiveFilters() && (
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                        مسح الفلاتر
                    </button>
                )}
            </div>

            {/* Sorting Section */}
            <div className="flex flex-col gap-3 pb-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">ترتيب حسب</h3>
                <div className="flex flex-col gap-2">
                    {sortOptions.map((option) => (
                        <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <input
                                type="radio"
                                name="sort"
                                value={option.value}
                                checked={sortBy === option.value}
                                onChange={() => handleSortChange(option.value)}
                                className="text-laapak-green focus:ring-laapak-green/20"
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {FILTER_SECTIONS.map((section) => {
                const selectedOptions = (currentFilters as any)[section.id] || []

                // Use dynamic categories for brand if available, otherwise fallback/empty
                const options = section.id === "brand" && categories.length > 0
                    ? categories
                    : section.options

                if (options.length === 0) return null

                return (
                    <div key={section.id} className="flex flex-col gap-3">
                        <h3 className="font-semibold text-gray-800 text-sm">{section.title}</h3>
                        <div className="flex flex-col gap-2">
                            {options.map((option) => {
                                const isSelected = selectedOptions.includes(option)
                                return (
                                    <label
                                        key={option}
                                        className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-laapak-green focus:ring-laapak-green/20"
                                            checked={isSelected}
                                            onChange={() => handleCheckboxChange(section.id, option)}
                                        />
                                        <span>{option}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default SidebarFilters
