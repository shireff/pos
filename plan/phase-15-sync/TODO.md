# Phase 15 — AI Services TODO
> ⚠️ **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use `useT()` / `t()` with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use `apps/backend/src/lib/errors.ts` with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.


## AI Gateway

- [x] Implement `IAIProvider` interface (`packages/application/ai/src/gateway/providers/ai-provider.interface.ts`): `complete(request): Promise<CompletionResult>`, `embed(text): Promise<number[]>`, `classify(request): Promise<ClassificationResult>`, `isAvailable(): Promise<boolean>`
- [x] Implement `LocalModelProvider`: calls llama.cpp via Tauri sidecar (on Desktop) or embedded model file (on Android); always available offline; completely free; lowest latency for short prompts
- [x] Implement `AIGateway` (`packages/infrastructure/ai-clients/src/ai-gateway.ts`): local-only routing policy — always routes to LocalModelProvider; no cloud dependency; log all routing decisions to ai_routing_log

## Query Classification

- [x] Implement `QueryClassifier` (`packages/application/ai/src/query-classifier.ts`): classify each query by complexity (low/medium/high), privacy sensitivity (low: aggregate stats; high: individual customer data), latency budget (interactive: <500ms; batch: <30s); output determines provider routing

## Context Assembly

- [x] Implement `ContextAssembler` (`packages/application/ai/src/context-assembler.ts`): builds structured context payloads from read-model collections; bounded size per query type (max tokens enforced); never includes raw credential fields, password hashes, or raw PII in context; uses aggregated statistics

## AI Features (11)

- [x] `AssistantFeature`: natural language Q&A over store data; assembles context from top KPIs and recent events; uses Groq/Gemini for response; advisory output only
- [x] `SalesPredictionFeature`: deterministic baseline (linear regression on daily_sales_rollup); LLM generates narrative summary of trend; human must approve any action based on prediction
- [x] `InventoryPredictionFeature`: same pattern as sales prediction applied to stock movement trends; outputs suggested reorder quantities; advisory only
- [x] `FraudDetectionFeature`: rule-based scoring engine (high discount + unusual hour + new cashier = high score); LLM generates explanation for flagged transactions; no automatic blocking — advisory only
- [x] `StoreHealthScoreFeature`: deterministic composite score from multiple KPIs (weighted formula defined in docs); LLM generates narrative interpretation; score breakdown shown with score
- [x] `OcrFeature`: full implementation replacing Phase 06 stub; calls NaraRouter with `kimi-k2.7-code-free` model for OCR field extraction; accepts invoice image; extracts structured data (supplier, date, lineItems, totals); returns structured JSON for human review before application
- [x] `DeadProductDetectionFeature`: queries products with zero sales in configurable period; LLM suggests action (markdown, bundle, discontinue); advisory only
- [x] `CustomerSegmentationFeature`: RFM model (Recency/Frequency/Monetary) computed deterministically; LLM generates tier names and communication suggestions; no automatic tier assignment
- [x] `SmartAlertsFeature`: monitors anomaly thresholds (sales drop >30% day-over-day, unusual payment method spikes); LLM generates contextual alert message; alerts are informational only
- [x] `AnomalyDetectionFeature`: Z-score based anomaly detection on key metrics; flag outliers; LLM explains probable causes
- [x] `CashFlowPredictionFeature` (scaffold): basic cash flow projection from historical payment data; LLM narrative; full sophistication in future iteration

## Advisory-Only Enforcement

- [x] Implement advisory-only guard at Application/command layer: no AI feature handler is allowed to directly call a write command; AI outputs are wrapped in `AiInsight` record; write commands can only be called by human-initiated handlers
- [x] Write mandatory test `advisory-only-enforcement.test.ts`: for each AI feature, verify that calling the feature handler does not result in any write command being executed; mock all write commands and assert mock was NOT called

## Feedback Loop

- [x] Implement ai_insight_feedback collection: stores accept/reject/modify per AiInsight record; used to track which providers and context configurations lead to accepted recommendations

## Provider Fallback Test

- [x] `provider-fallback-chain.test.ts`: mock NaraRouter model `mistral-large` to return 503 → verify `kimi-k2.7-code-free` is tried next; mock all whitelisted models to fail → verify graceful degradation message is returned (never a crash); verify source tag is correctly set after each scenario

## API Endpoints

- [x] `POST /v1/ai/assistant` — body: question string → response
- [x] `GET /v1/ai/insights` — list latest AI insights by type
- [x] `POST /v1/ai/insights/:id/feedback` — body: action enum(accept/reject/modify), modifiedValue optional
- [x] `POST /v1/ai/ocr` — body: fileReference → extracted invoice data

## Permissions

- [x] Enforce `ai.view` on GET insights
- [x] Enforce `ai.assistant` on assistant endpoint
- [x] All AI write operations (approve-and-apply) go through the underlying domain command permissions — AI endpoints themselves only read

## Desktop UI

- [x] `AssistantPanel.tsx`: floating panel with chat interface for store Q&A
- [x] `InsightCard.tsx`: shows AI insight with type, headline, supporting data, accept/reject/modify actions
- [x] `InsightFeedback.tsx`: feedback form within InsightCard
- [x] AI Insights page: list of all recent insights grouped by type
- [x] OCR Review panel: shows extracted data fields; each field editable before applying

## Android UI

- [x] Same components adapted for mobile
- [x] OCR triggered from camera on Android

## Tests

- [x] `advisory-only-enforcement.test.ts`: all 11 AI features verified — no write command executed
- [x] `context-assembler.test.ts`: raw DB dump never included; PII redacted when privacy=high; local queries never leave device
- [x] `forecast.test.ts`: identical input produces identical numeric output; LLM narrative schema-validated
- [x] `fraud-detection.test.ts`: deterministic rule-based score; LLM only generates explanation; advisory only
- [x] `store-health-score.test.ts`: each sub-score deterministic; LLM generates narrative + top-3 recommendations; graceful degradation
- [x] `provider-fallback-chain.test.ts`: local fallback verified (never crash); source tag correctly set
- [x] `ocr.integration.test.ts`: OCR returns editable form; manual correction logged; never auto-committed
- [x] `feedback-loop.integration.test.ts`: accept/reject creates feedback record; acceptance rate calculated correctly

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation