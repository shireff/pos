# Phase 11 — Discounts, Coupons & Taxes TODO

## Database

- [x] Create migration `010_discounts_taxes_price_changes_schema.ts`: discount_rules, coupons, coupon_usages, tax_rules, price_changes collections
- [x] discount_rules: index (companyId, isActive, type)
- [x] coupons: unique index (companyId, code), index (companyId, expiresAt)
- [x] coupon_usages: index (couponId, orderId) — append-only
- [x] tax_rules: index (companyId, priority)
- [x] price_changes: index (companyId, productId, status)
- [x] JSON Schema: discount_rules requires rule_json (object), isActive boolean, type enum(item/cart/category/customer/membership/time_based/buy_x_get_y/quantity_break)
- [x] JSON Schema: coupons requires code, discountType enum(percentage/fixed), isMultiUse boolean, usageLimit nullable integer

## Domain — Promotions & Tax

- [x] Implement `DiscountRule` aggregate: id, companyId, name, type, rule_json (the complete rule definition), isActive, validFrom, validUntil, priority, isExclusive
- [x] Implement rule interpreter domain service: evaluates rule_json against cart context; supports all 8 types; returns array of discount line items
- [x] Implement rule_json schema for each type: item (productIds, discountType, amount), cart (minimumTotal, discountType, amount), category (categoryIds, discountType, amount), customer (customerIds/tierIds), membership (membershipLevel), time_based (dayOfWeek, timeRange), buy_x_get_y (buyProductId, buyQuantity, getProductId, getQuantity, discountPercent), quantity_break (productId, tiers[])
- [x] Implement discount stacking: non-exclusive rules stack; first exclusive rule stops evaluation
- [x] Implement discount exceeds subtotal guard (BR-PRC-003): capped at line subtotal, never produces negative line total
- [x] Implement `Coupon` aggregate: id, companyId, code, discountType, amount, isMultiUse, usageLimit, expiresAt, scopeType (global/product/category), scopeIds
- [x] Implement coupon validation: check expiry, check usage count vs limit, check scope match
- [x] Implement `TaxRule` entity: id, companyId, name, rate (basis points), applicableTo (all/categoryIds/productIds), priority, isActive
- [x] Implement tax engine: apply rules in priority order; handle compound vs additive; Egypt VAT 14% as default seed rule
- [x] Implement `PriceChange` entity: id, companyId, productId, variantId?, oldPrice (Money), newPrice (Money), requestedByUserId, approvedByUserId?, status (pending_approval/approved/rejected), requestedAt

## Application — Use Cases

- [x] `CreateDiscountRuleCommand` + handler: validate rule_json against type-specific schema, persist rule
- [x] `UpdateDiscountRuleCommand` + handler: validate, update, emit DiscountRuleUpdated
- [x] `DeactivateDiscountRuleCommand` + handler: set isActive=false
- [x] `CreateCouponCommand` + handler: validate code uniqueness, validate discount type fields
- [x] `ValidateCouponCommand` + handler: check expiry, usage limit, scope; return discount amount or rejection reason
- [x] `RedeemCouponCommand` + handler: record CouponUsage; idempotent per orderId
- [x] `CreateTaxRuleCommand` + handler: validate rate, persist
- [x] `EvaluateCartDiscountsQuery` + handler: run all active rules against cart context, return discount breakdown
- [x] `GetApplicableTaxesQuery` + handler: return applicable taxes for cart lines
- [x] `RequestPriceChangeCommand` + handler: validate old/new price, check threshold — auto-approve if below, else create pending_approval record
- [x] `ApprovePriceChangeCommand` + handler: requires pricing.change.approve, apply new price to product

## API Endpoints

- [x] `GET /v1/discount-rules` — list with filters: type, isActive
- [x] `POST /v1/discount-rules` — create
- [x] `PATCH /v1/discount-rules/:id` — update
- [x] `POST /v1/discount-rules/:id/deactivate`
- [x] `GET /v1/coupons` — list
- [x] `POST /v1/coupons` — create
- [x] `POST /v1/coupons/validate` — body: code, cartContext → returns discount amount
- [x] `GET /v1/tax-rules` — list
- [x] `POST /v1/tax-rules` — create
- [x] `POST /v1/price-changes` — request price change
- [x] `POST /v1/price-changes/:id/approve`
- [x] `POST /v1/price-changes/:id/reject`

## Validation (Zod)

- [x] `CreateDiscountRuleSchema`: name string, type enum, rule_json object (validated against type-discriminated union), validFrom ISO date, validUntil optional ISO date
- [x] `CreateCouponSchema`: code string alphanumeric, discountType enum, amount positive integer, isMultiUse boolean, usageLimit optional positive integer, expiresAt optional ISO date
- [x] `ValidateCouponSchema`: code string, cartTotal positive integer, customerId optional, lineItems optional array

## Permissions

- [x] Enforce `discounts.view` on GET discount endpoints
- [x] Enforce `discounts.create` on POST discount-rules and coupons
- [x] Enforce `discounts.edit` on PATCH and deactivate
- [x] Enforce `discounts.approve` on price change approve endpoint
- [x] Enforce `tax.view` on GET tax-rules
- [x] Enforce `tax.edit` on POST/PATCH tax-rules
- [x] Enforce `pricing.change` on request price change
- [x] Enforce `pricing.change.approve` on approve

## Sync

- [x] discount_rules: Class B field-level HLC merge
- [x] coupons: Class B; coupon_usages Class A (append-only)
- [x] tax_rules: Class B

## Desktop UI

- [x] Discount Rule Builder (`apps/desktop/src/features/discounts/DiscountRuleBuilderPage.tsx`): type selector drives dynamic form sections based on rule type; no raw JSON editing for standard types
- [x] Coupon Management table: code, type, usage count/limit, expiry, active badge; create coupon dialog
- [x] Tax Rule editor: priority-ordered list, rate inputs, scope selectors
- [x] Price Change request form and approval list

## Android UI

- [x] Same screens using shared components

## Tests

- [x] Domain tests: Discount, Coupon, DiscountEngine, TaxRule, TaxRuleSet, PriceChange
- [x] Application tests: promotions commands/queries, tax commands/queries

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation
