# Implementation_Pipeline.md ⭐ — Smart Retail OS Build Execution Order

**This is the second most important document after PRD.md.** Development_Plan.md defines _what_ is in each phase and why the order is safe at a high level. This document defines the **exact, granular execution sequence**: which module to build first, what must be finished before the next module starts, who/what depends on whom, and precisely when to write tests, documentation, and trigger a review — so an AI coding agent always knows the single next correct action.

## 0. How to Read This Document

Each **Step** below is a unit of work an AI coding agent can execute end-to-end. A step is not "done" until its Definition of Done is met **and** its Testing + Documentation + Review checkpoints are completed — these are not deferred to "later," they are part of the step itself. Steps within the same Stage may sometimes be parallelized; Stages themselves are strictly sequential (a Stage cannot begin until the prior Stage's exit gate passes).

## 1. Dependency Graph (Stage Level)

```
Stage 0: Foundation
   │
   ▼
Stage 1: Catalog & Inventory ──────────┐
   │                                    │
   ▼                                    │
Stage 2: Point of Sale (single device)  │
   │                                    │
   ▼                                    │
Stage 3: Customers, Suppliers,          │
         Purchasing, Pricing            │
   │                                    │
   ▼                                    │
Stage 4: Multi-Device Sync  ◄───────────┘  (needs real data from Stages 1–3 to sync)
   │
   ├──────────────┬──────────────┐
   ▼              ▼              ▼
Stage 5:       Stage 6:       Stage 7:
Backup,        Reports &      AI Services
Licensing,     Notifications  (needs Stage 6 read models)
Trial/Paywall,     │              │
Minimal            │              │
Platform Admin     │              │
   │              │              │
   └──────────────┴──────────────┘
                  │
                  ▼
     Stage 8: Compliance, Advanced
              Permissions, Multi-Company,
              Full Platform Admin Console
                  │
                  ▼
     Stage 9: Hardening & Launch Readiness
```

Stages 5, 6, and 7 may run **in parallel** by different work-streams once Stage 4 exits, since they don't depend on each other directly (only on Stage 4's stable synced data model) — but Stage 7 (AI) internally depends on Stage 6's read models being finalized first, so within that parallel block, Stage 6 should lead Stage 7 by at least one full step.

**Platform Administration sequencing note (new):** a full-featured Platform Admin console (custom dashboards, deep analytics, multi-admin role management) is legitimately a Stage 8 concern — but a **minimal** Platform Admin surface (view accounts, change plan, suspend/reactivate, extend trial, separate MFA-gated auth) is launch-blocking, not a nice-to-have, because the 14-day-trial-then-paywall business model (§2, Stage 5) is unenforceable/unmanageable in production without it — a subscription can transition to `trial_expired` correctly without any admin tooling, but if a real customer needs a manual plan override, a comped extension, or a suspension, there must already be a way to do that before real paying customers exist. **This minimal slice is therefore pulled forward into Stage 5**, alongside trial/paywall enforcement, rather than left in Stage 8. Stage 8 Step 32 is narrowed accordingly (see below) to cover only the advanced/enterprise parts of Platform Administration (multi-admin roles, deeper analytics) that are genuinely deferrable.

## 2. Step-by-Step Sequence

### STAGE 0 — Foundation

1. **Step 0.1** — Monorepo scaffold, lint/CI, tsconfig, Coding_Standards.md rules encoded as lint config.
   - _Test:_ CI pipeline runs and fails correctly on a deliberately introduced lint violation.
   - _Docs:_ `README.md` at repo root explains how to run/build/test.
   - _Review Gate:_ Confirm layer-boundary lint rule actually blocks a Domain→Infrastructure import before proceeding — this is the single most important guardrail in the whole project.
2. **Step 0.2** — `shared-kernel` package (Money, DateTime, Identifiers, Result type, Domain Event base).
   - _Test:_ Unit tests for Money arithmetic edge cases (rounding, negative-guard) and Result type composition.
   - _Docs:_ Package README documenting each exported type's contract.
