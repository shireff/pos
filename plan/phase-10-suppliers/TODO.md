# Phase 10 — Payments TODO

## Database

- [x] Create migration `010_payments_schema.ts`: payment_methods (config), payment_transactions, payment_provider_registry collections
- [x] payment_transactions: index (companyId, orderId), index (companyId, createdAt, tenderType) — append-only at repository layer
- [x] payment_provider_registry: stores registered provider names and their configuration schema
- [x] JSON Schema: payment_transactions requires orderId, tenderType, amount positive integer, status enum(completed/refunded/partially_refunded)

## Domain — Payments

- [x] Implement `IPaymentProvider` interface: methods: `process(request): Promise<PaymentResult>`, `refund(request): Promise<RefundResult>`, `getStatus(transactionId): Promise<ProviderStatus>`; every provider implements this interface
- [x] Implement `Payment` aggregate: id, orderId, tenderType, providerId, amount (Money), status, externalReference?, processedAt
- [x] Implement `SplitTender` value object: tenders[] array, validate sum equals totalAmount exactly (Money comparison, integer piasters), validate no tender has zero amount
- [x] Implement `PaymentMethod` entity: id, companyId, tenderType, isEnabled, displayName (ar/en), configuration (provider-specific, encrypted at rest)

## Provider Implementations

- [x] `CashProvider`: process — record transaction, compute change amount; refund — record cash refund; no external API calls
- [x] `CardManualProvider`: process — record manual card entry (no terminal integration); refund — record manual refund; store last-4 digits only
- [x] `VodafoneCashProvider`: process — call Vodafone Cash API stub (returns mock success until real integration wired); refund stub
- [x] `OrangeCashProvider`: same pattern as VodafoneCash
- [x] `EtisalatCashProvider`: same pattern
- [x] `WePayProvider`: same pattern
- [x] `InstaPayProvider`: same pattern
- [x] `BankTransferProvider`: process — record reference number, mark as pending_verification; refund — record reversal
- [x] `CustomerCreditProvider`: process — call GetCreditBalanceQuery; reject if insufficient; emit CreditLedgerEntry(purchase_on_credit); refund — emit CreditLedgerEntry(credit_note)
- [x] `StoreCreditProvider`: process — deduct from store credit balance (separate from customer credit); refund — restore store credit

## Application — Use Cases

- [x] `ProcessPaymentCommand` + handler: receive SplitTender value object; validate sum; for each tender, route to registered provider via DI registry; record PaymentTransaction for each; emit PaymentCompleted event
- [x] `RefundPaymentCommand` + handler: lookup original payment transactions; route refund to same provider used in original; record refund transactions
- [x] `GetPaymentMethodsQuery` + handler: return enabled payment methods for company/branch
- [x] Provider registry: DI container registers all providers; core code only calls IPaymentProvider interface; no switch/case on provider type

## API Endpoints

- [x] `POST /v1/payments` — body: orderId, tenders array (tenderType, amount)
- [x] `POST /v1/payments/:id/refund` — body: tenders array (amounts per original tender)
- [x] `GET /v1/payment-methods` — enabled methods for company

## Validation (Zod)

- [x] `ProcessPaymentSchema`: orderId UUIDv7, tenders array min 1 (tenderType enum of all 10 types, amount positive integer); cross-validation: sum of amounts = order total (resolved from order record)
- [x] `RefundPaymentSchema`: tenders array, originalPaymentId UUIDv7

## Permissions

- [x] Enforce `payments.tender.record` on POST /v1/payments
- [x] Enforce `payments.tender.record` on refund endpoint
- [x] Enforce `payments.provider.configure` on payment method configuration endpoints

## Sync

- [x] payment_transactions: Class A (append-only)
- [x] payment_methods config: Class B

## Desktop UI

- [x] Payment Panel component (`packages/ui-components/src/payments/PaymentPanel.tsx`): rendered inside POS Register; tender type button grid; amount input; split tender list; change display for cash; confirm payment button
- [x] Split payment row: tender type, amount input, remove row button, provider status indicator
- [x] Refund Payment dialog: show original tenders, input refund amounts per tender

## Android UI

- [x] Same PaymentPanel component used inside Android POS screen
- [x] Payment Panel shown as bottom-sheet on Android

## Tests

- [x] See TESTS.md

### Quality Gates

- [x] Zero TypeScript errors (Phase 10 files)
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation
