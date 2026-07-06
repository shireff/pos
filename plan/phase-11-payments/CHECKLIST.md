# Phase 11 — Discounts, Coupons & Taxes Checklist

A phase is **NOT complete** until every item below is checked.

## Domain

- [ ] DiscountRule aggregate with rule_json interpreter for all 8 types implemented
- [ ] Rule interpreter contains NO hardcoded per-type business logic — rule_json drives all behavior
- [ ] Discount exceeds subtotal guard (BR-PRC-003) prevents negative line totals
- [ ] Discount stacking vs. exclusive logic works correctly
- [ ] Coupon validation: expiry check, usage limit check, scope check all implemented
- [ ] TaxRule engine applies rules in priority order

## Application

- [ ] All 11 commands and 2 queries implemented with handlers
- [ ] Price change approval threshold: auto-approve below, block above until approved

## API

- [ ] All endpoints with permission enforcement tested
- [ ] POST /v1/coupons/validate returns discount or rejection reason correctly

## Tax Engine

- [ ] Egypt VAT 14% seeded as default rule
- [ ] Tax applies correctly to test cart
- [ ] ETA fields present in order/invoice documents
- [ ] ETA submission is DISABLED by default (not enabled until Phase 18 activation)

## Sync

- [ ] discount_rules: Class B sync
- [ ] coupon_usages: Class A sync (append-only)
- [ ] tax_rules: Class B sync

## Desktop UI

- [ ] Discount Rule Builder renders dynamic form per rule type
- [ ] No raw JSON editor visible for standard rule types
- [ ] Coupon table with usage count and expiry renders
- [ ] Tax rule editor works

## Android UI

- [ ] Same screens on Android

## Tests

- [ ] All 8 discount rule types evaluated correctly (one test per type)
- [ ] Discount exceeds subtotal guard test passes
- [ ] Coupon single-use limit test passes
- [ ] Tax priority ordering test passes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
