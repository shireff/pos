# Phase 09 — Suppliers Tests

## Unit Tests

- Supplier on-time delivery % = POs received on time / total POs received (deterministic formula)
- Price variance per item: current PO price vs. historical average (deterministic)
- Supplier performance score is NEVER computed by LLM — LLM generates only narrative explanation
- Supplier ledger: payment entry reduces outstanding balance
- Supplier ledger: return entry increases supplier credit

## Integration Tests

- POST /v1/suppliers creates supplier
- GET /v1/suppliers/:id returns supplier with performance metrics
- Supplier performance updated after new PO received
- Caller without purchasing.supplier.view permission: 403

## E2E Tests

- Create supplier on Desktop → create PO → receive goods → supplier performance metrics updated
- View supplier ledger: payment history, outstanding balance, open POs
