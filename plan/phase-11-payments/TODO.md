# Phase 11 — Discounts, Coupons & Taxes TODO

## Database

- [ ] Create migration `011_discounts_taxes_schema.ts`: discount_rules, coupons, coupon_usages, tax_rules, price_changes collections
- [ ] discount_rules: index (companyId, isActive, type)
- [ ] coupons: unique index (companyId, code), index (companyId, expiresAt)
- [ ] coupon_usages: index (couponId, orderId) — append-only
- [ ] tax_rules: index (companyId, priority)
- [ ] price_changes: index (companyId, productId, status)
- [ ] JSON Schema: discount_rules requires rule_json (object), isActive boolean, type enum(item/cart/category/customer/membership/time_based/buy_x_get_y/quantity_break)
- [ ] JSON Schema: coupons requires code, discountType enum(percentage/fixed), isMultiUse boolean, usageLimit nullable integer

## Domain — Promotions & Tax

- [ ] Implement `DiscountRule` aggregate: id, companyId, name, type, rule_json (the complete rule definition), isActive, validFrom, validUntil, priority, isExclusive
- [ ] Implement rule interpreter domain service: evaluates rule_json against cart context; supports all 8 types; returns array of discount line items
- [ ] Implement rule_json schema for each type: item (productIds, discountType, amount), cart (minimumTotal, discountType, amount), category (categoryIds, discountType, amount), customer (customerIds/tierIds), membership (membershipLevel), time_based (dayOfWeek, timeRange), buy_x_get_y (buyProductId, buyQuantity, getProductId, getQuantity, discountPercent), quantity_break (productId, tiers[])
- [ ] Implement discount stacking: non-exclusive rules stack; first exclusive rule stops evaluation
- [ ] Implement discount exceeds subtotal guard (BR-PRC-003): capped at line subtotal, never produces negative line total
- [ ] Implement `Coupon` aggregate: id, companyId, code, discountType, amount, isMultiUse, usageLimit, expiresAt, scopeType (global/product/category), scopeIds
- [ ] Implement coupon validation: check expiry, check usage count vs limit, check scope match
- [ ] Implement `TaxRule` entity: id, companyId, name, rate (basis points), applicableTo (all/categoryIds/productIds), priority, isActive
- [ ] Implement tax engine: apply rules in priority order; handle compound vs additive; Egypt VAT 14% as default seed rule
- [ ] Implement `PriceChange` entity: id, companyId, productId, variantId?, oldPrice (Money), newPrice (Money), requestedByUserId, approvedByUserId?, status (pending_approval/approved/rejected), requestedAt

## Application — Use Cases

- [ ] `CreateDiscountRuleCommand` + handler: validate rule_json against type-specific schema, persist rule
- [ ] `UpdateDiscountRuleCommand` + handler: validate, update, emit DiscountRuleUpdated
- [ ] `DeactivateDiscountRuleCommand` + handler: set isActive=false
- [ ] `CreateCouponCommand` + handler: validate code uniqueness, validate discount type fields
- [ ] `ValidateCouponCommand` + handler: check expiry, usage limit, scope; return discount amount or rejection reason
- [ ] `RedeemCouponCommand` + handler: record CouponUsage; idempotent per orderId
- [ ] `CreateTaxRuleCommand` + handler: validate rate, persist
- [ ] `EvaluateCartDiscountsQuery` + handler: run all active rules against cart context, return discount breakdown
- [ ] `GetApplicableTaxesQuery` + handler: return applicable taxes for cart lines
- [ ] `RequestPriceChangeCommand` + handler: validate old/new price, check threshold — auto-approve if below, else create pending_approval record
- [ ] `ApprovePriceChangeCommand` + handler: requires pricing.change.approve, apply new price to product

## API Endpoints

- [ ] `GET /v1/discount-rules` — list with filters: type, isActive
- [ ] `POST /v1/discount-rules` — create
- [ ] `PATCH /v1/discount-rules/:id` — update
- [ ] `POST /v1/discount-rules/:id/deactivate`
- [ ] `GET /v1/coupons` — list
- [ ] `POST /v1/coupons` — create
- [ ] `POST /v1/coupons/validate` — body: code, cartContext → returns discount amount
- [ ] `GET /v1/tax-rules` — list
- [ ] `POST /v1/tax-rules` — create
- [ ] `POST /v1/price-changes` — request price change
- [ ] `POST /v1/price-changes/:id/approve`
- [ ] `POST /v1/price-changes/:id/reject`

## Validation (Zod)

- [ ] `CreateDiscountRuleSchema`: name string, type enum, rule_json object (validated against type-discriminated union), validFrom ISO date, validUntil optional ISO date
- [ ] `CreateCouponSchema`: code string alphanumeric, discountType enum, amount positive integer, isMultiUse boolean, usageLimit optional positive integer, expiresAt optional ISO date
- [ ] `ValidateCouponSchema`: code string, cartTotal positive integer, customerId optional, lineItems optional array

## Permissions

- [ ] Enforce `discounts.view` on GET discount endpoints
- [ ] Enforce `discounts.create` on POST discount-rules and coupons
- [ ] Enforce `discounts.edit` on PATCH and deactivate
- [ ] Enforce `discounts.approve` on price change approve endpoint
- [ ] Enforce `tax.view` on GET tax-rules
- [ ] Enforce `tax.edit` on POST/PATCH tax-rules
- [ ] Enforce `pricing.change` on request price change
- [ ] Enforce `pricing.change.approve` on approve

## Sync

- [ ] discount_rules: Class B field-level HLC merge
- [ ] coupons: Class B; coupon_usages Class A (append-only)
- [ ] tax_rules: Class B

## Desktop UI

- [ ] Discount Rule Builder (`apps/desktop/src/features/discounts/DiscountRuleBuilderPage.tsx`): type selector drives dynamic form sections based on rule type; no raw JSON editing for standard types
- [ ] Coupon Management table: code, type, usage count/limit, expiry, active badge; create coupon dialog
- [ ] Tax Rule editor: priority-ordered list, rate inputs, scope selectors
- [ ] Price Change request form and approval list

## Android UI

- [ ] Same screens using shared components

## Tests

- [ ] See TESTS.md
