# Project_Structure.md — Smart Retail OS Repository & Folder Structure

**Depends on:** Architecture.md §5, Coding_Standards.md §2
**Feeds into:** Implementation_Pipeline.md Step 0.1 (monorepo scaffold) — this document is the authoritative full tree; Architecture.md §5 gives the high-level rationale, this document gives the complete, navigable layout.

## 1. Monorepo Overview

Smart Retail OS is a single monorepo (npm/pnpm workspaces) containing three deployable apps (Desktop, Android, Backend) and a set of shared packages implementing the layered Clean Architecture described in Architecture.md §2. One repository, one versioned history, one CI pipeline — chosen specifically because `domain` and `application` packages must be shared **verbatim** across all three deployables (Architecture.md §5), which a multi-repo setup would make error-prone to keep in sync.

**Shared code target: 95%+** between Desktop and Android. Both `apps/desktop` (Tauri shell) and `apps/android` (Capacitor shell) package the same React application. Platform-specific code is limited to the `bootstrap/` DI wiring and thin bridge layers; all UI components and feature logic live in `packages/ui-components` and feature packages and are consumed identically by both shells.

## 2. Full Repository Tree

```
smart-retail-os/
├── apps/
│   ├── desktop/                        # Tauri shell packaging the shared React app — no desktop-specific UI code
│   │   ├── src-tauri/                  # Rust side: Tauri config, native commands, MongoDB driver binding
│   │   │   ├── src/
│   │   │   └── tauri.conf.json
│   │   └── src/
│   │       ├── app/                    # Routes, layout, providers (per Architecture.md Presentation layer)
│   │       │   ├── routes/
│   │       │   ├── layout/
│   │       │   └── providers/
│   │       ├── bootstrap/              # DI composition root, Tauri command bridges (Architecture.md §8)
│   │       │   ├── di-container.ts
│   │       │   └── tauri-bridge.ts
│   │       └── features/               # Screen compositions importing packages/ui-components and feature packages
│   │           ├── pos/
│   │           ├── inventory/
│   │           ├── purchasing/
│   │           ├── customers/
│   │           ├── reports/
│   │           ├── ai-insights/
│   │           └── settings/
│   │
│   ├── android/                        # Capacitor shell packaging the shared React app — no native Android UI code
│   │   ├── android/                    # Native Android project (Capacitor-generated; no Kotlin/Java UI code)
│   │   └── src/
│   │       ├── app/
│   │       ├── bootstrap/              # DI composition root, Capacitor plugin bridges
│   │       └── features/               # Shares 95%+ of screen logic with desktop/features via packages/ui-components
│   │
│   └── backend/                        # Sync/API/AI server (Node.js)
│       └── src/
│           ├── http/                   # REST controllers (API.md endpoints)
│           │   ├── auth/
│           │   ├── catalog/
│           │   ├── sales/
│           │   ├── inventory/
│           │   ├── purchasing/
│           │   ├── customers/
│           │   ├── reports/
│           │   ├── ai/
│           │   ├── sync/
│           │   └── billing/
│           ├── ws/                     # WebSocket handlers (sync stream, API.md §5.4)
│           ├── workers/                # Background jobs
│           │   ├── ai-batch/           # Nightly forecast/fraud/health-score jobs (AI.md §§3,4,7)
│           │   ├── report-materialization/  # Read-model projection workers (Reports.md §1)
│           │   ├── notification-dispatcher/ # Notifications.md §1
│           │   └── backup/             # Incremental encrypted backup jobs (Security.md §8)
│           └── bootstrap/              # Backend DI composition root
│
├── packages/
│   ├── domain/                         # Pure domain layer — zero framework deps (Architecture.md §2)
│   │   ├── identity/
│   │   ├── catalog/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchasing/
│   │   ├── crm/
│   │   ├── promotions/
│   │   ├── tax/
│   │   ├── ai-insights/                # Prediction/Anomaly/HealthScore/Recommendation entities (read-mostly)
│   │   ├── sync/
│   │   ├── billing/
│   │   └── audit/
│   │       └── <context>/
│   │           ├── entities/
│   │           ├── value-objects/
│   │           ├── aggregates/
│   │           ├── domain-events/
│   │           └── domain-services/
│   │
│   ├── application/                    # Use cases per Bounded Context — organized feature-first (Coding_Standards.md §2)
│   │   └── <context>/
│   │       └── <use-case-name>/
│   │           ├── <use-case>.command.ts   (or .query.ts)
│   │           ├── <use-case>.handler.ts
│   │           └── <use-case>.handler.test.ts
│   │
│   ├── infrastructure/
│   │   ├── mongodb/                    # Repository implementations, migrations, validation schemas, change streams
│   │   │   ├── repositories/
│   │   │   ├── migrations/
│   │   │   ├── schemas/                # MongoDB JSON Schema validators per collection
│   │   │   └── change-streams/         # Change stream handlers for projections and outbox fan-out
│   │   ├── backup/                     # Backup infrastructure (Database.md §9)
│   │   │   ├── local-disk.adapter.ts
│   │   │   ├── supabase-storage.adapter.ts
│   │   │   ├── backup-queue.ts
│   │   │   └── backup-scheduler.ts
│   │   ├── sync-engine/                # Event log, transport selection, conflict resolver (Sync Architecture.md)
│   │   │   ├── outbox/
│   │   │   ├── inbox/
│   │   │   ├── transport/              # LAN/peer-to-peer + cloud relay + WebSocket
│   │   │   └── conflict-resolver/
│   │   ├── ai-clients/                 # Provider-agnostic AI Gateway (AI.md §1)
│   │   │   ├── providers/
│   │   │   │   ├── local-model.provider.ts
│   │   │   │   ├── groq.provider.ts
│   │   │   │   ├── gemini-flash.provider.ts
│   │   │   │   └── openai-compatible.provider.ts
│   │   │   └── ai-gateway.ts
│   │   ├── hardware/                   # ESC/POS, scanner, scale, cash-drawer drivers (Hardware.md)
│   │   │   ├── printer/
│   │   │   ├── scanner/
│   │   │   ├── drawer/
│   │   │   └── scale/
│   │   └── notifications/              # Channel adapters (Notifications.md §2)
│   │       ├── in-app.channel.ts
│   │       ├── push.channel.ts
│   │       ├── email.channel.ts
│   │       └── sms-whatsapp.channel.ts  (Phase 2 slot, per Notifications.md §2)
│   │
│   ├── ui-components/                  # Shared design-system React components (RTL/LTR aware, Design System.md)
│   │   ├── primitives/                 # Button, Input, Card, Dialog, Badge, Table
│   │   ├── patterns/                   # Form-shell, approval-pending banner, empty-state, destructive-confirm
│   │   └── theme/                      # CSS variable definitions (light/dark tokens)
│   │
│   └── shared-kernel/                  # Value Objects shared across contexts
│       ├── money.ts
│       ├── date-range.ts
│       ├── identifiers.ts
│       ├── result.ts                   # Result<T, DomainError> type (Coding_Standards.md §5)
│       └── domain-event-base.ts
│
├── docs/                                # This documentation package
│   ├── Vision.md
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Database.md
│   ├── API.md
│   ├── Sync_Architecture.md
│   ├── AI.md
│   ├── Design_System.md
│   ├── UI_UX.md
│   ├── Reports.md
│   ├── Notifications.md
│   ├── Security.md
│   ├── Hardware.md
│   ├── Development_Plan.md
│   ├── Coding_Standards.md
│   ├── Testing.md
│   ├── Project_Structure.md
│   └── Implementation_Pipeline.md
│
└── infra/                              # Docker, deployment scripts
    ├── docker/
    │   ├── backend.Dockerfile
    │   └── docker-compose.yml          # Self-hostable backend + Postgres + Redis (Architecture.md §9)
    ├── ci/                             # CI pipeline definitions (lint, test, build gates — Coding_Standards.md §10)
    └── deploy/                         # Installer packaging (Windows), APK signing config (Implementation_Pipeline.md Step 38)
```