3. **Step 0.3** — MongoDB local embedded database setup, validation schemas, migration runner.
   - Configure MongoDB encrypted storage engine (field-level encryption via libmongocrypt) at initialization — encryption is set up as part of database initialization, not as a separate subsequent step.
   - _Test:_ Migration runner applies a sequence of migration scripts correctly and is idempotent on re-run; validation schemas reject documents that violate field constraints.
     3b. **Step 0.3b** — Backup infrastructure setup: local disk adapter (`local-disk.adapter.ts`), Supabase Storage adapter (`supabase-storage.adapter.ts`), offline backup queue (`backup-queue.ts`), backup scheduler (`backup-scheduler.ts`) — as described in `packages/infrastructure/backup/` (Project_Structure.md §2) and Database.md §9.
   - _Test:_ Local disk backup creates a correctly encrypted, compressed snapshot; queue holds and replays uploads when connectivity is simulated offline then restored.
4. **Step 0.4** — Identity & Access domain + offline-capable authentication (JWT/PIN).
   - _Test:_ Login works fully offline once a user has previously synced; permission checks reject unauthorized actions.
   - _Review Gate (Stage exit):_ A user can be created, log in offline, and both app shells (Tauri, Capacitor) boot against the local encrypted MongoDB instance. **Do not start Stage 1 until this gate passes.**

### STAGE 1 — Catalog & Inventory

5. **Step 1.1** — Catalog context: Product, Variant, Category, UnitOfMeasure, Barcode entities + use cases (create/edit/archive product, generate barcode).
   - _Depends on:_ Step 0.4 (permission-gated actions).
   - _Test:_ Unit tests per business rule (e.g., bundle stock deduction ratio, unit conversion math).
6. **Step 1.2** — Inventory context: event-sourced Stock Movement, Warehouse, Batch/expiry, thresholds.
   - _Depends on:_ Step 1.1 (movements reference products).
   - _Test:_ Property-based test — apply stock events in every order, assert identical final total (Testing.md §6).
7. **Step 1.3** — Catalog/Inventory UI screens.
   - _Depends on:_ Steps 1.1–1.2.
   - _Review Gate (Stage exit):_ A product with variants/units can be created, received into stock, and adjusted; event-sourcing commutativity test passes. **Do not start Stage 2 until this gate passes.**

### STAGE 2 — Point of Sale

8. **Step 2.1** — Sales context: Order/Cart, line items, split payments, returns (domain + use cases).
   - _Depends on:_ Stage 1 exit (needs real products/stock to sell against).
9. **Step 2.2** — Cash drawer session management.
   - _Depends on:_ Step 2.1.
10. **Step 2.3** — Hardware layer v1 (ESC/POS printing, barcode scanning input handling, drawer pulse), with digital-receipt fallback.
    - _Depends on:_ Step 2.1 (needs a completed sale to print).
    - _Test:_ Adapter contract tests with simulated device I/O (Testing.md §7).
11. **Step 2.4** — POS cashier UI.
    - _Depends on:_ Steps 2.1–2.3.
    - _Review Gate (Stage exit):_ Critical E2E flows #1 and #2 from Testing.md §4 pass fully offline on a single device. **Do not start Stage 3 until this gate passes.**

### STAGE 3 — Customers, Suppliers, Purchasing, Pricing

12. **Step 3.1** — CRM context: Customer, Loyalty, Credit.
13. **Step 3.2** — Purchasing context: Supplier, Purchase Order, Supplier Invoice, Goods Receipt.
    - _Depends on:_ Stage 1 (receiving affects stock).
14. **Step 3.3** — Pricing context: Discounts, Coupons, Campaigns.
    - _Depends on:_ Step 2.1 (applied during sale).
15. **Step 3.4** — Tax engine v1 (Egypt default, ETA fields present but inactive).
    - _Review Gate (Stage exit):_ Critical E2E flow #3 (transfer) and a full purchase→stock→sale→loyalty loop pass offline on one device. **Do not start Stage 4 until this gate passes.**

### STAGE 4 — Multi-Device Synchronization ⭐ (highest-scrutiny stage in the project)

16. **Step 4.1** — Sync Engine core: outbox/inbox, event serialization, idempotent replay.
    - _Depends on:_ Stages 1–3 (real domain events to synchronize).
    - _Test:_ Idempotency test — replaying the same event twice must not double-apply it.
17. **Step 4.2** — Conflict detection + field-level merge (non-inventory entities) + event-sourced merge (inventory).
    - _Test:_ Every conflict scenario cataloged in Sync_Architecture.md §3, run through the multi-device simulation harness (Testing.md §6).
