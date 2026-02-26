import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
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

  // Mock specs until backend is fully integrated
  const specs = [
    { label: "المعالج", value: "Core i7" },
    { label: "الرام", value: "16GB" },
    { label: "التخزين", value: "512GB" },
  ]

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block h-full">
      <div
        data-testid="product-wrapper"
        className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <div className="relative aspect-[4/3] bg-white">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="rounded-none shadow-none ring-0 border-none bg-transparent"
          />
        </div>
        <div className="flex flex-col flex-1 p-5 gap-4 bg-gray-50/50">
          <Text className="text-gray-900 font-bold text-lg leading-tight line-clamp-2" data-testid="product-title">
            {product.title}
          </Text>

          <div className="flex flex-wrap gap-2 mt-auto">
            {specs.map((spec, i) => (
              <span key={i} className="inline-flex items-center px-2 py-1 bg-white text-laapak-gray text-xs rounded-md border border-gray-100 shadow-sm">
                <span className="font-semibold ml-1">{spec.label}:</span> {spec.value}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
            <div className="text-laapak-green font-black text-xl flex items-baseline gap-1" data-testid="product-price">
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
