import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Utility script to link the "Tahrir" stock location to the "Default Sales Channel".
 * This is CRITICAL in Medusa V2 for stock to be visible on the storefront.
 */
export default async function linkStockLocation({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const STOCK_LOCATION_ID = "sloc_01KJG2RPWDG7XVHPQ74T7X2EE7" // Tahrir
    const SALES_CHANNEL_ID = "sc_01KJDCX1YMQ1BTPNTWK5JWXJ03"   // Default Sales Channel

    logger.info(`🔗 Linking Stock Location ${STOCK_LOCATION_ID} to Sales Channel ${SALES_CHANNEL_ID}...`)

    try {
        await linkSalesChannelsToStockLocationWorkflow(container).run({
            input: {
                id: STOCK_LOCATION_ID,
                add: [SALES_CHANNEL_ID],
            },
        })
        logger.info("✅ Successfully linked stock location to sales channel!")
    } catch (err: any) {
        logger.error(`❌ Failed to link stock location: ${err.message}`)
    }
}
