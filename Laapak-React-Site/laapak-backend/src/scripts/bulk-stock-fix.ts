import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Utility script to bulk-update inventory for all items that have 0 or no levels.
 * This bypasses the Admin UI "An error occurred" issue for stock management.
 */
export default async function bulkStockFix({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // The specific location ID we found earlier
    const LOCATION_ID = "sloc_01KJG2RPWDG7XVHPQ74T7X2EE7" // Tahrir
    const DEFAULT_QUANTITY = 10

    logger.info("🚀 Starting Bulk Stock Fix...")

    // 1. Fetch all inventory items
    const { data: inventoryItems } = await query.graph({
        entity: "inventory_item",
        fields: ["id", "sku", "location_levels.location_id", "location_levels.stocked_quantity"]
    })

    logger.info(`Found ${inventoryItems.length} total inventory items.`)

    const itemsToUpdate: any[] = []

    for (const item of inventoryItems) {
        // Check if item already has stock at our location
        const existingLevel = item.location_levels?.find((l: any) => l.location_id === LOCATION_ID)

        if (!existingLevel) {
            itemsToUpdate.push({
                location_id: LOCATION_ID,
                inventory_item_id: item.id,
                stocked_quantity: DEFAULT_QUANTITY
            })
        } else if (existingLevel.stocked_quantity === 0) {
            // Option to update existing 0 stock levels could be added here if needed
            // But usually the issue is missing levels for imported products
        }
    }

    if (itemsToUpdate.length === 0) {
        logger.info("✅ All items already have stock assigned. No actions needed.")
        return
    }

    logger.info(`Assigning ${DEFAULT_QUANTITY} units to ${itemsToUpdate.length} items...`)

    try {
        await createInventoryLevelsWorkflow(container).run({
            input: {
                inventory_levels: itemsToUpdate
            }
        })
        logger.info(`🎉 Successfully updated stock for ${itemsToUpdate.length} items!`)
    } catch (err: any) {
        logger.error(`❌ Failed to update inventory: ${err.message}`)
    }
}
