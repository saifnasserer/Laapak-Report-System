"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

// Define the filter structure
export type ProductFilters = {
  cpu?: string[]
  ram?: string[]
  gpu?: string[]
  storage?: string[]
  brand?: string[]
  minPrice?: number
  maxPrice?: number
}

// Function to normalize arabic/english specs for filtering
const normalizeSpec = (spec: string | undefined): string => {
  if (!spec) return ""
  return spec.toLowerCase().replace(/جيجا|gb/g, "gb").trim()
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,+variants.images,+metadata,+tags",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  filters,
  searchQuery,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  filters?: ProductFilters
  searchQuery?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  // Apply filters if any
  let filteredProducts = sortedProducts
  if (filters && Object.keys(filters).length > 0) {
    filteredProducts = sortedProducts.filter((product) => {
      const metadata = product.metadata as Record<string, any> | null
      const specs = metadata?.specs as Record<string, string> | null

      // Check CPU
      if (filters.cpu?.length && filters.cpu.length > 0) {
        const proc = normalizeSpec(specs?.processor)
        const match = filters.cpu.some(cpu => proc.includes(cpu.toLowerCase()))
        if (!match) return false
      }

      // Check RAM
      if (filters.ram?.length && filters.ram.length > 0) {
        const ram = normalizeSpec(specs?.ram)
        const match = filters.ram.some(r => ram.includes(normalizeSpec(r)))
        if (!match) return false
      }

      // Check GPU
      if (filters.gpu?.length && filters.gpu.length > 0) {
        const gpu = normalizeSpec(specs?.gpu)
        const match = filters.gpu.some(g => gpu.includes(normalizeSpec(g)))
        if (!match) return false
      }

      // Check Storage
      if (filters.storage?.length && filters.storage.length > 0) {
        const storage = normalizeSpec(specs?.storage)
        const match = filters.storage.some(s => storage.includes(normalizeSpec(s)))
        if (!match) return false
      }

      // Check Brand (from title or tags/metadata if available, assuming title starts with brand usually)
      const title = (product.title || "").toLowerCase()
      if (filters.brand?.length && filters.brand.length > 0) {
        const match = filters.brand.some(b => title.includes(b.toLowerCase()))
        if (!match) return false
      }

      // Check Price Range
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const price = product.variants?.[0]?.calculated_price?.calculated_amount || 0
        if (filters.minPrice !== undefined && price < filters.minPrice) return false
        if (filters.maxPrice !== undefined && price > filters.maxPrice) return false
      }

      return true
    })
  }

  // Apply search query if any
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredProducts = filteredProducts.filter((product) => {
      const title = (product.title || "").toLowerCase()
      const description = (product.description || "").toLowerCase()
      // Also search in metadata specs if possible
      const metadata = product.metadata as Record<string, any> | null
      const specs = metadata?.specs as Record<string, string> | null
      const specsString = specs ? Object.values(specs).join(" ").toLowerCase() : ""

      return title.includes(query) || description.includes(query) || specsString.includes(query)
    })
  }

  const pageParam = (page - 1) * limit

  // Use the filtered count for pagination
  const filteredCount = filteredProducts.length
  const nextPage = filteredCount > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = filteredProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count: filteredCount,
    },
    nextPage,
    queryParams,
  }
}
