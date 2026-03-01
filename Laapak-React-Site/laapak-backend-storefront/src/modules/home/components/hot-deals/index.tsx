import { Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import ProductSlider from "@modules/home/components/product-slider"

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
                <div className="flex items-center justify-between mb-8 border-r-4 border-rose-600 pr-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl animate-bounce">🔥</span>
                            <Heading level="h2" className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter whitespace-nowrap">
                                الحق قبل م <span className="text-rose-600 underline decoration-4 underline-offset-4 decoration-rose-200">يفوتك !</span>
                            </Heading>
                        </div>
                        <p className="text-laapak-gray text-sm md:text-base font-medium">أفضل الأجهزة بأعلى نسبة خصم - لفترة محدودة</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-rose-600 font-bold bg-rose-50 px-4 py-2 rounded-full border border-rose-100 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-600 ring-4 ring-rose-100"></span>
                        متبقي قطع قليلة جداً
                    </div>
                </div>

                <ProductSlider products={products} region={region} />
            </div>
        </div>
    )
}
