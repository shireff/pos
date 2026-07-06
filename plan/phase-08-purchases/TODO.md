# Phase 08 — Customers TODO

## Database

- [ ] Create migration `008_customers_schema.ts`: customers, loyalty_accounts, loyalty_events (append-only), credit_ledger_entries (append-only), customer_notes collections
- [ ] customers: unique index (companyId, phone), index (companyId, loyaltyCode)
- [ ] loyalty_events: index (customerId, occurredAt) — append-only enforced at repository layer
- [ ] credit_ledger_entries: index (customerId, occurredAt) — append-only enforced at repository layer
- [ ] JSON Schema: loyalty_events requires eventType enum(accrual/redemption/reversal/expiry/adjustment), amount positive integer (points), referenceType, referenceId
- [ ] JSON Schema: credit_ledger_entries requires eventType enum(purchase_on_credit/payment/credit_note/adjustment), amount integer signed, referenceId

## Domain — CRM

- [ ] Implement `Customer` aggregate: id, companyId, name, phone (unique within company), email?, loyaltyCode (auto-generated), loyaltyTierId, creditLimit (Money), isActive, notes
- [ ] Implement `LoyaltyAccount` aggregate (event-sourced): companyId, customerId, pointsBalance (projection: sum of signed amounts from loyalty_events), tierId (computed from balance thresholds)
- [ ] Implement `CreditLedger` aggregate (event-sourced): companyId, customerId, balance (projection: sum of signed amounts from credit_ledger_entries), creditLimit (Money)
- [ ] Implement loyalty tier computation: given pointsBalance and tier configuration, return current tier name and benefits
- [ ] Implement loyalty accrual rule: accrualRate = points per piaster (configurable per plan); accrualPoints = floor(orderTotal * accrualRate)
- [ ] Implement loyalty redemption validation: points >= minimumRedemptionThreshold; redemption amount <= outstanding balance
- [ ] Implement credit limit enforcement: before completing a credit sale, verify newBalance = currentBalance + saleTotal <= creditLimit
- [ ] Implement customer merge: move all loyalty events, credit entries, and orders to target customer; deactivate source customer; idempotent

## Application — Use Cases

- [ ] `CreateCustomerCommand` + handler: validate phone uniqueness within company, generate loyaltyCode, create LoyaltyAccount and CreditLedger projections
- [ ] `UpdateCustomerCommand` + handler: allow name/email/creditLimit changes; phone changes require uniqueness recheck
- [ ] `MergeCustomersCommand` + handler: requires customers.edit; reassign all events and orders; deactivate source
- [ ] `AccrueLoyaltyPointsCommand` + handler: called by OrderCompleted event handler; record LoyaltyEvent(accrual); update projection
- [ ] `RedeemLoyaltyPointsCommand` + handler: validate balance, record LoyaltyEvent(redemption); deduct from running balance
- [ ] `ReverseLoyaltyPointsCommand` + handler: called by ReturnApproved handler (BR-SAL-007); record LoyaltyEvent(reversal)
- [ ] `RecordCreditPaymentCommand` + handler: record CreditLedgerEntry(payment); update balance projection
- [ ] `GetCustomerQuery` + handler: fetch profile with current loyalty balance and credit balance (read from projections)
- [ ] `GetLoyaltyHistoryQuery` + handler: paginated loyalty_events for customer
- [ ] `GetCreditHistoryQuery` + handler: paginated credit_ledger_entries for customer
- [ ] `SearchCustomersQuery` + handler: search by name, phone, loyaltyCode, email; returns lightweight list

## API Endpoints

- [ ] `POST /v1/customers` — create customer
- [ ] `PATCH /v1/customers/:id` — update profile
- [ ] `GET /v1/customers` — paginated list with search
- [ ] `GET /v1/customers/:id` — full profile with balances
- [ ] `POST /v1/customers/merge` — body: sourceId, targetId
- [ ] `POST /v1/customers/:id/loyalty/redeem` — body: points, orderId
- [ ] `GET /v1/customers/:id/loyalty/history` — paginated
- [ ] `POST /v1/customers/:id/credit/payments` — record payment against credit balance
- [ ] `GET /v1/customers/:id/credit/history` — paginated

## Validation (Zod)

- [ ] `CreateCustomerSchema`: name string, phone string Egyptian format validated, email optional email, creditLimit nonneg integer
- [ ] `UpdateCustomerSchema`: all optional, at least one required
- [ ] `MergeCustomersSchema`: sourceId UUIDv7, targetId UUIDv7 (must differ)
- [ ] `RedeemLoyaltySchema`: points positive integer, orderId UUIDv7
- [ ] `RecordCreditPaymentSchema`: amount positive integer, paymentMethod string, referenceNumber optional

## Permissions

- [ ] Enforce `customers.view` on GET endpoints
- [ ] Enforce `customers.create` on POST /v1/customers
- [ ] Enforce `customers.edit` on PATCH and merge endpoints
- [ ] Enforce `customers.credit.view` on credit history endpoint
- [ ] Enforce `customers.credit.record` on credit payment endpoint
- [ ] Enforce `customers.loyalty.redeem` on redemption endpoint

## Sync

- [ ] customers: Class B field-level HLC merge
- [ ] loyalty_events: Class A (append-only)
- [ ] credit_ledger_entries: Class A (append-only)

## Desktop UI

- [ ] Customer List page (`apps/desktop/src/features/customers/CustomerListPage.tsx`): searchable table, columns: name, phone, loyalty tier badge, points balance, credit balance, total purchases; "Add Customer" button
- [ ] Customer Profile page: tabs — Overview (key stats), Loyalty History (paginated), Credit History (paginated), Purchase History (links to orders)
- [ ] Loyalty Redemption dialog: shows available points, conversion rate, redemption amount input, confirm button
- [ ] POS customer search: bottom-bar search field on POS register page for quick customer lookup by phone

## Android UI

- [ ] Same screens using shared components
- [ ] POS customer search as bottom-sheet on Android

## Tests

- [ ] See TESTS.md
