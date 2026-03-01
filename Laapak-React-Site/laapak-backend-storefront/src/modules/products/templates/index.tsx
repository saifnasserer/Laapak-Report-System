import React, { Suspense } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ProductActionsWrapper from "./product-actions-wrapper"
import ProductSpecsSummary from "@modules/products/components/product-specs-summary"
import ProductTrustBadges from "@modules/products/components/product-trust-badges"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 gap-x-12 relative"
        data-testid="product-container"
      >
        {/* Left Column: Image Gallery (Sticky) */}
        <div className="block w-full small:w-3/5 relative small:sticky small:top-32">
          <ImageGallery
            images={images}
            video360Url={(product.metadata as Record<string, any>)?.video_360_url as string | undefined}
          />
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="flex flex-col w-full small:w-2/5 py-8 gap-y-8">
          <ProductInfo product={product} />

          <div className="flex flex-col gap-6">
            <ProductSpecsSummary product={product} />

            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>

            <ProductTrustBadges />
          </div>

          <ProductTabs product={product} />
        </div>
      </div>

      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
