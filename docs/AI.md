# AI.md — Smart Retail OS AI Architecture

**Depends on:** PRD.md §4.13, Architecture.md, API.md §4.7
**Governing rule:** AI recommends, predicts, and explains. AI never executes an irreversible action (price change, deletion, purchase order creation) without explicit owner approval.

## 1. Model Routing & Provider Abstraction

All AI features go through a single **AI Gateway** (`packages/infrastructure/ai-clients`) implementing a provider-agnostic interface:

```
interface AIProvider {
  complete(prompt: PromptSpec): Promise<AIResponse>
  supportsOffline(): boolean
}
```

Registered clients/providers: `LocalModelProvider` (on-device quantized small model for offline/simple tasks) and `NaraRouterClient` which integrates directly with NaraRouter (`https://router.bynara.id/v1`). Under a strict 5 million token budget, cloud-based requests are directed to the whitelisted models:

1. `kimi-k2.7-code-free` (primary for structured extraction, invoice OCR, and advanced logical workflows)
2. `mistral-large` (primary for complex analytics, reasoning, and open-ended business advisory)
3. `mistral-medium-3-5` (primary for fallback routing and general interactive queries)

No feature calls external AI provider SDKs directly — all requests are strictly validated at the gateway to ensure they conform to this whitelist.

**Routing policy (hybrid model, per PRD FR — AI Assistant):**

1. If offline, or the query is classified as "simple" (lookup, basic report, known FAQ) → `LocalModelProvider`.
2. If online and the query is classified as "complex" (forecasting, multi-factor analysis, open-ended business question) → `NaraRouterClient` with fallback routing among the whitelisted models (e.g. `mistral-large` or `kimi-k2.7-code-free` falling back to `mistral-medium-3-5` if rate limits, token budget alerts, or errors occur) to strictly conserve the 5 million tokens limit.
3. Every AI response tags `source: "local" | "nara_router:kimi-k2.7-code-free" | "nara_router:mistral-large" | "nara_router:mistral-medium-3-5"` so the UI can indicate depth/confidence and track usage auditing.

## 2. AI Assistant ("Chat with your business data")

- **Query classification step** runs before routing (§1) using lightweight local heuristics/embeddings — no cloud call needed just to decide where to send the real query.
- **Context assembly:** the assistant never sends raw database dumps to a cloud provider. A retrieval step pulls only the relevant pre-aggregated read-model slices (e.g., "last 30 days sales by category for branch X") into the prompt — minimizing both cost and any customer-data exposure to third-party providers.
- **Prompt Architecture:**
  - System prompt fixed per deployment, defines: persona (helpful Egyptian retail business advisor), tone (Egyptian Arabic, matching the founder's established LinkedIn voice preferences), strict scope (only answer from provided business-data context; never fabricate figures), and output-format contract (structured JSON when the answer feeds a UI widget, natural language when it's a direct chat reply).
  - User prompt = classified intent + retrieved context + the literal question.
  - Output is validated against an expected schema before being shown; malformed/off-schema responses trigger one automatic retry, then a graceful "couldn't compute that — try rephrasing" fallback rather than showing garbled output.

## 3. Sales & Inventory Prediction

- Implemented as a **scheduled batch job** (backend worker, not synchronous per-request AI calls) that runs nightly per branch: pulls the event-sourced sales/stock history read model, computes forecasts (statistical time-series model as the deterministic baseline — e.g., seasonal decomposition/moving averages — with the LLM layer used only to generate the _natural-language explanation_ of the forecast, not to compute the numbers itself). This keeps the actual predicted numbers deterministic, auditable, and free of hallucination risk, while still giving the "AI-explained" feel the product positioning requires.
- Inventory prediction reuses the same forecast to compute recommended reorder points/quantities and preferred supplier suggestions (from historical price/delivery performance), written to `ai_predictions` for the owner to review and accept (never auto-applied, per PRD FR and Governing rule above).

## 4. Fraud & Theft Detection

