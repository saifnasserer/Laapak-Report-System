/**
 * Google Reviews data fetcher — storefront side.
 * Reads from the Medusa DB cache via the store API.
 * The DB is the single source of truth; Google API is only called by the backend scheduled job.
 */

export type GoogleReview = {
    reviewer_name: string
    rating: number
    review_text: string
    profile_photo_url?: string
    relative_time?: string
}

export type GoogleReviewsResponse = {
    reviews: GoogleReview[]
    rating: number
    user_ratings_total: number
    last_synced_at?: string
}

export async function getGoogleReviews(): Promise<GoogleReviewsResponse | null> {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

    try {
        const response = await fetch(`${backendUrl}/store/google-reviews`, {
            headers: {
                "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            },
            // Revalidate every hour on the Next.js side as a safety net,
            // but the real freshness is controlled by the backend scheduled job.
            next: { revalidate: 3600 },
        })

        if (!response.ok) {
            console.warn("[getGoogleReviews] Cache not populated yet or API error:", response.status)
            return null
        }

        const data: GoogleReviewsResponse = await response.json()
        return data
    } catch (error) {
        console.error("[getGoogleReviews] Failed to fetch reviews from Medusa:", error)
        return null
    }
}
