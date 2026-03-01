import React from "react"

type ProductDescriptionTableProps = {
    description: string | null
}

const ProductDescriptionTable = ({ description }: ProductDescriptionTableProps) => {
    if (!description) return null

    // Clean and split the description into blocks separated by multiple newlines
    const blocks = description.trim().split(/\n\s*\n+/)

    const parsedBlocks = blocks.map((block) => {
        const lines = block.trim().split("\n")
        if (lines.length > 1) {
            // Find the first non-empty line as the title
            let titleIndex = 0
            while (titleIndex < lines.length && !lines[titleIndex].trim()) {
                titleIndex++
            }

            if (titleIndex < lines.length - 1) {
                const title = lines[titleIndex].trim()
                const content = lines
                    .slice(titleIndex + 1)
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0)
                    .join("\n")
                return { title, content }
            }
        }
        return { title: null, content: block.trim() }
    })

    // Group into table rows
    return (
        <div className="w-full mt-8">
            <div className="flex flex-col text-sm w-full divide-y divide-gray-200/60 border-y border-gray-200/60">
                {parsedBlocks.map((block, index) => (
                    <div
                        key={index}
                        className="flex flex-col sm:flex-row rtl:sm:flex-row-reverse py-5 transition-colors group"
                    >
                        {block.title ? (
                            <>
                                <div className="sm:w-1/4 pb-2 sm:pb-0 sm:pl-6 font-medium text-gray-900 text-right sm:text-right" dir="rtl">
                                    {block.title}
                                </div>
                                <div className="sm:w-3/4 text-gray-600 leading-relaxed whitespace-pre-line text-right" dir="rtl">
                                    {block.content}
                                </div>
                            </>
                        ) : (
                            <div className="w-full text-gray-600 leading-relaxed whitespace-pre-line text-right" dir="rtl">
                                {block.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ProductDescriptionTable
