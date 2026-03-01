# Arabic Specification Extraction Logic

This logic is used to parse technical specifications from laptop descriptions (often in Arabic) during the migration from WooCommerce or other sources.

## Regex Patterns

The following patterns are optimized for the typical structure found in Laapak's WooCommerce catalog:

```typescript
const processorRegex = /(?:^|\n)\s*المعالج\s*[\r\n]+[-•]*\s*([^\n]+)/i
const ramRegex = /(?:^|\n)\s*الرام\s*[\r\n]+[-•]*\s*([^\n]+)/i
const storageRegex = /(?:^|\n)\s*التخزين\s*[\r\n]+[-•]*\s*([^\n]+)/i
const gpuRegex = /(?:^|\n)\s*كارت الشاشة\s*[\r\n]+[-•]*\s*([^\n]+)/i
const screenRegex = /(?:^|\n)\s*الشاشة\s*[\r\n]+[-•]*\s*([^\n]+)/i
const conditionRegex = /(?:^|\n)\s*الحالة\s*[\r\n]+[-•]*\s*([^\n]+)/i
```

## Implementation Example

```typescript
const extractSpecs = (description: string) => {
    const specs: Record<string, string> = {
        processor: "",
        ram: "",
        storage: "",
        gpu: "",
        screen_size: "",
        condition: "",
    }

    const matches = [
        { key: "processor", regex: processorRegex },
        { key: "ram", regex: ramRegex },
        { key: "storage", regex: storageRegex },
        { key: "gpu", regex: gpuRegex },
        { key: "screen_size", regex: screenRegex },
        { key: "condition", regex: conditionRegex },
    ]

    matches.forEach(({ key, regex }) => {
        const match = description?.match(regex)
        if (match) {
            specs[key] = match[1].trim().replace(/^[-•]\s*/, "")
        }
    })

    return specs
}
```

## Expected Description Format
The regex expects the key (e.g., "المعالج") followed by a newline and then the value, potentially prefixed with a bullet point:

```text
المعالج
• Intel Core i7-11800H

الرام
- 16 GB DDR4
```

## Error Handling & Defaults
- If a match is not found, the field should remain an empty string `""`.
- The `replace(/^[-•]\s*/, "")` is crucial for cleaning up legacy bullet points.
