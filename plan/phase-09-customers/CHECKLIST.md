# Phase 09 — Suppliers Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [ ] Migration `009_suppliers_schema.ts` applies cleanly
- [ ] supplier_ledger_entries repository BLOCKS UPDATE and DELETE — verified by contract test

## Domain

- [ ] Supplier aggregate with contacts implemented
- [ ] SupplierLedgerEntry as append-only entity implemented
- [ ] Ledger balance projection: sum of signed amounts correct
- [ ] On-time delivery rate formula is deterministic and tested
- [ ] Price variance formula is deterministic and tested
- [ ] Performance narrative slot returns stub string (not LLM) until Phase 15

## Application

- [ ] All 7 commands and 3 queries implemented
- [ ] DeactivateSupplierCommand blocked if open PO references supplier
- [ ] Ledger balance rebuilds correctly from event replay

## API

- [ ] All 10 endpoints with permission enforcement tested

## Sync

- [ ] suppliers: Class B sync
- [ ] supplier_ledger_entries: Class A sync

## Desktop UI

- [ ] Supplier List with balance and on-time rate indicators
- [ ] Supplier Profile all tabs functional
- [ ] Payment and credit note dialogs work

## Android UI

- [ ] Same screens on Android

## Tests

- [ ] Ledger balance projection test passes
- [ ] On-time delivery rate computation test passes
- [ ] Price variance computation test passes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