18. **Step 4.3** — Transport layer: LAN/peer-to-peer discovery + Supabase Realtime cloud relay channel + WebSocket fallback to self-hosted backend + auto-selection (Sync Architecture.md §7).
19. **Step 4.4** — Backend sync server (Docker-packaged, self-hostable) — **first real backend deployment of the project.**
20. **Step 4.5** — Device registration & Device Trust (Security.md §1).
21. **Step 4.6** — Conflict-review UI (manager/owner-facing).
    - _Review Gate (Stage exit — the strictest gate in the pipeline):_ Full sync test suite passes across ≥2 simulated devices AND one real Desktop+Android pair; critical E2E flows #5 and #6 (Testing.md §4) pass. **No later stage may begin until this gate passes — a regression discovered later in any stage that touches this guarantee blocks that stage's own merge, not just this one.**

### STAGE 5 / 6 / 7 — Parallel Work-Streams (all depend on Stage 4 exit)

**Stream A — Stage 5: Backup, Licensing, Trial/Paywall & Minimal Platform Admin** 22. Incremental encrypted backup + restore + integrity verification (local disk primary, Supabase Storage secondary, per Database.md §9). 23. Licensing/subscription entitlements + hybrid offline validation + 14-day full-featured trial flow (`subscriptions.status` lifecycle: `trialing` → `active`/`trial_expired`; Security.md §6.2, API.md §4.8). 24. **Trial/paywall enforcement:** the cross-cutting Application-layer write-lock guard (Architecture.md §7 exception) that rejects state-changing commands when `status` is `trial_expired` or `suspended`, plus the client-side cached-`trialEndsAt` self-lock for offline devices. This must ship before any external trial user could plausibly reach day 14, so it cannot slip into Stage 8.

- _Test:_ Simulated clock-advance test proving a device that goes offline before trial end and stays offline past it still self-locks locally (Security.md §6.2); server-side rejection test for `POST /v1/sync/push` during `trial_expired` (API.md §5.1).

25. **Minimal Platform Admin surface** (`apps/platform-admin`, Architecture.md §3.1): separate MFA-gated admin auth (Security.md §11.1–11.2), accounts list/search, account detail, plan-change/suspend/reactivate/trial-extend actions with mandatory reason (API.md §8), and the separate `platform_admin_actions` audit trail (Security.md §11.4). Full custom-role/multi-admin-permission management for this console is deferred to Stage 8 — v1 assumes a small, trusted set of admin accounts.

- _Test:_ A tenant access token is rejected by every `/v1/platform-admin/*` endpoint and vice versa (Security.md §11.1); five failed MFA attempts locks the admin account (Security.md §11.3); every plan/suspend/reactivate/trial-extend action requires a non-empty `reason` and produces exactly one `platform_admin_actions` row.
- _Review Gate:_ Fresh-device restore reproduces full state with zero data loss; license/trial honors offline grace period and self-lock; a Platform Admin can suspend and reactivate a real test account end-to-end, and the change reaches an already-online device via the sync stream (API.md §5.4) within the expected latency. **No later stage may begin selling/onboarding real customers until this gate passes — it is the commercial-readiness gate, distinct from Stage 4's technical-readiness gate.**

**Stream B — Stage 6: Reports & Notifications** (should lead Stream C by ≥1 step since Stage 7 consumes its read models) 26. Read-model materialization layer (feeds every report). 27. Full report catalog (Reports.md) + role-based dashboards. 28. Notification dispatcher + channel adapters + trigger wiring (Notifications.md), including the trial-countdown/expired and Platform-Admin-action triggers added to the catalog (Notifications.md §3, §10). - _Review Gate:_ Every report renders correctly against seeded multi-branch synced data, online and offline; trial-countdown notifications fire correctly at day 10/13/expiry against a simulated clock.

