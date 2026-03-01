import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function configureShipping({ container }: ExecArgs) {
    const promotionModuleService = container.resolve(Modules.PROMOTION);

    const promotions = await promotionModuleService.listPromotions();
    console.log("Existing Promotions:", JSON.stringify(promotions, null, 2));
}