- Rule-based anomaly scoring as the deterministic core (excessive discounts, high return rate per cashier, drawer-open-without-sale events, inventory shrinkage vs. sales mismatch, duplicate transaction fingerprints, price manipulation patterns) — each rule contributes a weighted signal to a per-employee/per-branch **fraud risk score**, recalculated on a rolling window.
- LLM layer used only to synthesize a human-readable explanation ("Cashier X's void rate is 3.2x the branch average over the last 7 days, concentrated on Tuesday evenings") — never to _decide_ the score itself, keeping the flagging logic deterministic, explainable, and free of black-box drift that could damage owner trust (directly addressing the founder's flagged risk: "AI recommendations losing user trust").
- All fraud alerts are advisory; no automated account suspension or punitive action is ever taken by the system.

## 5. OCR — Supplier Invoice Processing

- Pipeline: image upload (`POST /v1/supplier-invoices/ocr`) → OCR text extraction (Arabic + English printed text, per PRD scope) → structured field extraction (supplier name, line items, quantities, unit prices, totals) via an LLM-assisted parsing step constrained to a strict output schema → results shown to the Purchasing Officer as an **editable pre-filled form**, never auto-committed to the purchase/supplier-invoice records.
- **Continuous improvement loop:** every manual correction the user makes to OCR output is logged (`ai_insight_feedback`-style table) and used to refine prompt few-shot examples and/or fine-tune extraction heuristics over time, per the founder's requirement that corrections improve future recognition quality.
- Handwritten invoice support is explicitly out-of-scope for v1 (per PRD §8) but the pipeline's field-extraction contract is designed to accept a future handwriting-OCR pre-processing stage without changing the downstream schema.

## 6. Recommendation Engine (Dynamic Pricing, Dead Products, Product Placement)

- **Dynamic pricing:** analyzes margin, competitor-agnostic internal velocity/elasticity signals, and stock aging to produce a suggested price change with rationale; requires explicit owner approval before any price record is touched — enforced at the domain layer (the `UpdatePriceCommand` has no "AI-originated auto-approve" path; it is architecturally identical to a manual price edit).
- **Dead product detection:** rule-based (zero/near-zero velocity over a configurable window relative to stock age) surfaced on the Store Health dashboard with suggested actions (discount, bundle, discontinue) — advisory only.
- **Product placement (Phase 2):** deferred per PRD AI priority ranking; architecture reserves a slot in the AI Gateway/read-model layer but is not built for v1.

## 7. Store Health Score & Unified AI Dashboard

- A single composite score aggregates sub-scores: Sales Health, Inventory Health, Financial Health, Employee Health, Customer Health — each sub-score computed deterministically from its domain's read models (not from an LLM), with the LLM layer generating only the narrative summary and top 3 recommended actions shown alongside the score.
- Anomaly detection feeding this dashboard runs as scheduled jobs comparing current-period metrics against trailing baselines per branch, flagging statistically significant deviations (configurable sensitivity per company).

## 8. Customer Segmentation & Churn

- Segmentation is a deterministic clustering job (RFM-style: recency/frequency/monetary) run nightly per company against identified customers (phone/loyalty ID/customer code — per PRD, AI customer features require an identifiable customer, so guest/anonymous sales are excluded from this analysis).
- Churn probability (Phase 2, per PRD AI priority ranking — flagged as not required for v1 launch) will layer a lightweight statistical model on top of the same segmentation read model once sufficient historical data exists per tenant.

## 9. Caching & Cost Control

- All cloud-AI responses for non-personalized, cacheable query shapes (e.g., "explain this week's sales trend") are cached per company/branch/time-window to avoid redundant paid API calls for repeated similar questions.
- Local model handles the majority of simple/offline queries by design (§1), keeping cloud-provider usage — and therefore cost — concentrated only on genuinely complex requests, consistent with the project's free/low-cost-first philosophy.

## 10. Evaluation Strategy

- Every AI-generated recommendation (pricing, reorder, fraud flag) writes an `ai_insight_feedback` record when the owner accepts or rejects it.
- A recurring internal report tracks **acceptance rate per AI feature** — a declining acceptance rate is treated as an early-warning signal that a feature's model/rules need retuning, directly operationalizing the founder's stated fear of "AI predictions losing user trust" into a measurable, monitored metric rather than a vague concern.

## 11. Future AI Roadmap

Computer-vision shelf analysis, voice AI assistant, autonomous (opt-in) recommendation execution, advanced supplier-negotiation intelligence — all deferred per PRD §9, with the AI Gateway's provider-agnostic design ensuring none of these require foundational rearchitecture when built.

---

_AI.md — every feature here is advisory-only unless explicitly stated otherwise; enforcement of that rule lives at the domain/command layer, not just in AI-layer intent._
