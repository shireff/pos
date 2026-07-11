# Phase 11 — Discounts, Coupons & Taxes

## Purpose

Rule-engine-driven discount and coupon system plus tax engine. No per-type business logic is hardcoded — every discount and coupon behavior is driven by a rule_json structure interpreted by a generic rule evaluator. Egypt VAT is the default tax configuration. ETA e-invoice fields are present in the data model but the module is disabled by default and activated per-company by Owner in Phase 18.

## Scope

- **Database**: discount_rules, coupons, coupon_usages, tax_rules collections with rule_json as the universal behavior driver
- **Domain**: DiscountRule aggregate with rule_json interpreter, Coupon aggregate, CouponUsage entity, TaxRule entity, PriceChange entity
- **Business Logic**: rule types (item/cart/category/customer/membership/time-based/Buy-X-Get-Y/quantity-break), coupon types (percentage/fixed amount, single/multi-use, expiry date, product/category scope), discount stack vs. exclusive logic, discount exceeds subtotal guard (BR-PRC-003 — discount capped at item subtotal), price change approval workflow (changes above configurable threshold require Manager approval), tax rule priority ordering, ETA invoice data model (field present, submission disabled)
- **Application**: CreateDiscountRuleCommand, UpdateDiscountRuleCommand, DeactivateDiscountRuleCommand, CreateCouponCommand, ValidateCouponCommand, RedeemCouponCommand, CreateTaxRuleCommand, EvaluateCartDiscountsQuery, GetApplicableTaxesQuery, RequestPriceChangeCommand, ApprovePriceChangeCommand
- **API**: GET/POST/PATCH /v1/discount-rules, POST /v1/coupons/validate, GET/POST/PATCH /v1/tax-rules, POST /v1/price-changes, POST /v1/price-changes/:id/approve
- **Permissions**: discounts.view, discounts.create, discounts.edit, discounts.approve, coupons.view, coupons.create, coupons.redeem, tax.view, tax.edit, pricing.change, pricing.change.approve
- **Sync**: Class B field-level HLC merge for rules; coupon_usages are Class A (append-only)
- **Desktop UI**: Discount Rule Builder (visual form for constructing rule_json without raw JSON editing), Coupon Management table (status, usage count, expiry), Tax Rule editor, Price Change request screen
- **Android UI**: same screens using shared components

## Expected Output

A working pricing engine where:

- All 8 rule types are evaluated correctly via the rule_json interpreter
- Discount exceeds subtotal guard prevents negative line totals
- Coupon redemption enforces single-use limits and expiry dates
- Price changes above threshold are blocked until approved
- Tax engine applies rules in correct priority order
- ETA fields are present in order/invoice documents but ETA submission is disabled

## Documents Referenced

- PRD.md §4.8–4.9
- Database.md §2.14–2.15
- Business_Rules.md §4–5

## Included Modules

- `packages/domain/promotions` — full rule engine implementation
- `packages/domain/tax` — full tax rule engine
- `packages/application/promotions/*`
- `packages/application/tax/*`
- `packages/infrastructure/mongodb/migrations/010_discounts_taxes_price_changes_schema.ts`
- `apps/backend/src/app/api/v1/discount-rules/*`
- `apps/backend/src/app/api/v1/coupons/*`
- `apps/backend/src/app/api/v1/tax-rules/*`
- `apps/backend/src/app/api/v1/price-changes/*`
- `packages/ui-components/src/` (shared Modal, Field, StatusBadge, Icon)
- `apps/desktop/src/features/discounts/*`
- `apps/desktop/src/features/pricing/*`
- `apps/android/src/features/promotions/*`
- `apps/android/src/features/pricing/*`
