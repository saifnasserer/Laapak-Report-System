"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { addToCart, retrieveCart, deleteLineItem } from "@lib/data/cart"
import { Spinner } from "@medusajs/icons"

export default function AddToCartReel({ product }: { product: HttpTypes.StoreProduct }) {
    const [isAdding, setIsAdding] = useState(false)
    const [isAdded, setIsAdded] = useState(false)
    const [lineId, setLineId] = useState<string | null>(null)
    const [isChecking, setIsChecking] = useState(true)
    const countryCode = useParams().countryCode as string

    // Pre-select variant (assuming default to 1st variant for "Reels quick add")
    const selectedVariant = product.variants?.[0]

    // Check if item is already in cart on mount
    useEffect(() => {
        const checkCart = async () => {
            try {
                const cart = await retrieveCart()
                if (cart?.items && selectedVariant) {
                    const item = cart.items.find(item => item.variant_id === selectedVariant.id)
                    if (item) {
                        setIsAdded(true)
                        setLineId(item.id)
                    } else {
                        setIsAdded(false)
                        setLineId(null)
                    }
                }
            } catch (error) {
                console.error("Failed to check cart", error)
            } finally {
                setIsChecking(false)
            }
        }
        checkCart()
    }, [selectedVariant])

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault() // prevent navigating to product
        if (!selectedVariant?.id) return

        setIsAdding(true)

        try {
            if (isAdded && lineId) {
                // Remove from cart
                await deleteLineItem(lineId)
                setIsAdded(false)
                setLineId(null)
            } else {
                // Add to cart
                await addToCart({
                    variantId: selectedVariant.id,
                    quantity: 1,
                    countryCode,
                })
                setIsAdded(true)
                // Refetch cart to get the new line item ID so it can be toggled off again
                const updatedCart = await retrieveCart()
                const item = updatedCart?.items?.find(i => i.variant_id === selectedVariant.id)
                if (item) setLineId(item.id)
            }
        } catch (error) {
            console.error("Error updating cart", error)
        } finally {
            setIsAdding(false)
        }
    }

    if (!selectedVariant) return null // No variants available

    return (
        <button
            onClick={handleAddToCart}
            disabled={isAdding || isChecking || (!isAdded && !selectedVariant.manage_inventory === false && selectedVariant.inventory_quantity === 0)}
            className="flex flex-col items-center gap-1 group"
            title={isAdded ? "إزالة من السلة" : "أضف للسلة"}
        >
            <div className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-all transform active:scale-95 ${isAdded
                ? "bg-laapak-green/90 border border-laapak-green"
                : "bg-black/40 border-transparent hover:bg-laapak-green/50"
                }`}>
                {isChecking || isAdding ? (
                    <div className="flex items-center justify-center w-full h-full">
                        <Spinner className="animate-spin text-white" />
                    </div>
                ) : isAdded ? (
                    // Checkmark Icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                ) : (
                    // Cart Icon (Replacing original bag icon)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                )}
            </div>
            <span className="text-white text-[11px] font-medium tracking-wide">
                {isChecking ? "..." : isAdded ? "في السلة" : "شراء"}
            </span>
        </button>
    )
}
