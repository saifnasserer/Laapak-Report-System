import { HttpTypes } from "@medusajs/types"
import React from "react"

type ProductSpecsSummaryProps = {
    product: HttpTypes.StoreProduct
}

const ProductSpecsSummary = ({ product }: ProductSpecsSummaryProps) => {
    const metadataSpecs = (product.metadata as Record<string, any>)?.specs || {}

    const specs = [
        { label: "المعالج", value: metadataSpecs.processor },
        { label: "الرام", value: metadataSpecs.ram },
        { label: "التخزين", value: metadataSpecs.storage },
        { label: "كارت الشاشة", value: metadataSpecs.gpu },
    ].filter((s) => s.value)

    if (specs.length === 0) {
        return null
    }

    return (
        <div className="grid grid-cols-2 gap-2 pb-6 border-b border-gray-100 w-full">
            {specs.map((spec, index) => (
                <div
                    key={index}
                    className="flex items-center gap-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 shadow-sm w-full"
                    title={spec.label}
                >
                    <span className="text-right flex-1 leading-snug break-words" dir="rtl">{spec.value}</span>
                </div>
            ))}
        </div>
    )
}

export default ProductSpecsSummary
