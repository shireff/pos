# Phase 10 — Payments Checklist

A phase is **NOT complete** until every item below is checked.

## Domain

- [ ] IPaymentProvider interface defined with correct method signatures
- [ ] Payment aggregate implemented
- [ ] SplitTender value object validates sum equals totalAmount exactly (integer piasters)
- [ ] All 10 provider implementations complete (cash, card-manual, Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, InstaPay, bank transfer, customer credit, store credit)

## Plugin Architecture

- [ ] Adding a new provider requires ONLY a new file implementing IPaymentProvider — verified by creating a test provider with zero changes to core code
- [ ] Core payment processing code contains NO switch/case or if/else on provider type

## Application

- [ ] ProcessPaymentCommand routes all tenders through registered providers via DI
- [ ] RefundPaymentCommand routes refund to original tender provider
- [ ] CustomerCreditProvider checks available balance before processing
- [ ] StoreCreditProvider checks available balance before processing

## API

- [ ] POST /v1/payments and POST /v1/payments/:id/refund tested with permission enforcement

## Sync

- [ ] payment_transactions classified as Class A (append-only)

## Desktop UI

- [ ] Payment Panel renders all 10 tender types
- [ ] Split payment rows with sum validation work
- [ ] Change display for cash payments correct

## Android UI

- [ ] Payment Panel as bottom-sheet on Android

## Tests

- [ ] SplitTender sum validation test: mismatched amounts rejected
- [ ] All 10 provider process/refund flows tested
- [ ] CustomerCreditProvider insufficient balance test passes
- [ ] Plugin extensibility test: test provider added with zero core changes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
