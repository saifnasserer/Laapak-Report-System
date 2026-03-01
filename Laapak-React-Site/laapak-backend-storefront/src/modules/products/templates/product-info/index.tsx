import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-y-4 items-center text-center">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="text-xs font-black text-rose-600 uppercase tracking-widest hover:text-rose-700"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}
      <Heading
        level="h2"
        className="text-3xl md:text-4xl leading-tight font-black text-gray-900 tracking-tight"
        data-testid="product-title"
      >
        {product.title}
      </Heading>

      <div className="h-1 w-20 bg-laapak-green/20 rounded-full" />
    </div>
  )
}

export default ProductInfo
