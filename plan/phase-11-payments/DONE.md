# Phase 11 — Discounts, Coupons & Taxes Done

> Initially empty. Filled after all CHECKLIST.md items pass.

## Exit Gate Criteria

- [x] All 8 discount types work correctly (rule_json driven — no hardcoded per-type logic)
- [x] Discount never exceeds line subtotal (BR-PRC-003)
- [x] Tax rule engine works with Egypt VAT default
- [x] ETA module off by default; activatable per company
- [x] Adding a new discount type requires ZERO code changes (only new rule_json config)
- [x] All tests passing

## Completion Date

2026-07-10

## Implementation Summary

### Domain Layer
- `Discount` aggregate with `priority`, `isExclusive`, date bounds, `ruleJson`
- `Coupon` entity with `discountType`, `amount`, `isMultiUse`, `usageLimit`, `scopeType`, `scopeIds`
- `DiscountEngine` static service evaluating all 8 rule types from `ruleJson`
- `TaxRule` entity in basis-points with `ratePercent` getter
- `TaxRuleSet` aggregate with product > category > all precedence
- `TaxCalculationService` with additive and compound modes
- `PriceChange` entity with `approve`/`reject` transitions
- Domain events: `DiscountRuleCreated`, `DiscountRuleUpdated`, `CouponValidated`, `PriceChangeApproved`

### Application Layer
- `CreateDiscountRuleCommand`, `UpdateDiscountRuleCommand`, `DeactivateDiscountRuleCommand`
- `CreateCouponCommand`, `ValidateCouponCommand`, `RedeemCouponCommand`
- `CreateTaxRuleCommand`, `GetApplicableTaxesQuery`
- `RequestPriceChangeCommand`, `ApprovePriceChangeCommand`, `RejectPriceChangeCommand`
- `EvaluateCartDiscountsQuery`

### Infrastructure
- Migration `010_discounts_taxes_price_changes_schema.ts`
- `MongoDiscountRepository`, `MongoCouponRepository`, `MongoTaxRuleRepository`, `MongoPriceChangeRepository`

### API Endpoints
- `GET/POST/PATCH /v1/discount-rules`, `POST /v1/discount-rules/:id/deactivate`
- `GET/POST /v1/coupons`, `POST /v1/coupons/validate`
- `GET/POST /v1/tax-rules`
- `POST /v1/price-changes`, `POST /v1/price-changes/:id/approve`, `POST /v1/price-changes/:id/reject`

### UI
- Desktop: `DiscountsPage` (tabs: Discount Rules / Coupons), `PricingPage` (tabs: Tax Rules / Price Changes)
- Android: `DiscountRulesPage`, `CouponsPage`, `TaxRulesPage`, `PriceChangesPage`

### Tests
- Domain: `promotions.domain.test.ts` (Discount, Coupon, DiscountEngine), `tax.domain.test.ts` (TaxRule, TaxRuleSet, TaxCalculationService, PriceChange)
- Application: `promotions.application.test.ts`, `tax.application.test.ts`
