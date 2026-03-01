import { GOOGLE_REVIEWS_MODULE } from "../modules/google-reviews"
import GoogleReviewsModuleService from "../modules/google-reviews/service"

/**
 * Scheduled job: sync-google-reviews
 * Runs every 12 hours to fetch the latest reviews from Google Places API
 * and upsert them into the Medusa database cache.
 */
export default async function syncGoogleReviews({ container }: { container: any }) {
    const logger = container.resolve("logger")


    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const placeId = process.env.GOOGLE_PLACE_ID

    if (!apiKey || !placeId) {
        logger.warn(
            "[sync-google-reviews] GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID is missing. Skipping sync."
        )
        return
    }

    logger.info("[sync-google-reviews] Starting Google Reviews sync...")

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}&language=ar`
        )

        const data = await response.json()

        if (data.status !== "OK") {
            logger.error(
                `[sync-google-reviews] Google Places API error: ${data.status}`,
                data.error_message
            )
            return
        }

        const { reviews = [], rating = 4.9, user_ratings_total = 101 } = data.result

        const mappedReviews = reviews.map((review: any) => ({
            reviewer_name: review.author_name,
            rating: review.rating,
            review_text: review.text,
            profile_photo_url: review.profile_photo_url,
            relative_time: review.relative_time_description,
        }))

        const googleReviewsService: GoogleReviewsModuleService =
            container.resolve(GOOGLE_REVIEWS_MODULE)

        // Check if a cache record exists
        const [existing] = await googleReviewsService.listGoogleReviewCaches(
            {},
            { take: 1 }
        )

        if (existing) {
            // Update the existing record
            await googleReviewsService.updateGoogleReviewCaches({
                id: existing.id,
                reviews: mappedReviews,
                rating,
                user_ratings_total,
                last_synced_at: new Date(),
            })
            logger.info(
                `[sync-google-reviews] Updated cache with ${mappedReviews.length} reviews. Rating: ${rating}`
            )
        } else {
            // Create the first cache record
            await googleReviewsService.createGoogleReviewCaches({
                reviews: mappedReviews,
                rating,
                user_ratings_total,
                last_synced_at: new Date(),
            })
            logger.info(
                `[sync-google-reviews] Created initial cache with ${mappedReviews.length} reviews. Rating: ${rating}`
            )
        }
    } catch (error) {
        logger.error("[sync-google-reviews] Failed to sync Google Reviews:", error)
    }
}

export const config = {
    name: "sync-google-reviews",
    schedule: "0 */12 * * *", // Every 12 hours
}