## 3. Package Boundary Rules (Enforced)

- `apps/*` may import from any `packages/*`, but never from another `apps/*` directly — Desktop and Android never import each other's code; shared logic belongs in `packages/`.
- `packages/domain` imports **only** other `packages/domain` context modules and `packages/shared-kernel` — never `packages/application`, never `packages/infrastructure`, never any app.
- `packages/application` imports `packages/domain` and `packages/shared-kernel`, and depends on Infrastructure only via **interfaces** it defines itself (Dependency Inversion, Architecture.md §8) — never a concrete class from `packages/infrastructure`.
- `packages/infrastructure/*` implements interfaces from `domain`/`application` and may freely import third-party SDKs/libraries (SQLite drivers, AI provider SDKs, Tauri/Capacitor bridge APIs where platform-specific) — this is the only place such imports are allowed.
- `packages/ui-components` may depend on `packages/shared-kernel` (for `Money`/`DateRange` formatting) but never on `domain`, `application`, or `infrastructure` — it is a pure presentation library, consumed by `apps/*` features that wire it to real data via Application-layer hooks.
- These rules are the literal lint configuration referenced in Coding_Standards.md §1 and verified by the Implementation_Pipeline.md Step 0.1 review gate ("confirm layer-boundary lint rule actually blocks a Domain→Infrastructure import").

