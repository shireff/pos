# Phase 10 — Payments

## Purpose

Full payment tender support — cash, card (manual entry), Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, InstaPay, bank transfer, customer credit, and store credit. Implemented via a plugin-based provider architecture: adding a new payment provider requires no changes to core payment processing code, only a new provider plugin file.

## Scope

- **Database**: payment_methods, payment_providers (plugin registry), payment_transactions collections
- **Domain**: Payment aggregate, PaymentMethod entity, PaymentProvider interface (plugin contract), SplitTender value object
- **Business Logic**: split payment validation (sum of all tender amounts must equal grand_total exactly), provider routing (route each tender to its registered provider adapter), customer credit deduction (check available balance before applying), store credit deduction, refund routing (refund goes back to original tender method), cash change calculation
- **Application**: ProcessPaymentCommand, RefundPaymentCommand, RegisterPaymentProviderCommand, GetPaymentMethodsQuery — all provider-agnostic
- **API**: POST /v1/payments, POST /v1/payments/:id/refund, GET /v1/payment-methods
- **Permissions**: payments.process, payments.refund, payments.methods.manage
- **Plugin Architecture**: each provider is a separate module implementing `IPaymentProvider` interface; core code only calls interface methods; provider discovery via DI container registration
- **Sync**: payment_transactions are Class A (append-only); payment_methods config is Class B
- **Desktop UI**: Payment Panel (rendered inside POS register screen), tender type selector, split payment rows, change display, receipt confirmation
- **Android UI**: same payment panel using shared components

## Expected Output

A working payment system where:

- All 10 tender types are supported through a unified provider interface
- Split payment validation prevents submission when amounts do not equal grand_total
- Adding a new provider requires only creating a new file implementing IPaymentProvider — no core code changes
- Customer credit and store credit providers correctly check available balances before accepting
- Refunds are routed back to the original tender method

## Documents Referenced

- PRD.md §4.7
- Database.md §2.10
- API.md §4.2
- Business_Rules.md §3

## Included Modules

- `packages/domain/sales/src/entities/payment.entity.ts`
- `packages/domain/sales/src/value-objects/split-tender.vo.ts`
- `packages/domain/sales/src/interfaces/payment-provider.interface.ts`
- `packages/application/sales/src/payments/*`
- `packages/infrastructure/payment-providers/cash.provider.ts`
- `packages/infrastructure/payment-providers/card-manual.provider.ts`
- `packages/infrastructure/payment-providers/vodafone-cash.provider.ts`
- `packages/infrastructure/payment-providers/orange-cash.provider.ts`
- `packages/infrastructure/payment-providers/etisalat-cash.provider.ts`
- `packages/infrastructure/payment-providers/we-pay.provider.ts`
- `packages/infrastructure/payment-providers/instapay.provider.ts`
- `packages/infrastructure/payment-providers/bank-transfer.provider.ts`
- `packages/infrastructure/payment-providers/customer-credit.provider.ts`
- `packages/infrastructure/payment-providers/store-credit.provider.ts`
- `packages/infrastructure/mongodb/migrations/010_payments_schema.ts`
- `apps/backend/src/http/payments/*`
- `packages/ui-components/src/payments/*`
