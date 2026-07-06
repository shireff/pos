# Phase 15 — AI Services Checklist

A phase is **NOT complete** until every item below is checked.

## AI Gateway

- [ ] IAIProvider interface defined with correct method signatures
- [ ] `LocalModelProvider` implemented
- [ ] `NaraRouterProvider` implemented: endpoint `https://router.bynara.id/v1`; model whitelist enforced at gateway level — only `kimi-k2.7-code-free`, `mistral-large`, `mistral-medium-3-5` are permitted; 5 million token budget respected
- [ ] Routing policy: local-first offline, NaraRouter when online
- [ ] Fallback chain among whitelisted models on failure, then graceful degradation

## **Advisory-Only Enforcement — MANDATORY EXIT GATE**

- [ ] `advisory-only-enforcement.test.ts` PASSES: for each AI feature, calling the feature handler does NOT trigger any write command
- [ ] No AI feature ships without this test passing — verified in CI

## AI Features (11)

- [ ] Assistant feature returns real LLM response (not stub) for test question
- [ ] Sales Prediction returns deterministic baseline + LLM narrative
- [ ] Inventory Prediction returns deterministic baseline + LLM narrative
- [ ] Fraud Detection: rule-based score computed correctly + LLM explanation generated
- [ ] Store Health Score: deterministic formula computed correctly + LLM narrative
- [ ] OCR feature: replaces Phase 06 stub; extracts real data from test invoice image
- [ ] Dead Product Detection returns correct list of zero-sale products
- [ ] Customer Segmentation: RFM scores computed correctly + LLM tier names
- [ ] Smart Alerts: anomaly threshold detection works
- [ ] Anomaly Detection: Z-score computation correct
- [ ] Cash Flow Prediction scaffold returns basic projection

## Context Assembly

- [ ] ContextAssembler never includes raw credential fields, password hashes, or raw PII
- [ ] Context size bounded per query type — verified by test

## Provider Fallback Test

- [ ] `provider-fallback-chain.test.ts` PASSES: simulated provider failures trigger correct fallback chain

## Feedback Loop

- [ ] ai_insight_feedback records accept/reject/modify actions correctly

## UI

- [ ] AssistantPanel renders chat interface
- [ ] InsightCard renders with feedback actions
- [ ] OCR Review panel shows extracted data for human review before application

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
- [ ] Advisory-only enforcement test passes (mandatory gate)
