import { MedusaService } from "@medusajs/framework/utils"
import GoogleReviewCache from "./models/google-review-cache"

class GoogleReviewsModuleService extends MedusaService({
    GoogleReviewCache,
}) { }

export default GoogleReviewsModuleService
