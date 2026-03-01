"use client"

import React, { useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

type ProductSliderProps = {
    products: HttpTypes.StoreProduct[]
    region: HttpTypes.StoreRegion
}

const ProductSlider: React.FC<ProductSliderProps> = ({ products, region }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            align: "start",
            direction: "rtl",
            containScroll: "trimSnaps",
            dragFree: true,
            loop: true,
        },
        [Autoplay({ delay: 3000, stopOnInteraction: false })]
    )

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    return (
        <div className="relative group/slider">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-6 py-4 px-2">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_30%] xl:flex-[0_0_23.5%] min-w-0"
                        >
                            <ProductPreview product={product} region={region} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            {products.length > 4 && (
                <>
                    <button
                        onClick={scrollNext}
                        className="absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-laapak-green hover:bg-laapak-green hover:text-white transition-all z-20 opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                        aria-label="Next slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <button
                        onClick={scrollPrev}
                        className="absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-laapak-green hover:bg-laapak-green hover:text-white transition-all z-20 opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                        aria-label="Previous slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 rtl:rotate-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    )
}

export default ProductSlider
