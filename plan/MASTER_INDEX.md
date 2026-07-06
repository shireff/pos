# MASTER_INDEX.md — Smart Retail OS Implementation Master Plan

**Source of Truth:** All decisions trace back to the 25 documentation files in `/docs`.
**Build Authority:** Implementation_Pipeline.md Stage/Step order is non-negotiable.
**Golden Rule:** If any step cannot meet its Definition of Done without violating Architecture.md, Security.md, or Sync_Architecture.md — stop and flag. Do not proceed with a workaround.

---

## 1. Phase Overview & Dependency Graph

```
Phase 01: Foundation (Monorepo, shared-kernel, SQLite, Identity domain)
    │
    ▼
Phase 02: Database (Full schema migrations, SQLCipher, seed fixtures)
    │
    ▼
Phase 03: Backend Core (Node.js server scaffold, DI, API shell, Docker)
    │
    ├──────────────────────────────────────────────────┐
    ▼                                                   ▼
Phase 04: Authentication                           Phase 16: Hardware (adapters)
    │                                                   │
    ▼                                                   ▼ (feeds Phase 07)
Phase 05: Products (Catalog + Variants)
    │
    ▼
Phase 06: Inventory (Event-Sourced Stock)
    │
    ▼
Phase 07: Sales (POS, Cart, Payments, Receipts, Hardware integration)
    │
    ├──────────────────────────────────────────────────┐
    ▼                                                   ▼
Phase 08: Purchases (PO lifecycle)             Phase 09: Customers (CRM, Loyalty)
    │                                                   │
    └──────────────┬────────────────────────────────────┘
                   ▼
Phase 10: Suppliers (Supplier ledger, performance)
                   │
Phase 11: Payments (Tenders, split, provider-agnostic plugin layer)
    │
    ▼
Phase 15: Sync (Multi-device, outbox/inbox, LAN+cloud, conflict resolution)
    │
    ├──────────────────────────────┬───────────────────────────────┐
    ▼                              ▼                               ▼
Phase 12: Reports            Phase 13: Notifications         Phase 14: AI
(Read-models, dashboards)    (Dispatcher, channels, triggers) (Gateway, features)
    │                              │                               │
    └──────────────────────────────┴───────────────────────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
Phase 17: Desktop Shell                  Phase 18: Mobile Shell
(Tauri, DI wiring, installers)           (Capacitor, Android)
                   │                               │
                   └───────────────┬───────────────┘
                                   ▼
Phase 19: Security (Audit, encryption, Platform Admin full surface)
                                   │
                                   ▼
Phase 20: Testing (Full regression, E2E, performance benchmarks)
                                   │
                                   ▼
Phase 21: Optimization (Bundle, perf, low-end hardware target)
                                   │
                                   ▼
Phase 22: Release (Localization QA, installers, deploy pipeline, launch)
```

---

## 2. Phase Catalog

| #   | Phase           | Maps to Pipeline Stage  | Complexity         | Status         |
| --- | --------------- | ----------------------- | ------------------ | -------------- |
| 01  | Foundation      | Stage 0                 | Medium             | ⬜ Not Started |
| 02  | Database        | Stage 0 + DB layer      | High               | ⬜ Not Started |
| 03  | Backend Core    | Stage 0 + 4.4           | Medium             | ⬜ Not Started |
| 04  | Authentication  | Stage 0.4               | High               | ⬜ Not Started |
| 05  | Products        | Stage 1.1               | Medium             | ⬜ Not Started |
| 06  | Inventory       | Stage 1.2               | Very High          | ⬜ Not Started |
| 07  | Sales           | Stage 2                 | Very High          | ⬜ Not Started |
| 08  | Purchases       | Stage 3.2               | High               | ⬜ Not Started |
| 09  | Customers       | Stage 3.1               | Medium             | ⬜ Not Started |
| 10  | Suppliers       | Stage 3.2 (partial)     | Medium             | ⬜ Not Started |
| 11  | Payments        | Stage 3 / 2.1           | High               | ⬜ Not Started |
| 12  | Reports         | Stage 6                 | High               | ⬜ Not Started |
| 13  | Notifications   | Stage 6 Step 28         | Medium             | ⬜ Not Started |
| 14  | AI Services     | Stage 7                 | Very High          | ⬜ Not Started |
| 15  | Sync            | Stage 4                 | Critical/Very High | ⬜ Not Started |
| 16  | Hardware        | Stage 2.3               | Medium             | ⬜ Not Started |
| 17  | Desktop Shell   | Stage 2.4 / 3 / 8       | High               | ⬜ Not Started |
| 18  | Mobile Shell    | Stage 2.4 / 3 / 8       | High               | ⬜ Not Started |
| 19  | Security (full) | Stage 5 + 8 + 9         | Very High          | ⬜ Not Started |
| 20  | Testing         | All stages (continuous) | High               | ⬜ Not Started |
| 21  | Optimization    | Stage 9                 | Medium             | ⬜ Not Started |
| 22  | Release         | Stage 9 final           | High               | ⬜ Not Started |

---

## 3. Critical Path

