import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductDescriptionTable from "../../components/product-description-table"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-laapak-green"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-4xl leading-tight font-black text-gray-900"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <div data-testid="product-description" className="mt-2 text-right w-full" dir="rtl">
          <ProductDescriptionTable description={product.description} />
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
