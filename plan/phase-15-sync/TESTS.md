# Phase 15 — AI Services Tests

## Unit Tests

### ai/advisory-only-enforcement.test.ts (MANDATORY — blocks release if failing)

- UpdatePriceCommand has NO AI-auto-approve branch — verified at domain/command layer
- CreatePurchaseOrderCommand has NO AI-auto-approve branch
- AdjustStockCommand has NO AI-auto-approve branch
- AcceptRecommendationCommand triggers the SAME UpdatePriceCommand as a manual edit — structurally identical
- AI-generated recommendation in state=generated cannot transition to accepted without being presented first (State_Machines.md §16)

### ai/gateway.test.ts

- Offline/simple query → routed to LocalModelProvider (never cloud)
- Complex query + online → routed to GroqProvider
- GroqProvider times out → falls back to GeminiFlashProvider
- Both cloud providers fail → graceful degradation message shown (never raw error — BR-AI-006)
- Every response tagged with source: "local" | "groq" | "gemini"
- Malformed AI response → exactly ONE retry → then graceful fallback (not infinite retry)

### ai/context-assembler.test.ts

- Context assembly never includes raw database dump (BR-AI-004)
- Customer PII included only when query explicitly requires identifying a specific customer (BR-AI-005)
- Context is pre-aggregated read-model slices only
- Local-model queries never leave the device (strongest privacy guarantee)

### ai/forecast.test.ts (determinism)

- Given identical historical input data → sales forecast produces identical numeric output on every run
- LLM narrative text is schema-validated (not asserted for exact equality — only valid structure)
- Non-determinism in the numeric baseline is a BUG — treated as a failing test

### ai/fraud-detection.test.ts

- Fraud score is computed by deterministic rule-based scoring (not LLM)
- LLM generates only the human-readable explanation of an already-computed score
- Fraud alert is advisory only — no automated account suspension triggered
- Void rate 3x branch average → fraud score increases (deterministic threshold)

### ai/store-health-score.test.ts

- Each sub-score (Sales/Inventory/Financial/Employee/Customer) computed deterministically
- LLM generates only the narrative summary and top-3 recommended actions
- Score degrades gracefully when a sub-score's data is unavailable

## Integration Tests

### ai/provider-fallback.integration.test.ts

- Mock GroqProvider to return 503 → request falls back to GeminiFlash
- Mock both cloud providers to fail → graceful degradation message returned
- Response includes correct source tag after each scenario

### ai/ocr.integration.test.ts (Critical Flow #4 — completes the OCR stub from Phase 06)

- POST /v1/supplier-invoices/ocr with image → returns extracted fields as editable form
- Manual correction of extracted field is logged in ai_insight_feedback
- OCR result is NEVER auto-committed to supplier_invoices (BR-SUP-003)

### ai/feedback-loop.integration.test.ts

- Owner accepts pricing recommendation → ai_insight_feedback record created, UpdatePriceCommand fired
- Owner rejects recommendation → ai_insight_feedback record created, no price change
- Acceptance rate calculated correctly from feedback collection

## E2E Tests (Critical Flows #8 and #9 — MANDATORY)

### e2e/flow-8-assistant.e2e.test.ts (Critical Flow #8)

- Owner asks "what were my top 5 products last week?" → AI Assistant responds with data from local read model
- No raw database dump in network traffic (verified in test)
- Response includes source badge (local/cloud)

### e2e/flow-9-recommendation.e2e.test.ts (Critical Flow #9)

- AI generates pricing recommendation → appears in dashboard
- Owner must click "Accept" → UpdatePriceCommand fired → price changes
- Price does NOT change without explicit owner action (advisory-only verified end-to-end)
