# Implementation Plan: Dynamic & Customizable SEO System

Implement dynamic store & product level SEO, customizable Meta Tags in Admin Settings, live Google/WhatsApp social card previews, Schema.org JSON-LD structured data, and direct product link sharing.

## User Review Required
- **No breaking changes**: All existing stores automatically fall back to current auto-generated titles/descriptions.

## Proposed Changes

### 1. Types & Data Normalization
- `src/types/index.ts`: Add `seo` to `StoreSettings`.
- `src/lib/tenant.ts`: Update `DEFAULT_SEO` and `normalizeStoreSettings` to sanitize `title`, `description`, `ogImageUrl`, `keywords`.

### 2. Admin Settings Form
- `src/components/admin/store-settings-form.tsx`:
  - Add `seo` fields to `StoreForm` and state.
  - Add image upload with compression for `ogImageUrl`.
  - Add text inputs with character count indicators for `title` (50-60) and `description` (120-160).
  - Add keyword tag/comma input.
  - Add visual live preview cards for Google Search result and WhatsApp chat card.

### 3. Storefront SSR & Metadata
- `src/app/[slug]/page.tsx`:
  - Enhance `generateMetadata`:
    - Support store-level custom SEO with intelligent fallback.
    - Support product-level metadata if `searchParams.p` is provided.
  - Add Schema.org JSON-LD script for rich search snippets (`Store`, `LocalBusiness`, `OfferCatalog`).

### 4. Direct Product Sharing & Auto-Open
- `src/components/vitrine/product-detail-modal.tsx`:
  - Add "Compartilhar Produto" button (Web Share API + fallback copy link to clipboard).
- `src/components/vitrine/catalog-experience.tsx`:
  - Read `?p=` URL parameter and auto-open the corresponding product modal on mount.

## Verification Plan
1. `node scripts/test-seo-tenant.mjs` - Verify `normalizeStoreSettings` handles empty, partial, and full SEO inputs.
2. `npx tsc --noEmit` - Verify type safety.
3. `npm run build` - Full production build test.
4. Git commit.
