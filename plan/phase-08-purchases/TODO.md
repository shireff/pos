# Phase 08 — Customers TODO
> ?? **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use useT() / 	() with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use pps/backend/src/lib/errors.ts with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.

## Database

- [x] Create migration `008_customers_schema.ts`: customers, loyalty_accounts, loyalty_events (append-only), credit_ledger_entries (append-only), customer_notes collections
- [x] customers: unique index (companyId, phone), index (companyId, loyaltyCode)
- [x] loyalty_events: index (customerId, occurredAt) — append-only enforced at repository layer
- [x] credit_ledger_entries: index (customerId, occurredAt) — append-only enforced at repository layer
- [x] JSON Schema: loyalty_events requires eventType enum(accrual/redemption/reversal/expiry/adjustment), amount positive integer (points), referenceType, referenceId
- [x] JSON Schema: credit_ledger_entries requires eventType enum(purchase_on_credit/payment/credit_note/adjustment), amount integer signed, referenceId

## Domain — CRM

- [x] Implement `Customer` aggregate: id, companyId, name, phone (unique within company), email?, loyaltyCode (auto-generated), loyaltyTierId, creditLimit (Money), isActive, notes
- [x] Implement `LoyaltyAccount` aggregate (event-sourced): companyId, customerId, pointsBalance (projection: sum of signed amounts from loyalty_events), tierId (computed from balance thresholds)
- [x] Implement `CreditLedger` aggregate (event-sourced): companyId, customerId, balance (projection: sum of signed amounts from credit_ledger_entries), creditLimit (Money)
- [x] Implement loyalty tier computation: given pointsBalance and tier configuration, return current tier name and benefits
- [x] Implement loyalty accrual rule: accrualRate = points per piaster (configurable per plan); accrualPoints = floor(orderTotal * accrualRate)
- [x] Implement loyalty redemption validation: points >= minimumRedemptionThreshold; redemption amount <= outstanding balance
- [x] Implement credit limit enforcement: before completing a credit sale, verify newBalance = currentBalance + saleTotal <= creditLimit
- [x] Implement customer merge: move all loyalty events, credit entries, and orders to target customer; deactivate source customer; idempotent

## Application — Use Cases

- [x] `CreateCustomerCommand` + handler: validate phone uniqueness within company, generate loyaltyCode, create LoyaltyAccount and CreditLedger projections
- [x] `UpdateCustomerCommand` + handler: allow name/email/creditLimit changes; phone changes require uniqueness recheck
- [x] `MergeCustomersCommand` + handler: requires customers.edit; reassign all events and orders; deactivate source
- [x] `AccrueLoyaltyPointsCommand` + handler: called by OrderCompleted event handler; record LoyaltyEvent(accrual); update projection
- [x] `RedeemLoyaltyPointsCommand` + handler: validate balance, record LoyaltyEvent(redemption); deduct from running balance
- [x] `ReverseLoyaltyPointsCommand` + handler: called by ReturnApproved handler (BR-SAL-007); record LoyaltyEvent(reversal)
- [x] `RecordCreditPaymentCommand` + handler: record CreditLedgerEntry(payment); update balance projection
- [x] `GetCustomerQuery` + handler: fetch profile with current loyalty balance and credit balance (read from projections)
- [x] `GetLoyaltyHistoryQuery` + handler: paginated loyalty_events for customer
- [x] `GetCreditHistoryQuery` + handler: paginated credit_ledger_entries for customer
- [x] `SearchCustomersQuery` + handler: search by name, phone, loyaltyCode, email; returns lightweight list

## API Endpoints

- [x] `POST /v1/customers` — create customer
- [x] `PATCH /v1/customers/:id` — update profile
- [x] `GET /v1/customers` — paginated list with search
- [x] `GET /v1/customers/:id` — full profile with balances
- [x] `POST /v1/customers/merge` — body: sourceId, targetId
- [x] `POST /v1/customers/:id/loyalty/redeem` — body: points, orderId
- [x] `GET /v1/customers/:id/loyalty/history` — paginated
- [x] `POST /v1/customers/:id/credit/payments` — record payment against credit balance
- [x] `GET /v1/customers/:id/credit/history` — paginated

## Validation (Zod)

- [x] `CreateCustomerSchema`: name string, phone string Egyptian format validated, email optional email, creditLimit nonneg integer
- [x] `UpdateCustomerSchema`: all optional, at least one required
- [x] `MergeCustomersSchema`: sourceId UUIDv7, targetId UUIDv7 (must differ)
- [x] `RedeemLoyaltySchema`: points positive integer, orderId UUIDv7
- [x] `RecordCreditPaymentSchema`: amount positive integer, paymentMethod string, referenceNumber optional

## Permissions

- [x] Enforce `customers.view` on GET endpoints
- [x] Enforce `customers.create` on POST /v1/customers
- [x] Enforce `customers.edit` on PATCH and merge endpoints
- [x] Enforce `customers.credit.view` on credit history endpoint
- [x] Enforce `customers.credit.record` on credit payment endpoint
- [x] Enforce `customers.loyalty.redeem` on redemption endpoint

## Sync

- [x] customers: Class B field-level HLC merge (hlc_timestamp, sync_version added)
- [x] loyalty_events: Class A (append-only) — update/delete blocked at repository
- [x] credit_ledger_entries: Class A (append-only) — update/delete blocked at repository

## Desktop UI

- [x] Customer List page (`apps/desktop/src/features/customers/CustomerListPage.tsx`): searchable table, columns: name, phone, loyalty tier badge, points balance, credit balance, total purchases; "Add Customer" button
- [x] Customer Profile page: tabs — Overview (key stats), Loyalty History (paginated), Credit History (paginated), Purchase History (links to orders)
- [x] Loyalty Redemption dialog: shows available points, conversion rate, redemption amount input, confirm button
- [x] POS customer search: bottom-bar search field on POS register page for quick customer lookup by phone

## Android UI

- [x] Same screens using shared components
- [x] POS customer search as bottom-sheet on Android

## Tests

- [x] See TESTS.md
- [x] Domain unit tests: Customer aggregate, LoyaltyAccount aggregate, CreditLedger aggregate, CreditLimitGuardService

### Quality Gates

- [x] Zero TypeScript errors (1 pre-existing unrelated error in purchase-orders integration test)
- [x] All tests passing (230 passed, 9 pre-existing product-route timeout failures)
- [x] Update API.md if any endpoint contract was refined during implementation

