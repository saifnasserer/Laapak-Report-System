import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const isOnSale = price.price_type === "sale"

  // Calculate the amount saved if on sale
  const savings = isOnSale && price.original_price_number && price.calculated_price_number
    ? price.original_price_number - price.calculated_price_number
    : 0

  return (
    <div className="flex flex-col gap-0.5">
      {isOnSale && (
        <div className="flex items-center flex-wrap gap-2">
          {/* Strikethrough Original Price */}
          <Text
            className="line-through text-gray-400 text-[10px] md:text-xs font-medium opacity-80"
            data-testid="original-price"
          >
            {price.original_price}
          </Text>

          {/* Savings Badge (Arabic) */}
          {savings > 0 && (
            <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100">
              <span className="text-[9px] md:text-[10px] font-bold text-emerald-600">
                وفر {savings.toLocaleString()} ج.م
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-baseline gap-1">
        <Text
          className={clx("font-black tracking-tight", {
            "text-rose-600 text-base md:text-lg": isOnSale,
            "text-laapak-green text-base": !isOnSale,
          })}
          data-testid="price"
        >
          {price.calculated_price}
        </Text>
      </div>
    </div>
  )
}