## 4. Naming & Placement Quick Reference

| If you're building...                   | It goes in...                                                   |
| --------------------------------------- | --------------------------------------------------------------- |
| A new business rule / entity behavior   | `packages/domain/<context>/`                                    |
| A new command or query (use case)       | `packages/application/<context>/<use-case-name>/`               |
| A new MongoDB repository method         | `packages/infrastructure/mongodb/repositories/`                 |
| A new AI provider                       | `packages/infrastructure/ai-clients/providers/`                 |
| A new hardware adapter                  | `packages/infrastructure/hardware/<peripheral>/`                |
| A new notification channel              | `packages/infrastructure/notifications/`                        |
| A new shared UI primitive               | `packages/ui-components/primitives/`                            |
| A new REST endpoint                     | `apps/backend/src/http/<context>/`                              |
| A new background job                    | `apps/backend/src/workers/<job-family>/`                        |
| A new screen (both Desktop and Android) | `apps/desktop/src/features/<module>/` (95% shared via packages) |
| A new Desktop-only platform feature     | `apps/desktop/src/bootstrap/` (Tauri bridge)                    |
| A new Android-only platform feature     | `apps/android/src/bootstrap/` (Capacitor plugin bridge)         |
| A new Value Object shared everywhere    | `packages/shared-kernel/`                                       |

## 5. Why This Structure (Cross-References)

- The **Domain-per-context, Application-per-context** split mirrors the Bounded Context table in Architecture.md §3 exactly — there is no context in that table without a corresponding folder here, and no folder here without a corresponding entry there. Adding a Bounded Context to Architecture.md §3 without adding its folders here (or vice versa) is a documentation-drift bug (Implementation_Pipeline.md §4).
- The **feature-based internal organization** of `packages/application/<context>/` follows Coding_Standards.md §2 exactly — this document defines _where the context folder lives_, Coding_Standards.md defines _how a use case is organized inside it_.
- The **Infrastructure subfolder split** (`mongodb`, `backup`, `sync-engine`, `ai-clients`, `hardware`, `notifications`) matches one subfolder per external-facing concern documented in its own spec file (Database.md, Database.md §9, Sync_Architecture.md, AI.md, Hardware.md, Notifications.md respectively) — each subfolder's implementation is judged against that specific document, not against this structural document.

---

_Project_Structure.md — the literal tree an AI coding agent scaffolds in Implementation_Pipeline.md Step 0.1; any new folder added during development must be justified against §3's boundary rules before being merged._
