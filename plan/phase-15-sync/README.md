# Phase 15 — AI Services

## Purpose

AI Gateway (provider-agnostic interface) plus all must-have AI features: Assistant, Sales/Inventory Prediction, Fraud Detection, Store Health Score, OCR (supplier invoice), Dead Product Detection, Customer Segmentation (RFM), Smart Alerts, Anomaly Detection, Cash Flow Prediction scaffold, and Branch Comparison AI. Advisory-only enforcement is non-negotiable — no AI recommendation, prediction, or alert can apply any change to system data without explicit owner approval.

## Scope

- **AI Gateway**: provider-agnostic `IAIProvider` interface with `complete()`, `embed()`, `classify()` methods; clients: `LocalModelProvider` (on-device, offline-first) and `NaraRouterProvider` integrating the NaraRouter endpoint (`https://router.bynara.id/v1`). Whitelisted models: `kimi-k2.7-code-free`, `mistral-large`, `mistral-medium-3-5` — no other model is permitted. Total cloud token budget: **5 million tokens**; routing policy (local-first when offline, NaraRouter when online, fallback among whitelisted models then graceful degradation)
- **Query Classification**: routes queries to appropriate model tier based on complexity, privacy requirements, and latency budget
- **Context Assembly**: builds structured context payloads from materialized read-models — never dumps raw DB collections; context size bounded per query type
- **AI Features (11)**: Assistant (natural language Q&A over store data), Sales Prediction (deterministic baseline formula + LLM narrative), Inventory Prediction (same pattern), Fraud Detection (rule-based scoring + LLM explanation for flagged transactions), Store Health Score (deterministic composite score + LLM narrative), OCR — full implementation wiring Phase 06 stub via NaraRouter (`kimi-k2.7-code-free`), Dead Product Detection, Customer Segmentation (RFM model + LLM tier naming), Smart Alerts (anomaly threshold detection + LLM contextual message), Anomaly Detection, Cash Flow Prediction scaffold
- **Feedback Loop**: ai_insight_feedback collection records user accept/reject/modify actions per insight; used for routing policy tuning
- **Advisory-Only Enforcement**: enforced at the Application/domain command layer — no AI output can trigger a write command without an explicit human-approval step; this is tested by a mandatory unit test
- **Provider Fallback Test**: all provider combinations tested with injected failures to verify fallback chain activates correctly
- **Sync**: ai insights are local-only read models — not synced (each device generates its own)

## Expected Output

A working AI layer where:

- All 11 AI features return real outputs (not stubs) for at least the happy path
- Advisory-only enforcement test passes — a direct AI output cannot trigger a write command
- Provider fallback chain routes to next provider on simulated failure
- OCR fully replaces the Phase 06 stub with real extraction
- Context assembly never includes raw credential or PII fields

## Documents Referenced

- AI.md (all sections)
- API.md §4.7
- Business_Rules.md §11
- State_Machines.md §15–16

## Included Modules

- `packages/domain/ai-insights` — full domain implementation
- `packages/application/ai/src/gateway/ai-gateway.ts`
- `packages/infrastructure/ai-clients/src/providers/*` (2 providers: local-model, nara-router)
- `packages/application/ai/src/features/*` (11 feature handlers)
- `packages/application/ai/src/context-assembler.ts`
- `packages/application/ai/src/query-classifier.ts`
- `packages/infrastructure/mongodb/migrations/015_ai_schema.ts`
- `apps/backend/src/http/ai/*`
- `packages/ui-components/src/ai/AssistantPanel.tsx`
- `packages/ui-components/src/ai/InsightCard.tsx`
- `packages/ui-components/src/ai/InsightFeedback.tsx`
- `apps/desktop/src/features/ai/*`
- `apps/android/src/features/ai/*`
