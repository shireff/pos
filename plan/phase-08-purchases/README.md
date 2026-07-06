# Phase 08 — Customers

## Purpose

Customer profile management, loyalty program, and customer credit ledger. Customers are identified by phone number, loyalty card ID, or system-generated code. Loyalty points are a Class A event stream — the balance is always a projection of accrual/redemption/reversal events and is never a directly mutable field.

## Scope

- **Database**: customers, loyalty_accounts, loyalty_events (append-only), credit_ledger_entries (append-only) collections
- **Domain**: Customer aggregate, LoyaltyAccount aggregate (event-sourced balance projection), CreditLedger aggregate (event-sourced balance projection), LoyaltyEvent entity, CreditLedgerEntry entity
- **Business Logic**: loyalty point accrual on sale completion (rate configurable per plan), loyalty redemption at POS (minimum threshold enforced), loyalty reversal on approved return (BR-SAL-007), credit balance auto-reminder trigger (configurable threshold), customer merge (phone deduplication), credit limit enforcement
- **Application**: CreateCustomerCommand, UpdateCustomerCommand, MergeCustomersCommand, AccrueLoyaltyPointsCommand, RedeemLoyaltyPointsCommand, ReverseLoyaltyPointsCommand, RecordCreditPaymentCommand, GetCustomerQuery, GetLoyaltyBalanceQuery, GetCreditBalanceQuery
- **API**: POST /v1/customers, PATCH /v1/customers/:id, GET /v1/customers, GET /v1/customers/:id, POST /v1/customers/:id/loyalty/redeem, GET /v1/customers/:id/loyalty/history, GET /v1/customers/:id/credit/history
- **Permissions**: customers.view, customers.create, customers.edit, customers.credit.view, customers.credit.record, customers.loyalty.redeem
- **Sync**: Class B field-level HLC merge for customer profile fields; loyalty_events and credit_ledger_entries are Class A (append-only)
- **Desktop UI**: Customer List (searchable by name/phone/code, loyalty tier badge), Customer Profile screen (tabs: Overview, Loyalty History, Credit History, Purchase History), Loyalty Redemption dialog (show available points, enter redemption amount)
- **Android UI**: same screens using shared components (bottom-sheet customer search at POS)

## Expected Output

A working customer module where:

- Customers can be created, found by phone/code, and updated
- Loyalty balance is always derived from event stream projection — never a raw field update
- Loyalty accrual fires after OrderCompleted event
- Loyalty reversal fires after ReturnApproved event (BR-SAL-007 satisfied)
- Credit limit blocks sales that would exceed the limit
- Customer merge resolves duplicate phone registrations

## Documents Referenced

- PRD.md §4.6
- Database.md §2.11
- API.md §4.5
- Business_Rules.md §6
- Event_Catalog.md §6

## Included Modules

- `packages/domain/crm` — full implementation
- `packages/application/crm` — all command and query handlers
- `packages/infrastructure/mongodb/migrations/008_customers_schema.ts`
- `packages/infrastructure/mongodb/repositories/customer.repository.ts`
- `packages/infrastructure/mongodb/repositories/loyalty-event.repository.ts`
- `packages/infrastructure/mongodb/repositories/credit-ledger-entry.repository.ts`
- `apps/backend/src/http/customers/*`
- `packages/ui-components/src/customers/*`
- `apps/desktop/src/features/customers/*`
- `apps/android/src/features/customers/*`
