import fs from "fs"
import path from "path"
import csv from "csv-parser"
import { ExecArgs } from "@medusajs/framework/types"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

type ProductInput = {
    title: string
    handle: string
    description: string
    status: string
    image1: string
    image2: string
    category: string
    price: number
}

// Helper to extract laptop specification from Arabic text using Regex
const extractSpecs = (description: string) => {
    const specs: Record<string, string> = {
        processor: "",
        ram: "",
        storage: "",
        gpu: "",
        screen_size: "",
        condition: "",
    }

    const processorRegex = /(?:^|\n)\s*المعالج\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const ramRegex = /(?:^|\n)\s*الرام\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const storageRegex = /(?:^|\n)\s*التخزين\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const gpuRegex = /(?:^|\n)\s*كارت الشاشة\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const screenRegex = /(?:^|\n)\s*الشاشة\s*[\r\n]+[-•]*\s*([^\n]+)/i
    const conditionRegex = /(?:^|\n)\s*الحالة\s*[\r\n]+[-•]*\s*([^\n]+)/i

    const pMatch = description?.match(processorRegex)
    if (pMatch) specs.processor = pMatch[1].trim().replace(/^[-•]\s*/, "")

    const rMatch = description?.match(ramRegex)
    if (rMatch) specs.ram = rMatch[1].trim().replace(/^[-•]\s*/, "")

    const sMatch = description?.match(storageRegex)
    if (sMatch) specs.storage = sMatch[1].trim().replace(/^[-•]\s*/, "")

    const gMatch = description?.match(gpuRegex)
    if (gMatch) specs.gpu = gMatch[1].trim().replace(/^[-•]\s*/, "")

    const scMatch = description?.match(screenRegex)
    if (scMatch) specs.screen_size = scMatch[1].trim().replace(/^[-•]\s*/, "")

    const cMatch = description?.match(conditionRegex)
    if (cMatch) specs.condition = cMatch[1].trim().replace(/^[-•]\s*/, "")

    return specs
}

import https from "https"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"

// Basic image downloader returning a base64 buffer & mimetype
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

export default async function importWooCommerce({ container }: ExecArgs) {
    const csvFilePath = path.resolve(__dirname, "../../exports/woocommerce_products.csv")

    console.log(`Starting Advanced WooCommerce Import process from: ${csvFilePath}`)

    // Create a map to group variants under the same product handle
    const productsMap = new Map<string, any>()

    const parseCSV = () => {
        return new Promise<void>((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    let rawHandle = data['Product Handle'] || data['Product Title'] || "";
                    try { rawHandle = decodeURIComponent(rawHandle); } catch (e) { }
                    let safeHandle = rawHandle.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/(^-+|-+$)/g, '');

                    if (!safeHandle) return; // Completely invalid

                    // If this is the main product row (has a title and description)
                    if (data['Product Title']) {
                        const specs = extractSpecs(data['Product Description'] || "")

                        productsMap.set(safeHandle, {
                            title: data['Product Title'],
                            handle: safeHandle,
                            description: data['Product Description'] || "",
                            source_images: [data['Product Image 1 Url'], data['Product Image 2 Url']].filter(Boolean).flatMap(url => url.split(',').map(u => u.trim())),
                            category: data['Product Category 1 Name'],
                            variants: [],
                            metadata: { specs }
                        })
                    }

                    // Add variant data (either on the main row if it has a price, or on subsequent blank-title rows)
                    const product = productsMap.get(safeHandle)
                    if (product && data['Variant Price EGP']) {
                        // Options strictly required by Medusa
                        const optionName = data['Variant Option 1 Name'] || "Default Option"
                        let optionValue = data['Variant Option 1 Value'] || "Default"

                        // Prevent duplicate variant titles which Medusa hates
                        if (product.variants.find((v: any) => v.title === optionValue)) {
                            optionValue = `${optionValue} - ${Math.random().toString(36).slice(2, 6)}`
                        }

                        product.variants.push({
                            title: optionValue,
                            sku: data['Variant SKU'] || undefined,
                            options: { [optionName]: optionValue },
                            prices: [
                                {
                                    amount: parseFloat(data['Variant Price EGP'] || "0"),
                                    currency_code: "egp",
                                }
                            ]
                        })
                    }
                })
                .on('end', () => resolve())
                .on('error', reject)
        })
    }

    await parseCSV()
    const allProducts = Array.from(productsMap.values())
    console.log(`Grouped CSV into ${allProducts.length} unique Products with their Variants.`)

    // We will process them sequentially to avoid overwhelming the download queue / database locks
    console.log("Starting Image Download and Database Seeding phase...")

    let successCount = 0;

    // Skip the first 5 we already did just in case, though handles might clash if we don't clear DB
    for (const product of allProducts) {
        try {
            console.log(`Processing: ${product.title} (${product.handle})`)

            // 1. Download & Upload Images to Medusa Storage
            const uploadedImageUrls: string[] = []
            if (product.source_images && product.source_images.length > 0) {
                const uploadFilesPayload: any[] = []

                for (const url of product.source_images) {
                    const downloaded = await downloadImage(url)
                    if (downloaded) {
                        // Create the object format Medusa uses for the upload workflow
                        uploadFilesPayload.push({
                            filename: downloaded.filename,
                            mimeType: downloaded.mimeType,
                            content: downloaded.buffer.toString("base64"),
                            access: "public"
                        })
                    }
                }

                if (uploadFilesPayload.length > 0) {
                    try {
                        const { result: uploadedFiles } = await uploadFilesWorkflow(container).run({
                            input: { files: uploadFilesPayload }
                        })
                        uploadedFiles.forEach(f => uploadedImageUrls.push(f.url))
                    } catch (err: any) {
                        console.warn(`  ⚠️ Failed to upload images for ${product.handle}: ${err.message}`)
                    }
                }
            }

            // 2. Format Product Payload
            // Ensure every product has at least one variant and option
            let optionsToCreate: { title: string; values: string[] }[] = []
            if (product.variants.length === 0) {
                optionsToCreate = [{ title: "Default Option", values: ["Default"] }]
                product.variants.push({
                    title: "Default",
                    options: { "Default Option": "Default" },
                    prices: [{ amount: 0, currency_code: "egp" }]
                })
            } else {
                // Extract unique base option names from the variants
                const optionNames = new Set<string>()
                product.variants.forEach((v: any) => {
                    Object.keys(v.options).forEach(k => optionNames.add(k))
                })

                optionsToCreate = Array.from(optionNames).map(name => {
                    const values = new Set<string>()
                    product.variants.forEach((v: any) => values.add(v.options[name] || "Default"))
                    return { title: name, values: Array.from(values) }
                })
            }

            const payload = {
                title: product.title,
                handle: product.handle,
                description: product.description,
                metadata: product.metadata,
                images: uploadedImageUrls.map(url => ({ url })),
                options: optionsToCreate,
                variants: product.variants
            }

            // 3. Create Product in DB
            await createProductsWorkflow(container).run({
                input: { products: [payload] }
            })

            successCount++
            console.log(`  ✅ Inserted ${product.handle} with ${product.variants.length} variants and ${uploadedImageUrls.length} images.`)

        } catch (e: any) {
            console.error(`  ❌ Failed to process ${product.handle}: ${e.message}`)
        }
    }

    console.log(`\n🎉 Seeding complete! Successfully imported ${successCount} out of ${allProducts.length} products.`)
}
