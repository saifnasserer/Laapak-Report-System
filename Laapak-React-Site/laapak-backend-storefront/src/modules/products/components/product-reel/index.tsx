import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPrice from "../product-preview/price"
import Image from "next/image"
import AddToCartReel from "./add-to-cart"

export default function ProductReel({
    product,
    region,
}: {
    product: HttpTypes.StoreProduct
    region: HttpTypes.StoreRegion
}) {
    const { cheapestPrice } = getProductPrice({ product })

    const metadataSpecs = (product.metadata as Record<string, any>)?.specs || {}

    // Dynamic specs pulled from Medusa metadata
    const specs = [
        { label: "المعالج", value: metadataSpecs.processor },
        { label: "كارت الشاشة", value: metadataSpecs.gpu },
        { label: "الرام", value: metadataSpecs.ram },
        { label: "التخزين", value: metadataSpecs.storage },
    ].filter(s => s.value) // Only show available specs

    const video360Url = (product.metadata as Record<string, any>)?.video_360_url as string | undefined

    return (
        <div className="relative w-full h-full snap-start shrink-0 bg-black overflow-hidden flex items-center justify-center text-white">
            {/* Background Media */}
            {video360Url ? (
                <video
                    src={video360Url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
            ) : (
                <Image
                    src={product.thumbnail || ""}
                    alt={product.title}
                    fill
                    className="object-cover opacity-90"
                />
            )}

            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

            {/* Sale Badge for Reels */}
            {cheapestPrice?.price_type === "sale" && (
                <div className="absolute top-20 right-4 z-20 animate-bounce">
                    <div className="bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-2xl border border-rose-500 flex flex-col items-center">
                        <span className="text-[10px] opacity-80">عروض</span>
                        <span>لابـك 🔥</span>
                    </div>
                </div>
            )}

            {/* Bottom Content Area */}
            <div className="absolute bottom-4 left-0 right-16 px-4 md:px-6 flex flex-col gap-2 z-10 transition-opacity">
                <LocalizedClientLink href={`/products/${product.handle}`} className="block group">
                    <Text className="text-white font-bold text-lg md:text-xl leading-snug line-clamp-3">
                        {product.title}
                    </Text>
                </LocalizedClientLink>

                {/* Specs Tags */}
                <div className="flex flex-wrap gap-2 mt-2" dir="rtl">
                    {specs.slice(0, 3).map((spec, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-x-1 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold shadow-sm"
                            title={spec.label}
                        >
                            <span>{spec.value}</span>
                        </div>
                    ))}
                </div>

                {/* Price */}
                <div className="mt-1 flex items-baseline gap-1" data-testid="product-price">
                    {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
                </div>
            </div>

            {/* Floating Action Buttons (Right Side) */}
            <div className="absolute bottom-6 right-3 flex flex-col items-center gap-5 z-20">
                {/* Add to Cart Button */}
                <AddToCartReel product={product} />

                {/* View Details Button */}
                <LocalizedClientLink href={`/products/${product.handle}`} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-all transform active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                    </div>
                    <span className="text-white text-[11px] font-medium tracking-wide">تفاصيل</span>
                </LocalizedClientLink>

                {/* WhatsApp Order/Share Button */}
                <a
                    href={`https://wa.me/201026002636?text=${encodeURIComponent(`مرحباً أود الاستفسار عن لابتوب: ${product.title}\nالرابط: ${window?.['location']?.origin || 'https://laapak.com'}/products/${product.handle}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/90 backdrop-blur-md flex items-center justify-center text-white transition-all transform active:scale-95 shadow-md">
                        {/* WhatsApp SVG Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                        </svg>
                    </div>
                    <span className="text-white text-[11px] font-medium tracking-wide">واتساب</span>
                </a>
            </div>
        </div>
    )
}
