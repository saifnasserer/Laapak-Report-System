---
name: medusa-laapak-management
description: Experts-level management of the Laapak Medusa V2 system. Handles backend customizations, storefront data fetching, laptop specifications (metadata), Google Reviews DB caching, and WooCommerce migration workflows.
---

# Laapak Medusa Management

This skill provides the cognitive foundation for working with the Laapak Reports System's Medusa V2 backend and Next.js storefront.

## When to Use
- Working on the Medusa V2 backend (`laapak-backend`)
- Modifying the Next.js storefront (`laapak-backend-storefront`)
- Managing laptop specifications stored in product metadata
- Troubleshooting Admin widgets or React Query context issues in the dashboard
- Running migration scripts from WooCommerce
- Working with the Google Reviews cache system

## System Architecture

### 1. Backend (Medusa V2)
**Path:** `/media/saif/brain/Projects/Laapak-Softwares/Laapak-Report-System/Laapak-React-Site/laapak-backend`

- **Tech Stack:** Medusa V2, PostgreSQL, Redis.
- **Laptop Specifications:** Stored in the `metadata` field of the `Product` entity under the `specs` key.
- **Admin Extension:** 
    - `src/admin/widgets/product-specs-widget.tsx`: A custom widget placed `before` product details.
    - **Stability Note:** Avoid using `@tanstack/react-query` hooks (like `useMutation`) directly in widgets if they cause "No QueryClient set" errors. Use plain async functions with the Medusa SDK instead.
- **SDK:** `src/admin/lib/sdk.ts` provides the admin client instance.

### 2. Storefront (Next.js)
**Path:** `/media/saif/brain/Projects/Laapak-Softwares/Laapak-Report-System/Laapak-React-Site/laapak-backend-storefront`

- **Data Fetching:** `src/lib/data/products.ts` -> `listProducts`.
    - **CRITICAL:** Always include `+metadata` in the `fields` query parameter to ensure specs are available.
- **Display Components:**
    - **Summary:** `src/modules/products/templates/product-info/index.tsx` (Renders key specs in Arabic under the title).
    - **Description Parsing:** `src/modules/products/components/product-description-table/index.tsx` (Parses plain text descriptions that contain double newlines into structured HTML tables for a premium look).
    - **Details:** `src/modules/products/components/product-tabs/index.tsx` (Contains the "Technical Specifications" accordion tab).

## Common Workflows

### Running the Development Environment
```bash
# Ensure Database Services are Running
# If the backend fails with "Pg connection failed", check if the containers are stopped.
docker start backend_postgres_1 backend_redis_1

# Backend
cd .../laapak-backend && npm run dev

# Storefront
cd .../laapak-backend-storefront && npm run dev
```

### Updating Laptop Specifications
1. **Admin Panel:** Select a product -> "Laptop Specifications" widget -> "Edit Specs" -> Edit values -> "Save".
2. **Programmatic:** Use `sdk.admin.product.update(id, { metadata: { specs: { ... } } })`.

### Migration from WooCommerce
- Scripts are located in `laapak-backend/src/scripts/`.
- `import-woocommerce.ts`: Main entry point for syncing products, extracting specs from Arabic descriptions, and handling media.

### Creating a New Custom Module
Follow these five steps every time:
1. **Model:** `src/modules/<name>/models/<entity>.ts` using `model.define("table_name", { ... })`
2. **Service:** `src/modules/<name>/service.ts` using `class extends MedusaService({ Entity })`
3. **Index:** `src/modules/<name>/index.ts` exporting `Module("moduleName", { service })`
4. **Register:** Add `{ resolve: "./src/modules/<name>" }` to `modules[]` in `medusa-config.ts`
5. **Migrate:** `npx medusa db:generate <moduleName> && npx medusa db:migrate`

## Implementation Patterns

### Laptop Specs Interface (Metadata)
Specifications follow this structure in the database:
```json
{
  "specs": {
    "processor": "Intel Core i7...",
    "ram": "16 GB...",
    "storage": "512 GB SSD...",
    "gpu": "NVIDIA...",
    "screen_size": "15.6 inch...",
    "condition": "Excellent..."
  }
}
```

