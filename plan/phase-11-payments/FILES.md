# Phase 11 — Discounts, Coupons & Taxes Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/011_discounts_taxes_schema.ts
packages/infrastructure/mongodb/schemas/discount_rules.schema.json
packages/infrastructure/mongodb/schemas/coupons.schema.json
packages/infrastructure/mongodb/schemas/coupon_usages.schema.json
packages/infrastructure/mongodb/schemas/tax_rules.schema.json
packages/infrastructure/mongodb/schemas/price_changes.schema.json
packages/infrastructure/mongodb/seeds/default-tax-rules.seed.ts
```

## Domain — Promotions

```
packages/domain/promotions/src/aggregates/discount-rule.aggregate.ts
packages/domain/promotions/src/aggregates/discount-rule.aggregate.test.ts
packages/domain/promotions/src/aggregates/coupon.aggregate.ts
packages/domain/promotions/src/aggregates/coupon.aggregate.test.ts
packages/domain/promotions/src/entities/coupon-usage.entity.ts
packages/domain/promotions/src/entities/price-change.entity.ts
packages/domain/promotions/src/domain-services/rule-interpreter.service.ts
packages/domain/promotions/src/domain-services/rule-interpreter.service.test.ts
packages/domain/promotions/src/domain-services/discount-guard.service.ts
packages/domain/promotions/src/domain-services/discount-guard.service.test.ts
packages/domain/promotions/README.md
packages/domain/promotions/src/index.ts
```

## Domain — Tax

```
packages/domain/tax/src/entities/tax-rule.entity.ts
packages/domain/tax/src/domain-services/tax-engine.service.ts
packages/domain/tax/src/domain-services/tax-engine.service.test.ts
packages/domain/tax/README.md
packages/domain/tax/src/index.ts
```

## Application — Promotions & Tax Use Cases

```
packages/application/promotions/src/create-discount-rule/create-discount-rule.command.ts
packages/application/promotions/src/create-discount-rule/create-discount-rule.handler.ts
packages/application/promotions/src/update-discount-rule/update-discount-rule.command.ts
packages/application/promotions/src/update-discount-rule/update-discount-rule.handler.ts
packages/application/promotions/src/deactivate-discount-rule/deactivate-discount-rule.command.ts
packages/application/promotions/src/deactivate-discount-rule/deactivate-discount-rule.handler.ts
packages/application/promotions/src/create-coupon/create-coupon.command.ts
packages/application/promotions/src/create-coupon/create-coupon.handler.ts
packages/application/promotions/src/validate-coupon/validate-coupon.command.ts
packages/application/promotions/src/validate-coupon/validate-coupon.handler.ts
packages/application/promotions/src/redeem-coupon/redeem-coupon.command.ts
packages/application/promotions/src/redeem-coupon/redeem-coupon.handler.ts
packages/application/promotions/src/request-price-change/request-price-change.command.ts
packages/application/promotions/src/request-price-change/request-price-change.handler.ts
packages/application/promotions/src/approve-price-change/approve-price-change.command.ts
packages/application/promotions/src/approve-price-change/approve-price-change.handler.ts
packages/application/promotions/src/evaluate-cart-discounts/evaluate-cart-discounts.query.ts
packages/application/promotions/src/evaluate-cart-discounts/evaluate-cart-discounts.handler.ts
packages/application/tax/src/create-tax-rule/create-tax-rule.command.ts
packages/application/tax/src/create-tax-rule/create-tax-rule.handler.ts
packages/application/tax/src/get-applicable-taxes/get-applicable-taxes.query.ts
packages/application/tax/src/get-applicable-taxes/get-applicable-taxes.handler.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/discount-rule.repository.ts
packages/infrastructure/mongodb/repositories/coupon.repository.ts
packages/infrastructure/mongodb/repositories/coupon-usage.repository.ts
packages/infrastructure/mongodb/repositories/tax-rule.repository.ts
packages/infrastructure/mongodb/repositories/price-change.repository.ts
```

## API (Backend)

```
apps/backend/src/http/discounts/discounts.controller.ts
apps/backend/src/http/discounts/discounts.controller.test.ts
apps/backend/src/http/discounts/discounts.schemas.ts
apps/backend/src/http/taxes/taxes.controller.ts
apps/backend/src/http/taxes/taxes.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/discounts/DiscountRuleBuilder.tsx
packages/ui-components/src/discounts/CouponTable.tsx
packages/ui-components/src/discounts/PriceChangeRequestForm.tsx
packages/ui-components/src/taxes/TaxRuleEditor.tsx
packages/ui-components/src/discounts/index.ts
```

## Desktop UI

```
apps/desktop/src/features/discounts/DiscountRuleBuilderPage.tsx
apps/desktop/src/features/discounts/CouponManagementPage.tsx
apps/desktop/src/features/discounts/PriceChangesPage.tsx
apps/desktop/src/features/taxes/TaxRulesPage.tsx
```

## Android UI

```
apps/android/src/features/discounts/DiscountRuleBuilderPage.tsx
apps/android/src/features/discounts/CouponManagementPage.tsx
```
