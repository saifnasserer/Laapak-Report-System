import { ExecArgs } from "@medusajs/framework/types";

export default async function checkGraph({ container }: ExecArgs) {
    const query = container.resolve("query");

    console.log("=== LOCATIONS ===");
    const { data: locations } = await query.graph({
        entity: "stock_location",
        fields: ["id", "name", "sales_channels.id", "sales_channels.name", "fulfillment_sets.id", "fulfillment_sets.name"],
    });
    console.log(JSON.stringify(locations, null, 2));

    console.log("\n=== FULFILLMENT SETS + ZONES ===");
    const { data: fSets } = await query.graph({
        entity: "fulfillment_set",
        fields: ["id", "name", "type", "service_zones.id", "service_zones.name", "service_zones.geo_zones.*"],
    });
    console.log(JSON.stringify(fSets, null, 2));
}
