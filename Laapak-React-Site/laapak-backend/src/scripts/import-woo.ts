import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createProductsWorkflow, uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import * as path from "path";
import https from "https";

// Helper to extract laptop specification from Arabic text using Regex
const extractSpecs = (description: string) => {
    const specs: Record<string, string> = {
        processor: "", ram: "", storage: "", gpu: "", screen_size: "", condition: "",
    }
    const processorRegex = /(?:^|\n)\s*المعالج\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const ramRegex = /(?:^|\n)\s*الرام\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const storageRegex = /(?:^|\n)\s*التخزين\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const gpuRegex = /(?:^|\n)\s*كارت الشاشة\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const screenRegex = /(?:^|\n)\s*الشاشة\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const conditionRegex = /(?:^|\n)\s*الحالة\s*[\r\n]+[-•]*\s*([^\n]+)/i

    const pMatch = description?.match(processorRegex); if (pMatch) specs.processor = pMatch[1].trim().replace(/^[-•]\s*/, "");
    const rMatch = description?.match(ramRegex); if (rMatch) specs.ram = rMatch[1].trim().replace(/^[-•]\s*/, "");
    const sMatch = description?.match(storageRegex); if (sMatch) specs.storage = sMatch[1].trim().replace(/^[-•]\s*/, "");
    const gMatch = description?.match(gpuRegex); if (gMatch) specs.gpu = gMatch[1].trim().replace(/^[-•]\s*/, "");
    const scMatch = description?.match(screenRegex); if (scMatch) specs.screen_size = scMatch[1].trim().replace(/^[-•]\s*/, "");
    const cMatch = description?.match(conditionRegex); if (cMatch) specs.condition = cMatch[1].trim().replace(/^[-•]\s*/, "");

    return specs
}

// Image downloader
async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
    if (!url) return null;
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return resolve(null)
            const data: Buffer[] = []
            res.on('data', chunk => data.push(chunk))
            res.on('end', () => {
                const buffer = Buffer.concat(data)
                const mimeType = res.headers['content-type'] || 'image/jpeg'
                const filename = path.basename(new URL(url).pathname) || `image-${Date.now()}.jpg`
                resolve({ buffer, mimeType, filename })
            })
        }).on('error', () => resolve(null))
    })
}

const WOO_BASE_URL = 'https://laapak.com';
const WOO_CONSUMER_KEY = 'ck_a00837182f934a0f93d63877b3e33e127cefc11b';
const WOO_CONSUMER_SECRET = 'cs_2186f8d150aa716f9c6b3d1c66e9c96f5e6b209d';

export default async function importWooCommerceProducts({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

    logger.info("Fetching all products from WooCommerce API directly...");

    try {
        // Fetch default sales channel
        const salesChannels = await remoteQuery({
            entity: "sales_channel",
            fields: ["id", "name"],
        });
        const defaultSalesChannel = salesChannels.find(sc => sc.name.toLowerCase().includes("default")) || salesChannels[0];

        if (!defaultSalesChannel) {
            logger.error("No Sales Channel found. Medusa needs at least one to show products on storefront.");
            return;
        }

        logger.info(`Using Sales Channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})`);

        const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');
        const allWooProducts: any[] = [];
        let page = 1;
        let totalPages = 1;

        // Fetch all pages
        do {
            logger.info(`Fetching page ${page}...`);
            const response = await fetch(`${WOO_BASE_URL}/wp-json/wc/v3/products?per_page=50&status=publish&page=${page}`, {
                headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                logger.error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
                break;
            }

            totalPages = parseInt(response.headers.get('X-WP-TotalPages') || "1", 10);
            const wooProducts = await response.json();
            allWooProducts.push(...wooProducts);
            page++;
        } while (page <= totalPages);

        logger.info(`Successfully fetched ${allWooProducts.length} total products from WooCommerce.`);
        logger.info(`Beginning Seeding Process... (Existing products will be skipped)`);

        let successCount = 0;
        let skippedCount = 0;

        for (const wp of allWooProducts) {
            try {
                let safeHandle = (wp.slug || `woo-${wp.id}`).toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/(^-+|-+$)/g, '');

                // 1. Download Images
                const source_images = (wp.images || []).map((img: any) => img.src);
                const uploadedImageUrls: string[] = [];
                if (source_images.length > 0) {
                    const uploadFilesPayload: any[] = [];
                    for (const url of source_images) {
                        const downloaded = await downloadImage(url);
                        if (downloaded) {
                            uploadFilesPayload.push({
                                filename: downloaded.filename,
                                mimeType: downloaded.mimeType,
                                content: downloaded.buffer.toString("base64"),
                                access: "public"
                            });
                        }
                    }
                    if (uploadFilesPayload.length > 0) {
                        try {
                            const { result: uploadedFiles } = await uploadFilesWorkflow(container).run({
                                input: { files: uploadFilesPayload }
                            });
                            uploadedFiles.forEach(f => uploadedImageUrls.push(f.url));
                        } catch (err: any) {
                            logger.warn(`  - Failed to upload images for ${safeHandle}: ${err.message}`);
                        }
                    }
                }

                // 2. Extract Specs (Strip HTML tags from WooCommerce desc)
                const rawDesc = wp.description?.replace(/(<([^>]+)>)/gi, "") || wp.short_description?.replace(/(<([^>]+)>)/gi, "") || "";
                const specs = extractSpecs(rawDesc);

                // 3. Prepare Payload
                const priceMatch = parseFloat(wp.price || wp.regular_price || "0");

                const payload = {
                    title: wp.name,
                    handle: safeHandle,
                    description: rawDesc,
                    status: "published", // CRITICAL: Mark as published
                    sales_channels: [{ id: defaultSalesChannel.id }], // CRITICAL: Assign to sales channel
                    metadata: { specs },
                    images: uploadedImageUrls.map(url => ({ url })),
                    options: [{ title: "Default Option", values: ["Default"] }],
                    variants: [
                        {
                            title: "Default",
                            sku: wp.sku || undefined,
                            options: { "Default Option": "Default" },
                            prices: [{ amount: priceMatch, currency_code: "egp" }]
                        }
                    ]
                };

                // 4. Insert Product
                await createProductsWorkflow(container).run({
                    input: { products: [payload] }
                });

                successCount++;
                logger.info(`  ✅ Inserted ${safeHandle} (Published & Linked)`);

            } catch (e: any) {
                if (e.message?.includes("already exists")) {
                    skippedCount++;
                    logger.info(`  ⏭️ Skipped ${wp.name} (Already exists)`);
                } else {
                    logger.error(`  ❌ Failed to process ${wp.name}: ${e.message}`);
                }
            }
        }
        logger.info(`\n🎉 Seeding complete! Successfully imported ${successCount} new products. Skipped ${skippedCount} existing products.`);

    } catch (error: any) {
        logger.error(`Import API failed: ${error.message}`);
        console.error(error);
    }
}
