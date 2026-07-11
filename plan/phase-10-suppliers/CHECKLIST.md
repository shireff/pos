# Phase 10 — Payments Checklist

A phase is **NOT complete** until every item below is checked.

## Domain

- [x] IPaymentProvider interface defined with correct method signatures
- [x] Payment aggregate implemented
- [x] SplitTender value object validates sum equals totalAmount exactly (integer piasters)
- [x] All 10 provider implementations complete (cash, card-manual, Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, InstaPay, bank transfer, customer credit, store credit)

## Plugin Architecture

- [x] Adding a new provider requires ONLY a new file implementing IPaymentProvider — verified by creating a test provider with zero changes to core code
- [x] Core payment processing code contains NO switch/case or if/else on provider type

## Application

- [x] ProcessPaymentCommand routes all tenders through registered providers via DI
- [x] RefundPaymentCommand routes refund to original tender provider
- [x] CustomerCreditProvider checks available balance before processing
- [x] StoreCreditProvider checks available balance before processing

## API

- [x] POST /v1/payments and POST /v1/payments/:id/refund tested with permission enforcement

## Sync

- [x] payment_transactions classified as Class A (append-only)

## Desktop UI

- [x] Payment Panel renders all 10 tender types
- [x] Split payment rows with sum validation work
- [x] Change display for cash payments correct

## Android UI

- [x] Payment Panel as bottom-sheet on Android

## Tests

- [x] SplitTender sum validation test: mismatched amounts rejected
- [x] All 10 provider process/refund flows tested
- [x] CustomerCreditProvider insufficient balance test passes
- [x] Plugin extensibility test: test provider added with zero core changes

## Quality Gates

- [x] Zero TypeScript errors (Phase 10 files pass typecheck)
- [x] Zero ESLint errors (Phase 10 files pass lint)
- [x] All tests passing in CI
