import GoogleReviewsModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const GOOGLE_REVIEWS_MODULE = "googleReviews"

export default Module(GOOGLE_REVIEWS_MODULE, {
    service: GoogleReviewsModuleService,
})
