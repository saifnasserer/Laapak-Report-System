import { Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

export default function HotDeals({
    products,
    region,
}: {
    products: HttpTypes.StoreProduct[]
    region: HttpTypes.StoreRegion
}) {
    if (!products.length) return null

    return (
        <div className="py-10 md:py-16 bg-white">
            <div className="content-container">
                <div className="flex items-center justify-between mb-8 border-r-4 border-destructive pr-4">
                    <div className="flex flex-col gap-1">
                        <Heading level="h2" className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-gray-900 uppercase tracking-tighter whitespace-nowrap">
                            الحق قبل م <span className="text-destructive underline decoration-4 underline-offset-4">يفوتك !</span>
                        </Heading>
                        <p className="text-laapak-gray text-sm md:text-base font-medium">أفضل الأجهزة بأعلى نسبة خصم - لفترة محدودة</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-destructive font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-destructive"></span>
                        متبقي قطع قليلة
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {products.map((product) => (
                        <ProductPreview
                            key={product.id}
                            product={product}
                            region={region}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
