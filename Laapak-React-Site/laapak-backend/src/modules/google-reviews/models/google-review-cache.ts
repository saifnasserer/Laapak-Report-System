import { model } from "@medusajs/framework/utils"

const GoogleReviewCache = model.define("google_review_cache", {
    id: model.id().primaryKey(),
    reviews: model.json(),
    rating: model.float(),
    user_ratings_total: model.number(),
    last_synced_at: model.dateTime(),
})

export default GoogleReviewCache
