import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export const metadata: Metadata = {
  title: "المتجر - لابك",
  description: "تصفح أحدث أجهزة اللابتوب المستعملة والمجددة بأسعار تنافسية من لابك.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    cpu?: string | string[]
    ram?: string | string[]
    gpu?: string | string[]
    storage?: string | string[]
    brand?: string | string[]
    min_price?: string
    max_price?: string
    q?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, cpu, ram, gpu, storage, brand } = searchParams

  const filters = {
    cpu: Array.isArray(cpu) ? cpu : cpu ? cpu.split(",") : [],
    ram: Array.isArray(ram) ? ram : ram ? ram.split(",") : [],
    gpu: Array.isArray(gpu) ? gpu : gpu ? gpu.split(",") : [],
    storage: Array.isArray(storage) ? storage : storage ? storage.split(",") : [],
    brand: Array.isArray(brand) ? brand : brand ? brand.split(",") : [],
    minPrice: searchParams.min_price ? parseFloat(searchParams.min_price) : undefined,
    maxPrice: searchParams.max_price ? parseFloat(searchParams.max_price) : undefined,
  }

  const productCategories = await listCategories()
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  // Fetch collections for the footer inside InfiniteProducts
  const { collections } = await listCollections({ fields: "*products" })

  return (
    <StoreTemplate
      sortBy={sortBy}
      filters={filters}
      categories={productCategories.map(c => c.name)}
      footerProps={{
        collections,
        productCategories
      }}
    >
      <Suspense fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          countryCode={params.countryCode}
          filters={filters}
          searchQuery={searchParams.q}
        />
      </Suspense>
    </StoreTemplate>
  )
}