The minimum path from zero to commercial launch:

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 15 → 12 → 14 → 19 → 20 → 21 → 22
                              ↑
                   08 + 09 + 10 + 11 feed in before 07 exit gate
                   16 feeds into 07
                   13 feeds into 12 parallel
                   17 + 18 shells must wrap the completed feature set
```

The single riskiest item in the entire project is **Phase 15 (Sync)**. Every phase that depends on multi-device data correctness — reports, AI, backup — must wait for Phase 15 exit. Do not parallelize Phase 15 with anything else.

---

## 4. High-Risk Modules

| Module                   | Risk      | Reason                                                                 | Mitigation                                                         |
| ------------------------ | --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Phase 15: Sync           | CRITICAL  | Event-sourced conflict resolution; data loss if wrong                  | Dedicated review session, simulation harness before implementation |
| Phase 06: Inventory      | VERY HIGH | Event-sourcing, commutativity, negative-stock guard                    | Property-based tests with random event orderings                   |
| Phase 04: Authentication | VERY HIGH | Offline PIN, JWT rotation, Platform Admin realm separation             | Security tests run as a matrix across all system roles             |
| Phase 14: AI             | HIGH      | Provider fallback chain, advisory-only enforcement, hallucination risk | Dedicated enforcement test at domain/command layer                 |
| Phase 19: Security       | HIGH      | Encryption at rest, license enforcement, audit immutability            | SQLCipher verified in CI; trigger immutability tested at DB layer  |
| Phase 11: Payments       | HIGH      | Split tenders, offline queuing, idempotency                            | clientTxnId idempotency test; tender-sum assertion                 |

---

## 5. Parallelizable Work After Phase 15

Once Phase 15 exits its gate:

- **Phase 12 (Reports)** and **Phase 13 (Notifications)** can run in parallel.
- **Phase 14 (AI)** can start once Phase 12's read-model layer (Step 26 equivalent) is stable.
- **Phase 17 (Desktop)** and **Phase 18 (Mobile)** shell completion can run in parallel.
- **Phase 19 (Security full)** can finalize in parallel with Phase 20 (Testing).

---

## 6. MVP Definition

The minimum product a single-cashier shop can use commercially:

**Requires phases:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 15, 16, 17  
**Excludes initially:** 12, 13, 14, 18, 19 (partial), 20 (partial), 21, 22

MVP exit criteria: A shop owner can create products, receive stock, make a sale offline, process a return, create a purchase order, manage one customer with loyalty, and sync data across two devices with conflict resolution. Hardware (printer, scanner, drawer) works with fallbacks.

---

## 7. Beta Definition

All core modules working and validated for multi-branch, multi-device production use:

**Requires all phases up to 18**, plus Phase 19 (auth/encryption minimum), Phase 20 (E2E flows 1–10).

---

## 8. Stable Release Definition

All 22 phases complete and the Stage 9 final release gate passed on a clean environment.

---

## 9. Required Documents Per Phase

| Phase | Primary Documents                                                   | Secondary Documents                                             |
| ----- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| 01    | Architecture.md, Coding_Standards.md, Project_Structure.md          | Vision.md                                                       |
| 02    | Database.md, Architecture.md                                        | Sync_Architecture.md                                            |
| 03    | Architecture.md, API.md, Coding_Standards.md                        | Database.md                                                     |
| 04    | Security.md, API.md §2, Database.md §2.4–2.5                        | Permission_Matrix.md, Configuration_System.md §8                |
| 05    | Database.md §2.6, API.md §4.1, PRD.md §4.3                          | Business_Rules.md §5, UI_UX.md §2.2                             |
| 06    | Database.md §2.7–2.9, Architecture.md §6, Sync_Architecture.md §3.1 | Business_Rules.md §1, State_Machines.md, Event_Catalog.md §3    |
| 07    | PRD.md §4.4, API.md §4.2, Database.md §2.10, Hardware.md            | Business_Rules.md §2–3, State_Machines.md §2–3, UI_UX.md §2.1   |
| 08    | PRD.md §4.5, Database.md §2.12, API.md §4.4                         | Business_Rules.md §7, State_Machines.md §4, Event_Catalog.md §5 |
| 09    | PRD.md §4.6, Database.md §2.11, API.md §4.5                         | Business_Rules.md §6, Event_Catalog.md §6                       |
| 10    | Database.md §2.12, Reports.md §2.10                                 | AI.md §3, Business_Rules.md §7                                  |
| 11    | PRD.md §4.7, Database.md §2.10, API.md §4.2                         | Business_Rules.md §3–4, State_Machines.md §2                    |
| 12    | Reports.md, Architecture.md §4, API.md §4.6                         | Business_Rules.md §16, UI_UX.md §2.5                            |
| 13    | Notifications.md, Event_Catalog.md                                  | Business_Rules.md §14, State_Machines.md §13                    |
| 14    | AI.md, API.md §4.7, Business_Rules.md §11                           | State_Machines.md §15–16, Testing.md §9                         |
| 15    | Sync_Architecture.md, Database.md §3, API.md §5                     | Business_Rules.md §10, State_Machines.md §10–11, Testing.md §6  |
| 16    | Hardware.md, Architecture.md §5                                     | Business_Rules.md §15, Error_Catalog.md §9                      |
| 17    | Architecture.md §5, Project_Structure.md, UI_UX.md                  | Design_System.md, Configuration_System.md                       |
| 18    | Architecture.md §5, Project_Structure.md, UI_UX.md                  | Design_System.md, Hardware.md §3                                |
| 19    | Security.md, API.md §8, Database.md §2.16.2–2.16.3                  | Business_Rules.md §9, §12, Permission_Matrix.md §21             |
| 20    | Testing.md (all sections), Implementation_Pipeline.md §3–5          | All spec docs                                                   |
| 21    | Testing.md §10, Reports.md §7, Architecture.md §9                   | Configuration_System.md §17                                     |
| 22    | Implementation_Pipeline.md Stage 9, Design_System.md                | Coding_Standards.md §8, Security.md §10                         |

---

## 10. Exit Criteria Summary

| Phase | Exit Criteria                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------- |
| 01    | Monorepo boots; lint rule blocks cross-layer import; shared-kernel types tested                       |
| 02    | Full schema applied to SQLite and Postgres identically; migrations idempotent; SQLCipher verified     |
| 03    | Backend server starts; health endpoint responds; Docker-compose runs locally                          |
| 04    | Online login and offline PIN login work; permission checks reject unauthorized callers                |
| 05    | Product with variants/units/bundles/barcodes can be created and retrieved                             |
| 06    | Event-sourcing commutativity test passes; stock projection correct; batch/expiry enforced             |
| 07    | E2E flows #1 and #2 pass fully offline (single device); receipt prints or fallbacks correctly         |
| 08    | Full PO lifecycle (draft→received) works; goods receipt discrepancy captured                          |
| 09    | Customer created, sale attributed, loyalty points accrue/redeem/reverse correctly                     |
| 10    | Supplier ledger entries post; supplier performance metrics computed                                   |
| 11    | Split-tender sale completes; tender sum == grand_total enforced; clientTxnId idempotent               |
| 12    | Every report renders against seeded multi-branch data; offline parity confirmed                       |
| 13    | Every Notifications.md §3 trigger fires correctly; trial-countdown verified via clock simulation      |
| 14    | All AI features advisory-only; fallback chain tested; no raw AI output to users                       |
| 15    | Full sync suite passes on ≥2 simulated devices + real Desktop+Android pair; E2E flows #5 and #6 pass  |
| 16    | All adapters pass contract tests; every hardware failure falls back gracefully                        |
| 17    | Desktop app bundles; all feature screens navigate; DI wired; offline-first confirmed                  |
| 18    | Android APK builds; camera barcode scan works; bottom tab navigation confirmed                        |
| 19    | Platform Admin auth is realm-separated; trial enforcement tested offline; audit immutability enforced |
| 20    | All 10 E2E flows pass; full permission matrix tested; sync conflict catalog verified                  |
| 21    | POS sale <300ms on low-end hardware baseline; bundle size targets met                                 |
| 22    | Release candidate passes all prior gates simultaneously on a clean environment                        |

---

## 11. Document Index (all 25 source docs)

| Document                   | Role in Project                                               |
| -------------------------- | ------------------------------------------------------------- |
| Vision.md                  | Core philosophy, market, goals                                |
| PRD.md                     | Functional requirements, all 19 modules                       |
| Architecture.md            | Bounded contexts, Clean Architecture, CQRS, event sourcing    |
| Database.md                | Full schema, relationships, indexing, migrations              |
| API.md                     | REST + WebSocket contracts, auth, Platform Admin API          |
| Sync_Architecture.md       | Offline sync, conflict resolution, Class A/B data             |
| AI.md                      | AI Gateway, routing, all AI features, provider abstraction    |
| Design_System.md           | Tokens, components, RTL/LTR, dark mode, motion                |
| UI_UX.md                   | All screens, navigation model, patterns                       |
| Reports.md                 | Report catalog, KPI definitions, dashboards                   |
| Notifications.md           | Dispatcher, triggers, channels, offline queuing               |
| Security.md                | Threat model, auth, encryption, RBAC, Platform Admin security |
| Hardware.md                | HAL interfaces, adapter patterns, fallback behavior           |
| Business_Rules.md          | All business rules (BR-* codes), domain invariants            |
| Development_Plan.md        | Phase order rationale                                         |
| Coding_Standards.md        | TypeScript strict, naming, SOLID, error handling, logging     |
| Testing.md                 | Test pyramid, critical flows, sync/security/AI tests          |
| Project_Structure.md       | Full monorepo tree, package boundary rules                    |
| Implementation_Pipeline.md | Exact step-by-step build execution order                      |
| State_Machines.md          | State transitions for all lifecycle entities                  |
| Event_Catalog.md           | All domain events, producers, consumers, payloads             |
| Error_Catalog.md           | All error codes, HTTP mappings, user messages                 |
| Configuration_System.md    | All settings, scopes, precedence rules                        |
| Permission_Matrix.md       | Full permission matrix for all 17 roles                       |
| Notifications.md           | (see above — separate entry for cross-reference)              |