### Storefront Fetching Pattern
When fetching products for the storefront, ensure the query looks like this:
```typescript
const { products } = await sdk.store.product.list({
  fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata"
})
```

### Google Reviews DB Caching Pattern
**Architecture:** `Google API → (12h job) → Medusa DB → Store API → Next.js storefront`
- **Module:** `src/modules/google-reviews/` — `GoogleReviewCache` entity with `reviews` (JSON), `rating`, `user_ratings_total`, `last_synced_at`
- **Store API:** `GET /store/google-reviews` — public endpoint, reads from DB, no Google call
- **Scheduled Job:** `src/jobs/sync-google-reviews.ts` — cron `0 */12 * * *`, upserts single cache row
- **Storefront:** `src/lib/data/google-reviews.ts` — calls Medusa API, NOT Google directly
- **Seeding (first run):** `npx medusa exec src/jobs/sync-google-reviews.ts`
- **Required env vars (backend):** `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`

## ⚠️ Known Issues & Critical Gotchas

### @medusajs/icons — Hardcoded SVG Sizing (CRITICAL)
All icons from `@medusajs/icons` have **hardcoded `width="15" height="15"`** directly on the `<svg>` element. This means:
- Tailwind `w-*`/`h-*` classes have **NO effect** — they are overridden by the inline SVG attribute
- Even passing `width={48}` as a prop is unreliable in some rendering paths
- **The only reliable fix:** Replace `@medusajs/icons` with standard inline `<svg>` elements

**Pattern for replacement:**
```tsx
// ❌ BROKEN — Tailwind classes and size props don't work reliably
import { User } from "@medusajs/icons"
<User className="w-6 h-6" />

// ✅ CORRECT — Use inline SVG with explicit width/height attributes
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" strokeWidth="1.5"
     strokeLinecap="round" strokeLinejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
  <circle cx="12" cy="7" r="4" />
</svg>
```

**Files already fixed (all use inline SVGs):**
- `src/modules/home/components/laapak-process/index.tsx` — process step icons
- `src/modules/layout/templates/nav/index.tsx` — User, ShoppingCart
- `src/modules/layout/components/cart-dropdown/index.tsx` — ShoppingCart
- `src/modules/home/components/hero/index.tsx` — ArrowLeftMini
- `src/modules/home/components/laptop-selector/index.tsx` — CurrencyDollar, Adjustments, ChatBubbleLeftRight
- `src/modules/store/components/search-bar/index.tsx` — MagnifyingGlassMini

### Absolute Positioning of Badges Inside Circles
When using `absolute` positioned badge elements (e.g., step number badges) on top of icon circles:
- The `relative` container for the badge must be a **dedicated wrapper div**, NOT reused from a `z-10` positioned parent
- `z-10` alone does not create a positioning context without `relative`
- **Pattern:**
```tsx
<div className="relative mb-6">  {/* Dedicated relative wrapper */}
  <div style={{ width: 128, height: 128 }} className="rounded-full ...">
    {/* icon */}
  </div>
  <div className="absolute -top-2 -right-2 ...">1</div>  {/* Badge */}
</div>
```

## Troubleshooting & Best Practices
- **Admin Crashes:** If a widget crashes the product page with "An error occurred", check for missing React context (e.g., QueryClient). Refactor to use native SDK calls.
- **Backend Startup Errors:** If `npm run dev` in `laapak-backend` crashes with `KnexTimeoutError: SELECT 1` or `Pg connection failed`, it means the backend database containers are stopped. Run `docker start backend_postgres_1 backend_redis_1` to start Medusa's dedicated backend dependencies.
- **Missing Specs:** Ensure the `metadata` field is explicitly requested in the Medusa API call.
- **RTL Issues:** The storefront uses RTL by default. Use `laapak-green` and `laapak-gray` tokens for brand consistency.
- **Google Reviews empty:** If `/store/google-reviews` returns 404, the cache hasn't been seeded yet. Run `npx medusa exec src/jobs/sync-google-reviews.ts` from the backend directory.
