# Phase 11 — Discounts, Coupons & Taxes Tests

## Unit Tests

### promotions/discount-engine.test.ts

- Item discount 10%: line subtotal 100 → discount 10 → net 90
- Cart discount 50 EGP: applied after item discounts
- Buy-2-Get-1-Free: 3 items at 100 each → discount 100 → total 200
- Quantity break: ≥10 units → 15% discount; <10 → 0%
- Discount amount never exceeds line subtotal (BR-PRC-003)
- Time-based discount: inactive outside configured window → 0%
- Customer-specific discount: only applied when customer matches
- Membership tier discount: applied only for matching tier

### promotions/coupon.test.ts

- Single-use coupon: used once → valid; used twice → BUSINESS_RULE_VIOLATION
- Expired coupon: past expiry date → BUSINESS_RULE_VIOLATION
- Coupon scoped to category: applied only to matching product lines
- Coupon scoped to customer: applied only when customer matches

### tax/tax-engine.test.ts

- Egypt VAT 14% applied to taxable product: tax = price × 0.14
- Tax-exempt product: tax = 0
- Tax rule change does NOT retroactively alter historical order tax (BR-TAX-005)
- ETA module disabled by default: no eta_invoices created unless company.etaEnabled = true
- ETA module enabled: every qualifying order generates eta_invoices record

### promotions/approval.test.ts

- Discount above configured threshold requires approval (APPROVAL_REQUIRED 202)
- Discount at or below threshold applied immediately
- Discount applied above cashier ceiling without approval → 403 PERMISSION_DENIED

## Integration Tests

- POST discount rule → applied correctly in next sale
- Coupon code entered at checkout → coupon validated and applied
- POST /v1/tax-rules creates tax rule, applied to next order
- ETA invoice generated when etaEnabled=true, not generated when false

## E2E Tests

- Create Buy-2-Get-1 promotion on Desktop → apply at POS on Android → correct discount shown
- Enter coupon code on POS → coupon validated → discount applied to cart
- Configure tax rule → complete sale → tax breakdown on receipt
