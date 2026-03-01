import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
    createShippingOptionsWorkflow,
    createPromotionsWorkflow,
    createStockLocationsWorkflow,
    linkSalesChannelsToStockLocationWorkflow
} from "@medusajs/medusa/core-flows";

export default async function addShippingEgypt({ container }: ExecArgs) {
    const regionModuleService = container.resolve(Modules.REGION);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    const regions = await regionModuleService.listRegions();
    const egRegion = regions.find(r => r.currency_code === "egp" || r.name.toLowerCase().includes("egypt"));
    if (!egRegion) {
        console.log("Error: Egypt region not found"); return;
    }

    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles();
    const shippingProfile = shippingProfiles[0];
    if (!shippingProfile) {
        console.log("No shipping profiles found."); return;
    }

    const defaultSalesChannels = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
    if (!defaultSalesChannels.length) {
        console.log("Default Sales Channel not found."); return;
    }

    let fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({}, { relations: ["service_zones"] });

    if (fulfillmentSets.length === 0) {
        console.log("Creating Egypt Warehouse & Fulfillment Set...");
        const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
            input: {
                locations: [{
                    name: "Egypt Warehouse",
                    address: { city: "Cairo", country_code: "EG", address_1: "" },
                }],
            },
        });
        const stockLocation = stockLocationResult[0];

        await link.create({
            [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
            [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
        });

        const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
            name: "Egypt delivery",
            type: "shipping",
            service_zones: [
                {
                    name: "Egypt",
                    geo_zones: [{ country_code: "eg", type: "country" }],
                },
            ],
        });

        await link.create({
            [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
            [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
        });

        await linkSalesChannelsToStockLocationWorkflow(container).run({
            input: { id: stockLocation.id, add: [defaultSalesChannels[0].id] },
        });

        fulfillmentSets = [fulfillmentSet];
        console.log("Fulfillment infrastructure ready.");
    }

    let targetServiceZoneId = fulfillmentSets[0]?.service_zones?.[0]?.id;

    if (!targetServiceZoneId) {
        // Create a service zone if missing on an existing set
        console.log("Creating Service Zone directly...");
        await fulfillmentModuleService.createServiceZones(fulfillmentSets[0].id, [
            { name: "Egypt", geo_zones: [{ country_code: "eg", type: "country" }] }
        ]);
        const updatedSets = await fulfillmentModuleService.listFulfillmentSets({ id: fulfillmentSets[0].id }, { relations: ["service_zones"] });
        targetServiceZoneId = updatedSets[0]?.service_zones?.[0]?.id;
    }

    console.log("Creating Standard Shipping (150 EGP)...");
    try {
        await createShippingOptionsWorkflow(container).run({
            input: [{
                name: "Standard Delivery", price_type: "flat", provider_id: "manual_manual",
                service_zone_id: targetServiceZoneId, shipping_profile_id: shippingProfile.id,
                type: { label: "Standard", description: "Delivery within Egypt", code: "standard" },
                prices: [{ currency_code: "egp", amount: 150 }, { region_id: egRegion.id, amount: 150 }],
                rules: [
                    { attribute: "enabled_in_store", value: "true", operator: "eq" },
                    { attribute: "is_return", value: "false", operator: "eq" }
                ],
            }],
        });
        console.log("Standard Shipping option created.");
    } catch (e) {
        console.log("Standard shipping already exists or error:", e.message);
    }

    console.log("Creating Free Shipping Promotion for > 1000 EGP...");
    try {
        await createPromotionsWorkflow(container).run({
            input: {
                promotionsData: [{
                    code: "FREESHIPPING", type: "standard", is_automatic: true,
                    application_method: {
                        type: "fixed", target_type: "shipping_methods", value: 150, currency_code: "egp", target_rules: [],
                    },
                    rules: [{ attribute: "cart_subtotal", operator: "gte", values: ["1000"] }]
                }]
            }
        });
        console.log("Promotion created.");
    } catch (e) {
        console.log("Promotion error:", e.message);
    }
}
