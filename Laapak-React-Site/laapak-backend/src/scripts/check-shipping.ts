import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function checkShipping({ container }: ExecArgs) {
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
    const regionModuleService = container.resolve(Modules.REGION);

    const regions = await regionModuleService.listRegions();
    console.log("Regions:", regions.map(r => ({ id: r.id, name: r.name, currency_code: r.currency_code })));

    const options = await fulfillmentModuleService.listShippingOptions({}, {});
    console.log("Shipping Options:", JSON.stringify(options, null, 2));
}
