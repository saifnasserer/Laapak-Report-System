import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function diagnoseShipping({ container }: ExecArgs) {
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
    const stockLocationService = container.resolve(Modules.STOCK_LOCATION);
    const salesChannelService = container.resolve(Modules.SALES_CHANNEL);

    console.log("--- Diagnosing Shipping Options ---");

    // 1. Check Sales Channels
    const salesChannels = await salesChannelService.listSalesChannels();
    console.log(`\nFound ${salesChannels.length} Sales Channels:`, salesChannels.map(sc => sc.name).join(", "));
    const defaultSC = salesChannels.find(sc => sc.name === "Default Sales Channel") || salesChannels[0];

    // 2. Check Locations
    const locations = await stockLocationService.listStockLocations({}, { relations: ["sales_channels"] });
    console.log(`\nFound ${locations.length} Stock Locations:`);
    locations.forEach(loc => {
        const channels = (loc.sales_channels || []).map(sc => sc.name).join(", ");
        console.log(`- ${loc.name} (Linked Sales Channels: ${channels || 'NONE!'})`);
    });

    // 3. Check Fulfillment Sets & Service Zones
    const fSets = await fulfillmentModuleService.listFulfillmentSets({}, { relations: ["service_zones", "service_zones.geo_zones"] });
    console.log(`\nFound ${fSets.length} Fulfillment Sets:`);
    fSets.forEach(set => {
        console.log(`- Set: ${set.name}`);
        (set.service_zones || []).forEach(sz => {
            const zones = (sz.geo_zones || []).map(gz => `${gz.type}:${gz.country_code}`).join(", ");
            console.log(`  > Service Zone: ${sz.name} (Geo: ${zones})`);
        });
    });

    // 4. Check Shipping Options
    const options = await fulfillmentModuleService.listShippingOptions({}, { relations: ["service_zone", "shipping_profile", "rules"] });
    console.log(`\nFound ${options.length} Shipping Options:`);
    options.forEach(opt => {
        console.log(`- Option: ${opt.name}`);
        console.log(`  > Profile: ${opt.shipping_profile?.name}`);
        console.log(`  > Zone: ${opt.service_zone?.name}`);
        console.log(`  > Price Type: ${opt.price_type}`);
    });
}
