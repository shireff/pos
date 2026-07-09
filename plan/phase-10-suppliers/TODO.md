# Phase 10 — Payments TODO

## Database

- [ ] Create migration `010_payments_schema.ts`: payment_methods (config), payment_transactions, payment_provider_registry collections
- [ ] payment_transactions: index (companyId, orderId), index (companyId, createdAt, tenderType) — append-only at repository layer
- [ ] payment_provider_registry: stores registered provider names and their configuration schema
- [ ] JSON Schema: payment_transactions requires orderId, tenderType, amount positive integer, status enum(completed/refunded/partially_refunded)

## Domain — Payments

- [ ] Implement `IPaymentProvider` interface: methods: `process(request): Promise<PaymentResult>`, `refund(request): Promise<RefundResult>`, `getStatus(transactionId): Promise<ProviderStatus>`; every provider implements this interface
- [ ] Implement `Payment` aggregate: id, orderId, tenderType, providerId, amount (Money), status, externalReference?, processedAt
- [ ] Implement `SplitTender` value object: tenders[] array, validate sum equals totalAmount exactly (Money comparison, integer piasters), validate no tender has zero amount
- [ ] Implement `PaymentMethod` entity: id, companyId, tenderType, isEnabled, displayName (ar/en), configuration (provider-specific, encrypted at rest)

## Provider Implementations

- [ ] `CashProvider`: process — record transaction, compute change amount; refund — record cash refund; no external API calls
- [ ] `CardManualProvider`: process — record manual card entry (no terminal integration); refund — record manual refund; store last-4 digits only
- [ ] `VodafoneCashProvider`: process — call Vodafone Cash API stub (returns mock success until real integration wired); refund stub
- [ ] `OrangeCashProvider`: same pattern as VodafoneCash
- [ ] `EtisalatCashProvider`: same pattern
- [ ] `WePayProvider`: same pattern
- [ ] `InstaPayProvider`: same pattern
- [ ] `BankTransferProvider`: process — record reference number, mark as pending_verification; refund — record reversal
- [ ] `CustomerCreditProvider`: process — call GetCreditBalanceQuery; reject if insufficient; emit CreditLedgerEntry(purchase_on_credit); refund — emit CreditLedgerEntry(credit_note)
- [ ] `StoreCreditProvider`: process — deduct from store credit balance (separate from customer credit); refund — restore store credit

## Application — Use Cases

- [ ] `ProcessPaymentCommand` + handler: receive SplitTender value object; validate sum; for each tender, route to registered provider via DI registry; record PaymentTransaction for each; emit PaymentCompleted event
- [ ] `RefundPaymentCommand` + handler: lookup original payment transactions; route refund to same provider used in original; record refund transactions
- [ ] `GetPaymentMethodsQuery` + handler: return enabled payment methods for company/branch
- [ ] Provider registry: DI container registers all providers; core code only calls IPaymentProvider interface; no switch/case on provider type

## API Endpoints

- [ ] `POST /v1/payments` — body: orderId, tenders array (tenderType, amount)
- [ ] `POST /v1/payments/:id/refund` — body: tenders array (amounts per original tender)
- [ ] `GET /v1/payment-methods` — enabled methods for company

## Validation (Zod)

- [ ] `ProcessPaymentSchema`: orderId UUIDv7, tenders array min 1 (tenderType enum of all 10 types, amount positive integer); cross-validation: sum of amounts = order total (resolved from order record)
- [ ] `RefundPaymentSchema`: tenders array, originalPaymentId UUIDv7

## Permissions

- [ ] Enforce `payments.process` on POST /v1/payments
- [ ] Enforce `payments.refund` on refund endpoint
- [ ] Enforce `payments.methods.manage` on payment method configuration endpoints

## Sync

- [ ] payment_transactions: Class A (append-only)
- [ ] payment_methods config: Class B

## Desktop UI

- [ ] Payment Panel component (`packages/ui-components/src/payments/PaymentPanel.tsx`): rendered inside POS Register; tender type button grid; amount input; split tender list; change display for cash; confirm payment button
- [ ] Split payment row: tender type, amount input, remove row button, provider status indicator
- [ ] Refund Payment dialog: show original tenders, input refund amounts per tender

## Android UI

- [ ] Same PaymentPanel component used inside Android POS screen
- [ ] Payment Panel shown as bottom-sheet on Android

## Tests

- [ ] See TESTS.md

### Quality Gates

- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] Update API.md if any endpoint contract was refined during implementation