import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import syncGoogleReviews from "../../../../jobs/sync-google-reviews"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    try {
        await syncGoogleReviews({ container: req.scope })
        res.json({ message: "Google Reviews sync triggered successfully!" })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
