import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function checkAndFixShipping({ container }: ExecArgs) {
    const query = container.resolve("query");
    const regionModuleService = container.resolve(Modules.REGION);

    // Get the Egypt region
    const regions = await regionModuleService.listRegions();
    const egRegion = regions.find(r => r.currency_code === "egp" || r.name.toLowerCase().includes("egypt"));
    console.log("Egypt Region:", egRegion?.id, egRegion?.name);

    // Get existing shipping options
    const { data: options } = await query.graph({
        entity: "shipping_option",
        fields: ["id", "name", "prices.*"],
    });
    console.log(`\n${options.length} Shipping options found.`);
    options.forEach(o => {
        const prices = o.prices.map(p => `${p.currency_code}: ${p.amount} (region: ${p.rules_count})`).join(", ");
        console.log(`- ${o.name} (${o.id}): ${prices}`);
    });

    if (!egRegion) { console.log("No Egypt region found"); return; }

    // Add region_id price to each option that doesn't have it
    const pricingModule = container.resolve(Modules.PRICING);
    for (const option of options) {
        const hasPriceForRegion = option.prices.some(p => p.rules_count > 0);
        if (!hasPriceForRegion) {
            console.log(`\nAdding region price to "${option.name}"...`);
            // We need to add a region rule-based price to the price set
            const priceSets = await pricingModule.listPriceSets({ id: option.prices[0]?.price_set_id ? [option.prices[0].price_set_id] : [] });
            if (priceSets.length > 0) {
                const priceSetId = priceSets[0].id;
                await pricingModule.addPrices([{
                    priceSetId,
                    prices: [{
                        currency_code: "egp",
                        amount: 150,
                        rules: { region_id: egRegion.id }
                    }]
                }]);
                console.log(`Added region pricing to option "${option.name}".`);
            }
        } else {
            console.log(`"${option.name}" already has region pricing.`);
        }
    }
    console.log("\nDone. Try going to checkout now!");
}
