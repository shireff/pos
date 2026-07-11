# Phase 11 — Discounts, Coupons & Taxes Checklist

A phase is **NOT complete** until every item below is checked.

## Domain

- [x] DiscountRule aggregate with rule_json interpreter for all 8 types implemented
- [x] Rule interpreter contains NO hardcoded per-type business logic — rule_json drives all behavior
- [x] Discount exceeds subtotal guard (BR-PRC-003) prevents negative line totals
- [x] Discount stacking vs. exclusive logic works correctly
- [x] Coupon validation: expiry check, usage limit check, scope check all implemented
- [x] TaxRule engine applies rules in priority order

## Application

- [x] All 11 commands and 2 queries implemented with handlers
- [x] Price change approval threshold: auto-approve below, block above until approved

## API

- [x] All endpoints with permission enforcement tested
- [x] POST /v1/coupons/validate returns discount or rejection reason correctly

## Tax Engine

- [x] Egypt VAT 14% seeded as default rule
- [x] Tax applies correctly to test cart
- [x] ETA fields present in order/invoice documents
- [x] ETA submission is DISABLED by default (not enabled until Phase 18 activation)

## Sync

- [x] discount_rules: Class B sync
- [x] coupon_usages: Class A sync (append-only)
- [x] tax_rules: Class B sync

## Desktop UI

- [x] Discount Rule Builder renders dynamic form per rule type
- [x] No raw JSON editor visible for standard rule types
- [x] Coupon table with usage count and expiry renders
- [x] Tax rule editor works

## Android UI

- [x] Same screens on Android

## Tests

- [x] All 8 discount rule types evaluated correctly (one test per type)
- [x] Discount exceeds subtotal guard test passes
- [x] Coupon single-use limit test passes
- [x] Tax priority ordering test passes

## Quality Gates

- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] All tests passing in CI