**Stream C — Stage 7: AI Services** (starts once Stage 6 Step 26 — read models — is stable) 29. AI Gateway + provider adapters (Groq, Gemini Flash, local model) with fallback routing. 30. Must-have AI features (AI.md): Assistant, Sales/Inventory Prediction, Smart Alerts, Store Health Score, Fraud Detection, Dead Product Detection, Branch Comparison, Cash Flow Prediction, Customer Segmentation, basic OCR, Anomaly Detection. 31. Unified AI Insights dashboard. - _Review Gate:_ Every AI feature is advisory-only (no auto-execution) verified by a dedicated enforcement test at the domain/command layer, not just AI-layer intent; provider-fallback test passes; AI features remain fully available throughout the 14-day trial with no separate gating logic (Security.md §6.2's "no crippled trial" rule).

**Stage 5/6/7 exit gate (all three streams must close before Stage 8 begins).**

### STAGE 8 — Compliance, Advanced Permissions, Multi-Company Depth, Full Platform Admin Console

32. ETA e-invoice module (dormant-by-default activation path).
33. Custom role/permission builder (tenant-facing RBAC, Security.md §4).
34. Multi-company Owner cross-visibility + **advanced/full platform-admin console depth**: multi-admin accounts with distinct permission levels within Platform Administration itself, deeper account analytics/segmentation, bulk operations — the minimal single-tier admin console shipped in Stage 5 (Step 25) is extended here, not rebuilt.
35. Approval workflow configuration UI.
    - _Review Gate:_ Enterprise-tier scenario walkthrough (custom role, multi-company view, sandbox ETA submission, multi-admin Platform Admin scenario) passes.

### STAGE 9 — Hardening & Launch Readiness

36. Full regression suite (Testing.md §11).
37. Performance tuning against low-end hardware baseline (NFR-1).
38. Security audit checklist pass (Security.md), including a dedicated Platform Admin compromise-response drill (Security.md §11.5).
39. Localization QA (Arabic MSA UI, Egyptian Arabic AI tone, English, RTL/LTR) — tenant apps only; Platform Admin console (§2.7 in UI_UX.md) is English-only for v1, being an internal tool.
40. Deployment pipeline finalization (installers, APK signing/distribution, update mechanism, plus separate deployment/hosting for `admin-api.<domain>` and `apps/platform-admin`, API.md §8).
    - _Final Review Gate:_ Release candidate passes every prior stage's gate simultaneously on a clean environment before tagging a release.

## 3. When to Write Tests

**Always within the same step, never deferred.** A step's Definition of Done explicitly includes its test suite passing — a step that "works" but has no tests is not complete. Sync-related steps (Stage 4) additionally require the multi-device simulation harness to exist _before_ the conflict-resolution logic is considered implemented, not after (test-first for this stage specifically, given its risk ranking). Trial/paywall and Platform Admin steps (Stage 5, Steps 24–25) additionally require the clock-advance/offline-self-lock test and the cross-realm-token-rejection test to exist before those features are considered implemented, given their status as the commercial-readiness gate.

## 4. When to Write Documentation

- **Inline doc comments and package READMEs:** written as part of the same step that introduces the code (Coding_Standards.md §7).
- **Spec documents (PRD.md, Database.md, API.md, etc.):** updated in the same PR whenever a step changes or refines a decision those documents made — documentation drift is treated as a bug.
- **This pipeline document itself:** updated only when the Stage/Step sequence genuinely changes (e.g., a new dependency discovered) — not for routine progress tracking, which belongs in project management tooling, not this file.

## 5. When to Trigger Review

- **Every Step** ends in a PR (Coding_Standards.md §8) — reviewed even in a solo-founder + AI-agent workflow, since the PR is the concrete artifact the founder checks against this pipeline's Definition of Done before merging.
- **Every Stage exit gate** (bolded above) is a mandatory manual checkpoint — the founder explicitly confirms the gate's criteria before instructing any AI agent to begin the next Stage. This is the single most important control point in the entire build process: it is the mechanism that prevents compounding architectural mistakes across stages.
- **Stage 4's exit gate** additionally requires a dedicated review session (not just a PR approval) given its designation as the highest-risk stage in the project.
- **Stage 5's Platform Admin/trial steps (24–25)** additionally require the founder to personally exercise every Platform Admin action (suspend, reactivate, plan change, trial extend) against a real test account before this gate is considered passed, given that this is the surface with the largest blast radius if a bug ships (Security.md §11).

## 6. Golden Rule

If at any point a step cannot meet its Definition of Done without violating a rule in Architecture.md, Security.md, or Sync_Architecture.md, **stop and flag it** rather than proceeding with a workaround — these three documents encode the non-negotiable guarantees the rest of the system assumes are always true.

---

_Implementation_Pipeline.md — read this document first when deciding "what do I build next." Read Development_Plan.md for the reasoning behind the ordering, and the individual spec documents for the how._
