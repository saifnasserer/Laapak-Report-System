import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {

  // Mock specs - to be replaced by backend module soon
  const specs = [
    { label: "المعالج", value: "Intel Core i7 13700H" },
    { label: "الرام", value: "16GB DDR5" },
    { label: "التخزين", value: "512GB NVMe SSD" },
    { label: "كارت الشاشة", value: "NVIDIA RTX 4060" },
    { label: "حجم الشاشة", value: "15.6 بوصة FHD 144Hz" },
    { label: "الحالة", value: "مستعمل بحالة الزيرو" },
  ]

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

        <Text
          className="text-base text-laapak-gray whitespace-pre-line leading-relaxed"
          data-testid="product-description"
        >
          {product.description}
        </Text>

        <div className="mt-8">
          <Heading level="h3" className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            المواصفات التقنية
          </Heading>
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            {specs.map((spec, index) => (
              <div key={index} className={`flex px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <span className="w-1/3 font-semibold text-gray-900 text-sm shrink-0">{spec.label}</span>
                <span className="w-2/3 text-laapak-gray text-sm">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
