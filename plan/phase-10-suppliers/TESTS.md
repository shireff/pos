# Phase 10 — Payments Tests

## Unit Tests

- Split tender: cash 50 + card 50 = grand_total 100 → valid
- Split tender: cash 50 + card 40 ≠ grand_total 100 → VALIDATION_ERROR (BR-SAL-003)
- Adding a new payment provider requires NO changes to core sale code (Open/Closed principle)
- Customer credit payment: deducts from customer credit balance
- Store credit payment: deducts from stored credit balance
- InstaPay tender recorded with provider_reference field

## Integration Tests

- POST /v1/orders with 3 tender types: cash + Vodafone Cash + store credit → all recorded in payments collection
- Payment method breakdown appears correctly in receipt payload
- Unknown tender type → VALIDATION_ERROR

## E2E Tests

- Complete POS sale with split payment (cash + Vodafone Cash) on Desktop → receipt shows both tenders
- Same on Android
