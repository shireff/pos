# Phase 03 — Products Tests

## Unit Tests

### catalog/unit-conversion.test.ts

- Converting 1 carton (12 pieces) to pieces = 12
- Converting 1 kg to 1000 grams
- Conversion factor change does not rewrite historical stock events
- Price per carton = price per piece × 12 (forward conversion)
- Price per gram = price per kg / 1000 (reverse conversion)
- Zero conversion factor is rejected as VALIDATION_ERROR

### catalog/bundle.test.ts

- Bundle with 3 components: creating sale deducts each component at configured ratio
- Bundle sale blocked when any single component has insufficient stock (BR-INV-004)
- Bundle sale blocked message identifies exactly which component is short
- Bundle with zero quantity component is rejected at creation

### catalog/barcode.test.ts

- EAN-13 checksum validation: valid barcode passes, invalid fails
- Auto-generated barcode passes its own checksum
- Duplicate barcode on same company is rejected with BUSINESS_RULE_VIOLATION
- Barcode format Code128 is accepted

### catalog/product.test.ts

- Archiving a product sets archived_at field (soft delete, never hard delete)
- Archived product cannot be sold (BUSINESS_RULE_VIOLATION)
- Product with no variants cannot be sold (VALIDATION_ERROR)
- Price change on product is a Class B field-merge sync entity

## Integration Tests

### catalog/product-crud.integration.test.ts

- POST /v1/products creates product and returns it with id
- GET /v1/products lists products scoped to caller's companyId (tenant isolation)
- PATCH /v1/products/:id with sync_version mismatch returns 409 CONFLICT
- GET /v1/products?filter[category]=X returns only that category
- Caller without catalog.create permission receives 403 with permissionCode: "catalog.create"
- Product from a different company returns 404 NOT_FOUND (tenant isolation)

### catalog/search.integration.test.ts

- Full-text search on product name returns matching products (Arabic and English)
- Barcode scan lookup returns exact match in <50ms

## Sync Tests

### catalog/product-sync.test.ts

- Two devices edit different fields of the same product offline → both fields applied after sync (Class B merge, no conflict)
- Two devices edit the same price field offline → conflict queued, NOT silently resolved
- Product archived on Device A, edited on Device B → both applied: archived with edited fields; owner notified

## E2E Tests

### catalog/product-e2e.test.ts

- Create product on Desktop → sync to Android → product visible on Android POS screen
- Scan barcode on Android → product loads in cart
- Add unit conversion on Desktop → price updates correctly on Android
- Archive product on Desktop → product no longer appears in Android POS product grid

## Performance Tests

- Product list with 1000 products loads in <200ms
- Barcode lookup returns result in <50ms
