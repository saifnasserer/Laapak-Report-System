"use client"

import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef, useState, useCallback } from "react"

import { listProductsWithSort } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import ProductReel from "@modules/products/components/product-reel"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import Footer from "@modules/layout/templates/footer"


type InfiniteProductsProps = {
    initialProducts: HttpTypes.StoreProduct[]
    region: HttpTypes.StoreRegion
    sortBy?: SortOptions
    queryParams?: any
    countryCode: string
    initialPage?: number
    footerProps?: { collections: any[], productCategories: any[] }
}

const InfiniteProducts = ({
    initialProducts,
    region,
    sortBy,
    queryParams,
    countryCode,
    initialPage = 1,
    footerProps,
}: InfiniteProductsProps) => {
    const [products, setProducts] = useState<HttpTypes.StoreProduct[]>(initialProducts)
    const [page, setPage] = useState(initialPage + 1)
    const [hasNextPage, setHasNextPage] = useState(initialProducts.length === 12)
    const [isLoading, setIsLoading] = useState(false)
    const observer = useRef<IntersectionObserver | null>(null)
    const mobileObserver = useRef<IntersectionObserver | null>(null)

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

    const lastElementRefMobile = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return
            if (mobileObserver.current) mobileObserver.current.disconnect()

            mobileObserver.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    loadMore()
                }
            })

            if (node) mobileObserver.current.observe(node)
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
            {/* Desktop Grid View */}
            <ul
                className="hidden small:grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8 px-4 small:px-0"
                data-testid="products-list-desktop"
            >
                {products.map((p) => {
                    return (
                        <li key={p.id}>
                            <ProductPreview product={p} region={region} />
                        </li>
                    )
                })}
            </ul>

            {/* Mobile Reels View */}
            <div
                className="flex small:hidden flex-col w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black mb-0 scroll-smooth"
                data-testid="products-list-mobile-reels"
            >
                {products.map((p) => (
                    <ProductReel key={p.id} product={p} region={region} />
                ))}

                {/* Mobile Infinite Scroll Trigger - inside the scrolling block to intersect properly on mobile */}
                {hasNextPage && (
                    <div
                        ref={lastElementRefMobile}
                        className="w-full h-24 snap-start shrink-0 flex justify-center items-center bg-black mobile-trigger"
                    >
                        {isLoading && <span className="text-white text-sm font-bold animate-pulse">جاري التحميل...</span>}
                    </div>
                )}

                {/* Mobile Reels Footer Wrapper */}
                {!hasNextPage && (
                    <div className="w-full snap-start shrink-0 min-h-[100dvh] flex flex-col justify-center bg-white relative z-50">
                        <Footer collections={footerProps?.collections || []} productCategories={footerProps?.productCategories || []} />
                    </div>
                )}
            </div>

            {/* Global Infinite Scroll Trigger (with Ref) */}
            {hasNextPage && (
                <div
                    ref={lastElementRef}
                    className="flex justify-center items-center py-12 small:py-12"
                >
                    {isLoading && <SkeletonProductGrid numberOfProducts={4} />}
                </div>
            )}
        </div>
    )
}

export default InfiniteProducts
