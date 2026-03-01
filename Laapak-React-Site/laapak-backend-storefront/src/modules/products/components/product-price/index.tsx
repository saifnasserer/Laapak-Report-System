import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const isOnSale = selectedPrice.price_type === "sale"

  // Calculate savings
  const savings = isOnSale && selectedPrice.original_price_number && selectedPrice.calculated_price_number
    ? selectedPrice.original_price_number - selectedPrice.calculated_price_number
    : 0

  return (
    <div className="flex flex-col gap-1.5">
      {isOnSale && (
        <div className="flex items-center gap-3">
          <span className="line-through text-gray-400 text-base font-medium">
            {selectedPrice.original_price}
          </span>
          {savings > 0 && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 shadow-sm">
              <span className="text-xs font-bold text-emerald-600">
                وفر {savings.toLocaleString()} ج.م
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span
          className={clx("text-2xl md:text-3xl font-black tracking-tight", {
            "text-rose-600": isOnSale,
            "text-laapak-green": !isOnSale,
          })}
          data-testid="product-price"
        >
          {selectedPrice.calculated_price}
        </span>
      </div>
    </div>
  )
}
