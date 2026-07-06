# Phase 15 — AI Services Dependencies

## Incoming

- Phase 12 (Offline Sync) — AI reads from synced data; must be stable first
- Phase 13 (Reports) — AI reads from report read-models (Store Health Score, Predictions)
- Phase 14 (Notifications) — AI anomaly alerts go through notification dispatcher

## Outgoing

- None blocking — AI is additive. Its unavailability MUST NOT cascade into POS or inventory failures

## Documents Used

- AI.md (ALL sections — primary document)
- API.md §4.7 (AI endpoints)
- Business_Rules.md §11 (BR-AI-001 through BR-AI-011)
- State_Machines.md §15 (AI Request lifecycle), §16 (AI Recommendation lifecycle)
- Event_Catalog.md §11 (AI events)
- Testing.md §9 (AI advisory-only enforcement test — MANDATORY)
- Security.md §7 (no raw DB dump to cloud AI provider)

## Critical Rules

- AI NEVER executes an irreversible action without explicit owner approval (BR-AI-001)
- Numeric forecasts are computed by deterministic statistical baseline — LLM generates narrative ONLY (BR-AI-002)
- No raw database dump sent to any cloud AI provider (BR-AI-004)
- Advisory-only enforcement test at domain/command layer MUST exist before any AI feature is complete (Testing.md §9)
- All AI features fully available during 14-day trial (BR-AI-011)

## Shared Modules Produced

- `packages/infrastructure/ai-clients` — AI Gateway with provider-agnostic interface
- All AI feature handlers — consumed by AI dashboard and POS insights
- `ai_insight_feedback` loop — acceptance rate tracking for all recommendations
