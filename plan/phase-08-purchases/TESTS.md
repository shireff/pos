# Phase 08 — Customers Tests

## Unit Tests

- Customer identified by phone number: search returns correct customer
- Loyalty points are a derived event stream — balance = sum of accrual/redemption events (never a mutable field)
- Concurrent redemptions on two devices → both events applied; balance never goes below 0
- Loyalty points reversed proportionally on return (BR-SAL-007): 50% return → 50% points reversed
- Guest/anonymous sale is NOT attributed to a customer record retroactively (BR-CUS-001)
- Credit ledger: charge entry + payment entry → correct outstanding balance
- Customer with outstanding credit beyond credit limit is flagged

## Integration Tests

- POST /v1/customers creates customer with phone number
- GET /v1/customers?phone=01012345678 returns matching customer
- POST /v1/customers/:id/loyalty/redeem: points deducted, redemption event logged
- Redemption that would create negative balance: blocked with BUSINESS_RULE_VIOLATION
- Credit reminder: customer with overdue balance triggers notification (Notifications.md §3)

## Sync Tests

- Customer profile fields: different-field edits from two devices → both applied (Class B)
- Loyalty redemption from two devices simultaneously → both events applied (Class A), balance = sum

## E2E Tests

- Cashier identifies customer by phone → customer loaded on POS → sale attributed → loyalty points shown
- Owner views Customer Profile → sees purchase history, loyalty balance, credit ledger
- Return on sale with loyalty points → points reversed automatically
