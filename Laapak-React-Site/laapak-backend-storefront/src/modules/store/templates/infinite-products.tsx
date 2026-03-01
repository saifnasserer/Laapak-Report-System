"use client"

import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef, useState, useCallback } from "react"

import { listProductsWithSort } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

type InfiniteProductsProps = {
    initialProducts: HttpTypes.StoreProduct[]
    region: HttpTypes.StoreRegion
    sortBy?: SortOptions
    queryParams?: any
    countryCode: string
    initialPage?: number
}

const InfiniteProducts = ({
    initialProducts,
    region,
    sortBy,
    queryParams,
    countryCode,
    initialPage = 1,
}: InfiniteProductsProps) => {
    const [products, setProducts] = useState<HttpTypes.StoreProduct[]>(initialProducts)
    const [page, setPage] = useState(initialPage + 1)
    const [hasNextPage, setHasNextPage] = useState(initialProducts.length === 12)
    const [isLoading, setIsLoading] = useState(false)
    const observer = useRef<IntersectionObserver | null>(null)

    const loadMore = useCallback(async () => {
        if (isLoading || !hasNextPage) return

        setIsLoading(true)

        const {
            response: { products: newProducts },
            nextPage,
        } = await listProductsWithSort({
            page,
            queryParams,
            sortBy,
            countryCode,
        })

        setProducts((prev) => [...prev, ...newProducts])
        setPage((prev) => prev + 1)
        setHasNextPage(!!nextPage)
        setIsLoading(false)
    }, [isLoading, hasNextPage, page, queryParams, sortBy, countryCode])

    const lastElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return
            if (observer.current) observer.current.disconnect()

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    loadMore()
                }
            })

            if (node) observer.current.observe(node)
        },
        [isLoading, hasNextPage, loadMore]
    )

    // Reset state when sortBy or initialProducts change
    useEffect(() => {
        setProducts(initialProducts)
        setPage(initialPage + 1)
        setHasNextPage(initialProducts.length === 12)
    }, [initialProducts, sortBy, initialPage])

    return (
        <div className="flex flex-col gap-y-12 w-full">
            <ul
                className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
                data-testid="products-list"
            >
                {products.map((p) => {
                    return (
                        <li key={p.id}>
                            <ProductPreview product={p} region={region} />
                        </li>
                    )
                })}
            </ul>

            {hasNextPage && (
                <div
                    ref={lastElementRef}
                    className="flex justify-center items-center py-12"
                >
                    {isLoading && <SkeletonProductGrid numberOfProducts={4} />}
                </div>
            )}
        </div>
    )
}

export default InfiniteProducts
