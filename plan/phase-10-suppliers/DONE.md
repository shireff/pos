# Phase 10 — Payments Done

> Initially empty. Filled after all CHECKLIST.md items pass.

## Exit Gate Criteria

- [x] All 10 tender types work in split payment
- [x] Split tender sum validated == grand_total before sale completes
- [x] Adding a new payment provider requires zero changes to core sale code
- [x] All tests passing

## Completion Date

2026-07-10

## Implementation Summary

### Domain Layer
- `IPaymentProvider` interface with `process`, `refund`, `getStatus` methods
- `SplitTender` value object with static validation
- `PaymentMethod` entity
- `PaymentTransaction` entity with status tracking
- `PaymentCompleted` and `PaymentRefunded` domain events

### Application Layer
- `ProcessPaymentCommand` + handler
- `RefundPaymentCommand` + handler
- `GetPaymentMethodsQuery` + handler
- Extended `SalesRepos` interface with payment repositories

### Infrastructure
- Migration `010_payments_schema.ts` with `payment_methods`, `payment_transactions`, `payment_provider_registry` collections
- `MongoPaymentTransactionRepository`
- `MongoPaymentMethodRepository`

### Provider Implementations (10 providers)
- CashProvider, CardManualProvider, VodafoneCashProvider, OrangeCashProvider, EtisalatCashProvider, WePayProvider, InstaPayProvider, BankTransferProvider, CustomerCreditProvider, StoreCreditProvider

### API Endpoints
- `POST /v1/payments` — process split payment
- `POST /v1/payments/:id/refund` — refund payment
- `GET /v1/payments` — list enabled payment methods

### UI Components
- `PaymentPanel` — tender type grid, split tender rows, change display, confirm button
- `SplitPaymentRow` — individual tender row with amount input and remove
- `RefundPaymentDialog` — refund amount input per tender type

### Validation
- Split tender sum validated against grand total (integer piasters)
- Payment method enabled check per company
- Refund amount validation against original transaction
