# Development_Plan.md — Smart Retail OS Phased Development Plan

**Depends on:** Vision.md, PRD.md, Architecture.md
**Feeds into:** Implementation_Pipeline.md (this document explains _why_ the order is safe at a high level; Implementation_Pipeline.md defines the granular _how/when_)
**Relationship to Implementation_Pipeline.md:** This document answers "what belongs in which phase and why that sequencing protects the business." Implementation_Pipeline.md answers "what is the exact next step an AI coding agent should execute." Read this one first for reasoning, then Implementation_Pipeline.md for execution.

## 1. Planning Principles

- **Risk-ordered, not feature-ordered.** The build order is driven by which guarantees, if wrong, are most expensive to fix later — not by which features are most exciting or most requested. This is why Multi-Device Sync (Stage 4) is built before AI (Stage 7): a sync bug discovered after AI/reporting are built would force rework across every dependent layer, while an AI feature built slightly later costs only calendar time.
- **Nothing ships on unstable foundations.** Every phase below assumes its prerequisite phase's exit criteria (§3) are met — this mirrors the Stage exit gates in Implementation_Pipeline.md, but at the coarser phase level a founder or stakeholder would track.
- **Vertical slices over horizontal layers where possible.** Within a phase, functionality is built as complete, testable, usable slices (e.g., "a product can be created, stocked, and sold end-to-end") rather than "build all of Catalog everywhere, then all of Sales everywhere" — this keeps the product demoable and testable at every milestone, not just at phase boundaries.
- **Offline-first and event-sourced inventory are non-negotiable from Phase 1** — these are architectural properties (Architecture.md §§6–7) that cannot be safely retrofitted; every phase below assumes they exist from the first line of Sales/Inventory code, not added later.

## 2. Phases

### Phase 0 — Foundation

**Goal:** a working, testable, empty skeleton — nothing user-facing yet, but every architectural guarantee (layering, offline storage, auth) proven before any business feature is built on top of it.
**Maps to:** Implementation_Pipeline.md Stage 0.
**Why first:** every other phase's code depends on the layer-boundary rules, the local encrypted database, and offline-capable auth being correct. A mistake here (e.g., a leaky Domain→Infrastructure dependency) compounds across the entire codebase the longer it goes unnoticed.

### Phase 1 — Core Single-Device Operations

