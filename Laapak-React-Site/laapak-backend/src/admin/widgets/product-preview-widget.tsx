import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Container, Button, Text } from "@medusajs/ui"
import { ArrowUpRightOnBox } from "@medusajs/icons"

const ProductPreviewWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
    if (!product || !product.handle) {
        return null
    }

    // Base URL for the storefront
    // In a production environment, this would ideally come from an environment variable
    // but for this local setup, we use the known dev port.
    const STOREFRONT_URL = "http://localhost:8000"

    // Pattern based on the experimental setup (localized with /eg/)
    const previewUrl = `${STOREFRONT_URL}/eg/products/${product.handle}`

    return (
        <Container className="p-0 border-ui-border-base border overflow-hidden" style={{ marginBottom: "16px" }}>
            <div className="flex items-center justify-between px-6 py-4 bg-ui-bg-subtle">
                <div className="flex flex-col gap-y-0.5">
                    <Text weight="plus" className="text-ui-fg-base">Storefront Preview</Text>
                    <Text size="small" className="text-ui-fg-subtle">View this product on the customer-facing site</Text>
                </div>
                <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="no-underline"
                >
                    <Button variant="secondary" size="small" className="flex items-center gap-x-2">
                        Open in Store
                        <ArrowUpRightOnBox />
                    </Button>
                </a>
            </div>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.before",
})

export default ProductPreviewWidget
