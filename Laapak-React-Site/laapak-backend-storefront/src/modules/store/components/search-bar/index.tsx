"use client"

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect, useRef } from "react"


const SearchBar = ({ defaultValue = "" }: { defaultValue?: string }) => {
    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [value, setValue] = useState(defaultValue)
    const initialRender = useRef(true)

    const countryCode = params.countryCode as string

    const handleSearch = (query: string) => {
        const newParams = new URLSearchParams(searchParams)
        if (query) {
            newParams.set("q", query)
        } else {
            newParams.delete("q")
        }
        newParams.delete("page") // Reset pagination

        startTransition(() => {
            // Always redirect to the store page when searching globally
            router.push(`/${countryCode}/store?${newParams.toString()}`, { scroll: false })
        })
    }

    // Live search debounce
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false
            return
        }

        const timer = setTimeout(() => {
            handleSearch(value)
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [value])

    useEffect(() => {
        const currentSearch = searchParams.get("q") || ""
        if (currentSearch !== value) {
            setValue(currentSearch)
        }
    }, [searchParams])

    return (
        <div className="relative w-full max-w-[440px]">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSearch(value)
                    }
                }}
                placeholder="ابحث عن أجهزة لابتوب، موديلات، أو مواصفات..."
                className="block w-full pr-10 pl-3 py-2.5 border border-gray-100 rounded-full leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-laapak-green/20 focus:border-laapak-green focus:bg-white sm:text-sm transition-all shadow-sm"
                dir="rtl"
            />
            {isPending && (
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-laapak-green"></div>
                </div>
            )}
        </div>
    )
}

export default SearchBar