**Goal:** a shop can run its entire day-to-day operation — catalog, inventory, point of sale, customers, suppliers, pricing — on a **single device**, fully offline, with zero sync yet.
**Maps to:** Implementation_Pipeline.md Stages 1–3.
**Why before sync:** proving the domain logic (stock math, sale totals, discount rules, tax) correct on one device first isolates bugs to business logic rather than conflating them with sync/conflict bugs. It also means the product is demoable and internally usable (dogfooding on the founder's own reference shop) well before the hardest engineering problem (sync) is tackled.
**Exit criteria:** a full purchase → stock → sale → loyalty loop, plus a stock transfer, works correctly offline on one device with no data loss across app restarts.

### Phase 2 — Multi-Device Synchronization

**Goal:** the same business data stays consistent and conflict-safe across multiple Desktop/Android devices, online or offline, with event-sourced inventory reconciliation.
**Maps to:** Implementation_Pipeline.md Stage 4.
**Why its own isolated phase:** this is the highest-risk, highest-scrutiny piece of the entire system (per Vision.md's top-ranked risk: zero data loss and correct conflict resolution outrank feature velocity). It is deliberately _not_ parallelized with anything else and gets a dedicated review session (Implementation_Pipeline.md §5) — bundling sync work with other feature work would make it harder to isolate the source of a sync defect.
**Exit criteria:** the full sync test suite passes across ≥2 simulated devices and one real Desktop+Android pair; every conflict scenario in Sync_Architecture.md §3 is verified.

### Phase 3 — Business Intelligence Layer (Parallel Streams)

**Goal:** the data now flowing reliably across devices (Phase 2) is turned into value: backups/licensing (so the business is safe to depend on commercially), reports/notifications (so an owner can see what's happening), and AI (so the product delivers on its core differentiator).
**Maps to:** Implementation_Pipeline.md Stages 5/6/7 (parallel work-streams).
**Why parallel is safe here, but wasn't earlier:** these three streams only depend on Phase 2's stable synced data model, not on each other — Backup/Licensing, Reports, and AI are independent consumers of the same foundation. The one internal ordering constraint carried over from Implementation_Pipeline.md: **Reports' read-model layer must lead AI by at least one step**, since AI's forecasts and Store Health Score are computed from those same read models (AI.md §§3, 7) — building AI against a read-model shape that's still changing would mean rework.
**Exit criteria:** fresh-device restore reproduces full state with zero data loss; every report renders correctly against seeded multi-branch data; every AI feature is verified advisory-only (no auto-execution) by a dedicated enforcement test.

### Phase 4 — Compliance & Enterprise Depth

**Goal:** the platform grows from "single shop, single company" assumptions to genuinely multi-company, enterprise-capable, and regulator-ready (ETA e-invoicing).
**Maps to:** Implementation_Pipeline.md Stage 8.
**Why last among functional phases:** these features (custom role builder, multi-company cross-visibility, ETA activation) serve growth-stage and Priority 2/3 customers (Vision.md §6), not the Priority 1 launch segment (grocery/mini-market). Building them before the core product is proven with real Priority 1 customers would be premature investment in capabilities the initial customer base doesn't need yet.
**Exit criteria:** enterprise-tier scenario walkthrough (custom role, multi-company view, sandbox ETA submission) passes.

### Phase 5 — Hardening & Launch Readiness

**Goal:** the product is ready for real paying customers — regression-tested, performant on low-end hardware, security-audited, fully localized, and deployable.
**Maps to:** Implementation_Pipeline.md Stage 9.
**Why a distinct phase rather than "done throughout":** while tests/docs/review happen continuously within every step (Implementation_Pipeline.md §§3–5), a dedicated hardening pass catches cross-cutting issues (performance under real low-end hardware, full-system security audit, localization QA across the whole surface) that only appear once the full feature set exists — these classes of issue can't be fully caught piecemeal, one step at a time.
**Exit criteria:** a release candidate passes every prior phase's exit criteria simultaneously on a clean environment.

## 3. Phase Exit Criteria — Summary Table

| Phase                       | Exit Criteria (abbreviated)                                                           | Detailed Gate                               |
| --------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| 0 — Foundation              | User created, offline login works, both shells boot against encrypted local SQLite    | Implementation_Pipeline.md Stage 0 gate     |
| 1 — Core Single-Device      | Full purchase→stock→sale→loyalty loop + transfer, offline, one device                 | Implementation_Pipeline.md Stage 3 gate     |
| 2 — Multi-Device Sync       | Sync suite passes on ≥2 devices + 1 real device pair; all conflict scenarios verified | Implementation_Pipeline.md Stage 4 gate     |
| 3 — Business Intelligence   | Backup/restore zero-loss; reports render correctly; AI advisory-only enforced         | Implementation_Pipeline.md Stage 5/6/7 gate |
| 4 — Compliance & Enterprise | Enterprise scenario walkthrough passes                                                | Implementation_Pipeline.md Stage 8 gate     |
| 5 — Hardening & Launch      | RC passes every prior gate simultaneously, clean environment                          | Implementation_Pipeline.md Stage 9 gate     |

## 4. Relationship to Business Milestones

- **Phase 1 exit** is the earliest point the founder can dogfood the product on a real reference shop — the first meaningful validation point ahead of any external customer.
- **Phase 2 exit** is the earliest point the product can be sold to a multi-cashier or multi-branch business — a single-device-only product cannot yet serve most Priority 1 target customers (Vision.md §6) who run more than one register.
- **Phase 3 exit** is the earliest point the product is _differentiated_ per the competitive strategy (Vision.md §7 — deep AI integration is competitive advantage #1) — before this, the product is a capable offline POS but not yet the "AI-first retail OS" the Vision document describes.
- **Phase 5 exit** is the commercial launch readiness point tied to the business objective of reaching EGP 20,000 MRR within 6 months (Vision.md §3) — the clock on that goal effectively starts here, not before.

## 5. Change Control

- This document changes only when the phase-level sequencing itself changes (e.g., a new phase is discovered to be necessary, or two phases are found to be safely parallelizable that weren't thought to be) — matching the same low-churn expectation Implementation_Pipeline.md sets for itself (§4).
- Any change to phase order must be checked against §1's Planning Principles before being adopted — if a proposed reordering would place a feature-rich phase ahead of an unproven risk-heavy one (e.g., building AI before Sync is proven), it violates the founding rationale of this plan and should be rejected rather than accommodated.

---

_Development_Plan.md — read this for the *why* behind the build order; read Implementation_Pipeline.md for the exact step-by-step *how*._
