import { HttpTypes } from "@medusajs/types"
import React from "react"

type ProductSpecsSummaryProps = {
    product: HttpTypes.StoreProduct
}

const ProductSpecsSummary = ({ product }: ProductSpecsSummaryProps) => {
    const metadataSpecs = (product.metadata as Record<string, any>)?.specs || {}

    const specs = [
        {
            label: "المعالج",
            value: metadataSpecs.processor,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M8.25 6.75h7.5a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-7.5a2.25 2.25 0 0 1 2.25-2.25Z" />
                </svg>
            )
        },
        {
            label: "الرام",
            value: metadataSpecs.ram,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.5h12m-12 15h12M6 8.25h12M6 12h12M6 15.75h12" />
                </svg>
            )
        },
        {
            label: "التخزين",
            value: metadataSpecs.storage,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
            )
        },
        {
            label: "كارت الشاشة",
            value: metadataSpecs.gpu,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
            )
        },
    ].filter((s) => s.value)

    if (specs.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col items-start w-full">
            <div className="grid grid-cols-1 gap-2 pb-8 border-b border-gray-100 w-full">
                {specs.map((spec, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 p-2 bg-transparent border-none transition-all group"
                    >
                        {/* Icon and Value - Strictly Left Aligned at the "most left" */}
                        <div className="flex-shrink-0 text-rose-600 bg-rose-50 p-2 rounded-xl group-hover:bg-rose-100 transition-colors shadow-sm">
                            <span className="[&>svg]:w-5 [&>svg]:h-5">
                                {spec.icon}
                            </span>
                        </div>
                        <span
                            className="text-[13px] md:text-sm font-black text-gray-900 leading-tight text-left break-words"
                            dir="ltr"
                        >
                            {spec.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ProductSpecsSummary
