# Phase 06 — Purchases Tests

## Unit Tests

- PO cannot transition from received → any state (terminal)
- PO cannot transition from cancelled → any state (terminal)
- Cancelled PO does not affect stock (no PURCHASE_RECEIPT event emitted)
- Goods receipt: received quantity < shipped quantity → discrepancy captured explicitly (BR-SUP-002)
- Goods receipt: received quantity = shipped quantity → no discrepancy record
- OCR extracted fields are shown as editable pre-filled form — never auto-committed (BR-SUP-003)
- Every manual OCR correction is logged in ai_insight_feedback (BR-SUP-004)

## Integration Tests

- POST /v1/purchase-orders (draft): creates PO, status = draft
- POST /v1/purchase-orders (above threshold): status = pending_approval, notification fired
- POST /v1/purchase-orders/:id/approve: status = approved (with purchasing.po.approve permission)
- POST /v1/purchase-orders/:id/receive: goods receipt recorded, stock_movement_events PURCHASE_RECEIPT appended
- Discrepancy between ordered and received quantities saved in PO record
- POST /v1/supplier-invoices/ocr: returns extracted fields for review (stub: mock data in Phase 06, real OCR wired in Phase 15)

## Sync Tests

- PO created offline on purchasing officer device → syncs to server when connected
- PO approved on manager's device offline → syncs and stock updated when both devices reconnect

## E2E Tests (Critical Flow #4 — partial)

- Create PO on Desktop → approve on Android → receive goods → verify stock increased
- Discrepancy on receipt: ordered 100, received 90 → discrepancy of 10 recorded and visible in PO detail
