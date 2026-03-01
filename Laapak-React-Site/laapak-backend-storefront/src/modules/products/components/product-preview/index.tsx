import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const metadataSpecs = (product.metadata as Record<string, any>)?.specs || {}

  // Dynamic specs pulled from Medusa metadata
  const specs = [
    { label: "المعالج", value: metadataSpecs.processor },
    { label: "كارت الشاشة", value: metadataSpecs.gpu },
  ].filter(s => s.value) // Only show available specs

  const video360Url = (product.metadata as Record<string, any>)?.video_360_url as string | undefined
  if (video360Url) {
    console.log(`[ProductPreview] Video available for: ${product.title}`)
  } else {
    console.log(`[ProductPreview] NO video for: ${product.title}`)
  }

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block h-full">
      <div
        data-testid="product-wrapper"
        className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <div className="relative aspect-[4/3] bg-white group-hover:scale-105 transition-transform duration-500">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            video360Url={video360Url}
            size="full"
            isFeatured={isFeatured}
            className="rounded-none shadow-none ring-0 border-none bg-transparent"
          />
          {cheapestPrice?.price_type === "sale" && (
            <div className="absolute top-2 left-2 z-10 animate-fade-in">
              <div className="bg-rose-600 text-white text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full shadow-lg border border-rose-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                خصم حصري
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 p-4 md:p-5 gap-3 md:gap-4 bg-gray-50/50">
          <Text className="text-gray-900 font-bold text-base md:text-lg leading-tight line-clamp-2" data-testid="product-title">
            {product.title}
          </Text>

          <div className="flex flex-wrap gap-2 mt-auto" dir="rtl">
            {specs.map((spec, i) => (
              <div
                key={i}
                className="flex items-center gap-x-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 shadow-sm max-w-full overflow-hidden"
                title={spec.label}
              >
                <span className="truncate max-w-full">{spec.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
            <div className="flex items-baseline gap-1" data-testid="product-price">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
            <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-laapak-green group-hover:bg-laapak-green group-hover:text-white transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 rtl:rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
