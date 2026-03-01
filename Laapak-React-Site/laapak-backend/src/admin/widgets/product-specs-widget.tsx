import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Container, Heading, Input, Label, Divider, Button, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { sdk } from "../lib/sdk"

const ProductSpecsWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [specs, setSpecs] = useState({
        processor: "",
        ram: "",
        storage: "",
        gpu: "",
        screen_size: "",
        condition: "",
        video_360_url: "",
    })

    // Sync specs when product changes OR when entering edit mode
    useEffect(() => {
        if (product?.metadata?.specs) {
            const s = product.metadata.specs as any
            setSpecs({
                processor: s.processor || "",
                ram: s.ram || "",
                storage: s.storage || "",
                gpu: s.gpu || "",
                screen_size: s.screen_size || "",
                condition: s.condition || "",
                video_360_url: product.metadata?.video_360_url as string || "",
            })
        }
    }, [product?.metadata?.specs])

    const handleSave = async () => {
        if (!product) return

        setIsSubmitting(true)
        try {
            // we have to separate video_360_url from specs to put it in the root metadata level
            // but we keep specs under the specs key
            const { video_360_url, ...restSpecs } = specs;

            await sdk.admin.product.update(product.id, {
                metadata: {
                    ...product.metadata,
                    specs: restSpecs,
                    video_360_url: video_360_url
                }
            })

            toast.success("Success", {
                description: "Specifications updated successfully!",
            })
            setIsEditing(false)

            // Refresh to ensure metadata is synced across components
            setTimeout(() => window.location.reload(), 1000)
        } catch (error: any) {
            console.error("Update error:", error)
            toast.error("Error", {
                description: "Failed to update: " + (error.message || "Unknown error"),
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSpecs(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleCancel = () => {
        if (product?.metadata?.specs) {
            const s = product.metadata.specs as any
            setSpecs({
                processor: s.processor || "",
                ram: s.ram || "",
                storage: s.storage || "",
                gpu: s.gpu || "",
                screen_size: s.screen_size || "",
                condition: s.condition || "",
                video_360_url: product?.metadata?.video_360_url as string || "",
            })
        }
        setIsEditing(false)
    }

    if (!product) {
        return null
    }

    return (
        <Container className="p-0 border-ui-border-base border" style={{ marginTop: "16px", marginBottom: "16px" }}>
            <div className="flex items-center justify-between px-6 py-4">
                <Heading level="h2">Laptop Specifications</Heading>
                {!isEditing ? (
                    <Button variant="secondary" size="small" onClick={() => setIsEditing(true)}>
                        Edit Specs
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="transparent" size="small" onClick={handleCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="small" onClick={handleSave} isLoading={isSubmitting}>
                            Save
                        </Button>
                    </div>
                )}
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
                {[
                    { id: "processor", name: "processor", label: "Processor (CPU)" },
                    { id: "ram", name: "ram", label: "Memory (RAM)" },
                    { id: "storage", name: "storage", label: "Storage" },
                    { id: "gpu", name: "gpu", label: "Graphics Card (GPU)" },
                    { id: "screen_size", name: "screen_size", label: "Screen Size & Display" },
                    { id: "condition", name: "condition", label: "Condition" },
                    { id: "video_360_url", name: "video_360_url", label: "360 Video URL (WebM/MP4)" },
                ].map((field) => (
                    <div key={field.id} className="flex flex-col gap-2">
                        <Label className="text-ui-fg-subtle" htmlFor={field.id}>{field.label}</Label>
                        <Input
                            id={field.id}
                            name={field.name}
                            value={(specs as any)[field.name]}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                ))}
            </div>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.before",
})

export default ProductSpecsWidget



