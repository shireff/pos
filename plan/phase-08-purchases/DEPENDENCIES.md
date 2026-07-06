# Phase 08 — Customers Dependencies

## Incoming

- Phase 01, 02 (Foundation, Auth)
- Phase 07 (Sales) — loyalty points accrue/reverse on sales/returns; customer is attached to orders

## Outgoing

- Phase 13 (Reports) — Customer & Loyalty report, Customer Debts report
- Phase 15 (AI Services) — AI customer segmentation (RFM) consumes customer purchase history

## Documents Used

- PRD.md §4.6 (FR-6.1 through FR-6.3)
- Database.md §2.11 (customers, loyalty_accounts, credit_ledger_entries)
- API.md §4.5 (customer endpoints)
- Business_Rules.md §6 (BR-CUS-001 through BR-CUS-005)
- Event_Catalog.md §6 (CustomerCreated, LoyaltyPoints* events)
- Sync_Architecture.md §3.3 (loyalty points = Class A event stream)

## Shared Modules Produced

- `packages/domain/crm` — Customer, LoyaltyAccount, CreditLedger aggregates
- `packages/application/crm` — customer management use cases
- `packages/ui-components/src/customers/*` — Customer List, Profile, Redemption screens
