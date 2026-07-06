# Phase 15 — AI Services TODO

## AI Gateway

- [ ] Implement `IAIProvider` interface (`packages/application/ai/src/gateway/providers/ai-provider.interface.ts`): `complete(request): Promise<CompletionResult>`, `embed(text): Promise<number[]>`, `classify(request): Promise<ClassificationResult>`, `isAvailable(): Promise<boolean>`
- [ ] Implement `LocalModelProvider`: calls llama.cpp via Tauri sidecar (on Desktop) or embedded model file (on Android); always available offline; lowest latency for short prompts
- [ ] Implement `GroqProvider`: calls Groq API with llama-3.3-70b-versatile model; requires network; highest quality for complex reasoning tasks
- [ ] Implement `GeminiFlashProvider`: calls Gemini Flash API; requires network; good balance of speed and quality
- [ ] Implement `OpenAICompatibleProvider`: slot for any OpenAI-compatible API endpoint; configured via company settings; disabled by default
- [ ] Implement `AIGateway` (`packages/application/ai/src/gateway/ai-gateway.ts`): routing policy — local-first when offline or low-latency-required; cloud when online and quality-required; fallback chain: Groq → Gemini → Local on provider failure; log all routing decisions to ai_routing_log

## Query Classification

- [ ] Implement `QueryClassifier` (`packages/application/ai/src/query-classifier.ts`): classify each query by complexity (low/medium/high), privacy sensitivity (low: aggregate stats; high: individual customer data), latency budget (interactive: <500ms; batch: <30s); output determines provider routing

## Context Assembly

- [ ] Implement `ContextAssembler` (`packages/application/ai/src/context-assembler.ts`): builds structured context payloads from read-model collections; bounded size per query type (max tokens enforced); never includes raw credential fields, password hashes, or raw PII in context; uses aggregated statistics

## AI Features (11)

- [ ] `AssistantFeature`: natural language Q&A over store data; assembles context from top KPIs and recent events; uses Groq/Gemini for response; advisory output only
- [ ] `SalesPredictionFeature`: deterministic baseline (linear regression on daily_sales_rollup); LLM generates narrative summary of trend; human must approve any action based on prediction
- [ ] `InventoryPredictionFeature`: same pattern as sales prediction applied to stock movement trends; outputs suggested reorder quantities; advisory only
- [ ] `FraudDetectionFeature`: rule-based scoring engine (high discount + unusual hour + new cashier = high score); LLM generates explanation for flagged transactions; no automatic blocking — advisory only
- [ ] `StoreHealthScoreFeature`: deterministic composite score from multiple KPIs (weighted formula defined in docs); LLM generates narrative interpretation; score breakdown shown with score
- [ ] `OcrFeature`: full implementation replacing Phase 06 stub; calls vision model (Gemini Flash or GroqVision) with invoice image; extracts structured data (supplier, date, lineItems, totals); returns structured JSON for human review before application
- [ ] `DeadProductDetectionFeature`: queries products with zero sales in configurable period; LLM suggests action (markdown, bundle, discontinue); advisory only
- [ ] `CustomerSegmentationFeature`: RFM model (Recency/Frequency/Monetary) computed deterministically; LLM generates tier names and communication suggestions; no automatic tier assignment
- [ ] `SmartAlertsFeature`: monitors anomaly thresholds (sales drop >30% day-over-day, unusual payment method spikes); LLM generates contextual alert message; alerts are informational only
- [ ] `AnomalyDetectionFeature`: Z-score based anomaly detection on key metrics; flag outliers; LLM explains probable causes
- [ ] `CashFlowPredictionFeature` (scaffold): basic cash flow projection from historical payment data; LLM narrative; full sophistication in future iteration

## Advisory-Only Enforcement

- [ ] Implement advisory-only guard at Application/command layer: no AI feature handler is allowed to directly call a write command; AI outputs are wrapped in `AiInsight` record; write commands can only be called by human-initiated handlers
- [ ] Write mandatory test `advisory-only-enforcement.test.ts`: for each AI feature, verify that calling the feature handler does not result in any write command being executed; mock all write commands and assert mock was NOT called

## Feedback Loop

- [ ] Implement ai_insight_feedback collection: stores accept/reject/modify per AiInsight record; used to track which providers and context configurations lead to accepted recommendations

## Provider Fallback Test

- [ ] `provider-fallback-chain.test.ts`: simulate GroqProvider failure; verify GeminiFlashProvider is tried next; simulate both failing; verify LocalModelProvider is used; simulate all failing; verify graceful error returned (never a crash)

## API Endpoints

- [ ] `POST /v1/ai/assistant` — body: question string → response
- [ ] `GET /v1/ai/insights` — list latest AI insights by type
- [ ] `POST /v1/ai/insights/:id/feedback` — body: action enum(accept/reject/modify), modifiedValue optional
- [ ] `POST /v1/ai/ocr` — body: fileReference → extracted invoice data

## Permissions

- [ ] Enforce `ai.view` on GET insights
- [ ] Enforce `ai.assistant` on assistant endpoint
- [ ] All AI write operations (approve-and-apply) go through the underlying domain command permissions — AI endpoints themselves only read

## Desktop UI

- [ ] `AssistantPanel.tsx`: floating panel with chat interface for store Q&A
- [ ] `InsightCard.tsx`: shows AI insight with type, headline, supporting data, accept/reject/modify actions
- [ ] `InsightFeedback.tsx`: feedback form within InsightCard
- [ ] AI Insights page: list of all recent insights grouped by type
- [ ] OCR Review panel: shows extracted data fields; each field editable before applying

## Android UI

- [ ] Same components adapted for mobile
- [ ] OCR triggered from camera on Android

## Tests

- [ ] See TESTS.md
