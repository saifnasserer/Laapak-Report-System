import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GOOGLE_REVIEWS_MODULE } from "../../../modules/google-reviews"
import GoogleReviewsModuleService from "../../../modules/google-reviews/service"

/**
 * GET /store/google-reviews
 * Returns the cached Google Reviews from the database.
 * No authentication required — this is a public storefront endpoint.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const googleReviewsService: GoogleReviewsModuleService =
        req.scope.resolve(GOOGLE_REVIEWS_MODULE)

    const [cacheEntries] = await googleReviewsService.listGoogleReviewCaches(
        {},
        { take: 1, order: { last_synced_at: "DESC" } }
    )

    if (!cacheEntries) {
        return res.status(404).json({
            message: "No reviews cached yet. The scheduled job will populate the cache.",
        })
    }

    return res.json({
        reviews: cacheEntries.reviews,
        rating: cacheEntries.rating,
        user_ratings_total: cacheEntries.user_ratings_total,
        last_synced_at: cacheEntries.last_synced_at,
    })
}
