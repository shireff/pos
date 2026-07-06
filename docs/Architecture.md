# Architecture.md — Smart Retail OS Technical Architecture

**Depends on:** Vision.md, PRD.md
**Feeds into:** Database.md, API.md, Sync Architecture.md, AI.md

> **Platform decision (overrides any prior assumption):**
>
> - **Local database:** MongoDB (embedded, offline-first) on Desktop and Android. Not SQLite.
> - **Desktop:** Tauri + React + TypeScript. No Electron, no native desktop UI.
> - **Android:** Capacitor + React + TypeScript. No Kotlin/Java/Jetpack Compose. Only Capacitor plugins.
> - **Shared code target:** 95%+ between Desktop and Android. Both shells package the same React app.
> - **Backup:** Local disk (primary) + Supabase Storage (secondary). Incremental, compressed, encrypted.
> - **Cloud relay:** Supabase Realtime (sync transport), Supabase Storage (backup). Not a primary DB.

## 1. Architectural Style

Smart Retail OS uses **Clean Architecture** combined with **Domain-Driven Design (DDD)**, **CQRS** for read/write separation, and **Event Sourcing** for all inventory-affecting operations. This combination is chosen specifically because:

- Clean Architecture keeps business rules independent of UI framework, database, and sync mechanism — critical since the same domain logic runs on Desktop (Tauri), Android (Capacitor), and the backend server.
- DDD gives the AI-agent implementers unambiguous, named domain concepts (Bounded Contexts, Aggregates, Value Objects) to implement against, rather than loose CRUD tables.
- Event Sourcing for inventory is mandatory per the founder's own sync-conflict requirement: stock quantity must never be resolved by "last write wins."

## 2. Layered Structure (per deployable: Desktop, Android, Backend, Platform Admin)

```
┌─────────────────────────────────────────┐
│  Presentation Layer                      │  React UI, screens, components
├─────────────────────────────────────────┤
│  Application Layer                       │  Use cases / Commands / Queries (CQRS)
├─────────────────────────────────────────┤
│  Domain Layer                            │  Entities, Value Objects, Aggregates,
│                                           │  Domain Events, Domain Services
├─────────────────────────────────────────┤
│  Infrastructure Layer                    │  MongoDB repos, Sync engine, AI clients,
│                                           │  hardware drivers, HTTP clients
└─────────────────────────────────────────┘
```

Dependency rule: **inner layers never import from outer layers.** Domain has zero dependency on MongoDB, React, Tauri, or Capacitor. This is enforced via package boundaries (§5) and lint rules (Coding Standards.md). The Platform Admin web app (§5, §3) is a thin fourth deployable that follows the same layering rule but only ever talks to its own `platform-admin` domain/application packages — it never imports a tenant Bounded Context's domain package directly (see §3 isolation note).

## 3. Bounded Contexts (DDD)

| Bounded Context             | Core Aggregates                                            | Owns                                                                                                                                                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identity & Access           | Company, Branch, User, Role, Permission                    | Auth, RBAC, shift access                                                                                                                                                                                                                                                                   |
| Catalog                     | Product, Variant, Bundle, Category, UnitOfMeasure          | Product data, pricing, barcodes                                                                                                                                                                                                                                                            |
| Inventory                   | StockItem, StockMovement (event-sourced), Batch, Warehouse | Stock levels, transfers, expiry                                                                                                                                                                                                                                                            |
| Sales                       | Order, OrderLine, Payment, Return                          | POS transactions, refunds                                                                                                                                                                                                                                                                  |
| Purchasing                  | PurchaseOrder, SupplierInvoice, Supplier                   | Procurement lifecycle                                                                                                                                                                                                                                                                      |
| CRM                         | Customer, LoyaltyAccount, CreditLedger                     | Customer data, loyalty, credit                                                                                                                                                                                                                                                             |
| Promotions                  | Discount, Coupon, Campaign                                 | Pricing rules                                                                                                                                                                                                                                                                              |
| Tax & Compliance            | TaxRule, ETAInvoice                                        | Tax calculation, e-invoice payload                                                                                                                                                                                                                                                         |
| AI & Insights               | Prediction, Anomaly, HealthScore, Recommendation           | AI-generated artifacts (read-mostly)                                                                                                                                                                                                                                                       |
| Sync                        | SyncEvent, ConflictRecord, DeviceRegistry                  | Cross-device synchronization                                                                                                                                                                                                                                                               |
| Billing & Licensing         | Subscription, License, Invoice(SaaS), TrialPeriod          | Vendor-side billing of tenants, trial-to-paid lifecycle                                                                                                                                                                                                                                    |
| Audit                       | AuditEntry                                                 | Immutable action log                                                                                                                                                                                                                                                                       |
| **Platform Administration** | **PlatformAdminUser, PlatformAdminAction, TenantOverride** | **Anthropic-of-this-project-style vendor operator accounts: viewing/searching all tenant accounts, changing a tenant's plan, suspending/reactivating a tenant, and overriding trial/license state — the internal "run the business" surface for the founder, not a tenant-facing feature** |

Each Bounded Context maps 1:1 to a backend module and a frontend feature package (§5). Contexts communicate only via **Domain Events** or well-defined **Application Services** — never by reaching into another context's database tables directly.

### 3.1 Tenant Isolation Exception — Platform Administration

Every Bounded Context above is strictly `company_id`-scoped (tenant-isolated) — **except Platform Administration, which is the one deliberate exception in the entire system.** Platform Administration is vendor-side (the founder and any future support staff), not tenant-side, and its whole purpose is cross-tenant visibility and control (list all companies, change any company's plan, suspend any company). This is why it is modeled as its own Bounded Context rather than as an "admin role" inside Identity & Access:

- It must never be reachable through a normal tenant JWT, regardless of permissions granted (Security.md §11) — it has a completely separate authentication realm.
- Its commands (`ChangeSubscriptionPlanCommand`, `SuspendTenantCommand`, `OverrideTrialCommand`, etc.) are the _only_ commands in the system permitted to target a `company_id` other than the caller's own.
- Every action it takes is written to `platform_admin_actions` (Database.md), a separate, equally immutable audit trail from tenant-facing `audit_entries` (Security.md §5) — so a tenant's own Audit Log Viewer never shows vendor-side interventions, and vendor-side interventions are never lost inside tenant-scoped audit noise.
- No tenant-facing permission code (`module.action`, Security.md §4) can ever grant Platform Administration capability — the two permission systems are entirely disjoint.

## 4. CQRS

- **Commands** (e.g., `CreateSaleCommand`, `TransferStockCommand`) mutate state through the domain layer, emit Domain Events, and are the only way data changes.
- **Queries** (e.g., `GetDailySalesSummaryQuery`) read from denormalized read models optimized for dashboards/reports, kept in sync via projections from Domain Events.
- This separation lets reporting/AI read models scale independently from the transactional write path, and lets offline devices replay the same event stream to rebuild read models after sync.

## 5. Module / Package Boundaries & Folder Structure

> **Shared code target:** Both `apps/desktop` (Tauri) and `apps/android` (Capacitor) package the **same React application** — 95%+ of UI and feature code is shared via `packages/ui-components` and feature packages. Neither shell contains platform-specific UI code; they are packaging/bridge shells only. See Project_Structure.md §2 for the full tree.

```
smart-retail-os/
├── apps/
│   ├── desktop/                # Tauri shell — packages the shared React app (no desktop-specific UI code)
│   │   └── src/
│   │       ├── app/            # routes, layout, providers
│   │       └── bootstrap/      # DI wiring, Tauri command bridges
│   ├── android/                # Capacitor shell — packages the shared React app (no native Android UI code)
│   ├── platform-admin/         # Vendor-only web console (React) — founder + future support staff only
│   │   └── src/
│   │       ├── app/            # accounts list/search, account detail, plan editor, suspend/reactivate
│   │       ├── bootstrap/      # separate DI root, separate auth client (Security.md §11)
│   │       └── features/
│   │           ├── accounts/
│   │           ├── plans/
│   │           └── admin-audit/
│   └── backend/                # Sync/API/AI server
│       └── src/
│           ├── http/           # REST controllers
│           ├── ws/              # WebSocket handlers
│           └── workers/         # background jobs (backups, AI batch jobs)
├── packages/
│   ├── domain/                 # Pure domain layer, zero framework deps
│   │   ├── identity/
│   │   ├── catalog/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchasing/
│   │   ├── crm/
│   │   ├── promotions/
│   │   ├── tax/
│   │   ├── sync/
│   │   ├── billing/
│   │   ├── platform-admin/     # PlatformAdminUser, PlatformAdminAction, TenantOverride — cross-tenant by design (§3.1)
│   │   └── audit/
│   ├── application/            # Use cases per bounded context (commands/queries)
│   ├── infrastructure/
│   │   ├── mongodb/            # Repository implementations, migrations, validation schemas
│   │   ├── sync-engine/        # Event log, transport selection, conflict resolver
│   │   ├── ai-clients/         # Provider-agnostic AI gateway (Groq/Gemini/local)
│   │   └── hardware/           # ESC/POS, scanner, scale, cash-drawer drivers
│   ├── ui-components/          # Shared design-system React components (RTL/LTR aware)
│   └── shared-kernel/          # Value Objects shared across contexts (Money, DateRange, etc.)
├── docs/                       # This documentation package
└── infra/                      # Docker, deployment scripts
```

Rule: `domain` and `application` packages are shared verbatim between Desktop, Android, and Backend builds — only `infrastructure` implementations differ per target (e.g., MongoDB driver bindings differ between Tauri/Rust and Node backend, but the repository _interface_ is identical). `packages/domain/platform-admin` and `apps/platform-admin` are the one exception to "share verbatim": they are never imported by Desktop or Android at all, by design (§3.1).

## 6. Event Sourcing Scope

Event Sourcing is applied specifically to **Inventory** (StockMovement) and **Sync** (SyncEvent) — not globally to every aggregate, to avoid unnecessary complexity elsewhere.

- Every stock change (sale, return, transfer, adjustment, purchase receipt) is stored as an immutable `StockMovementEvent` with a monotonic per-device sequence number and a vector-clock-style causality marker.
- Current stock quantity is always a **projection** (sum of applicable events), never a mutable column that gets directly overwritten. This is what makes offline, multi-device stock edits reconcilable without data loss (detailed in Sync Architecture.md §4).
- Other aggregates (Product, Customer, Discount, etc.) use standard CRUD-with-audit-log persistence plus field-level change tracking for merge purposes — full event sourcing on every entity was judged unnecessary overhead per the founder's cost/complexity priorities.

## 7. Offline Architecture (summary — full detail in Sync Architecture.md)

- Every device (Desktop or Android) runs a **complete local copy** of its company's relevant data in **MongoDB (embedded, offline-first)** — not a cache, a fully functional local database. MongoDB is always the source of truth on the device; sync is a background process layered on top.
- All Commands execute against the local MongoDB instance first and complete immediately; a background **Outbox** queues resulting Domain Events for sync.
- The Application layer has no branching logic for "online vs offline" — it always writes locally. Connectivity state is entirely an Infrastructure-layer concern handled by the Sync Engine.
- Read models (dashboards, reports) are rebuilt locally from the local event log, so reporting also works fully offline, with AI-enhanced insights degrading gracefully to "last synced state" when offline (per AI.md hybrid model).
- **Exception — trial expiration and platform-admin suspension (Security.md §6.2, §11):** unlike a stale license _check_, an actually-expired trial or an explicit platform-admin suspension is a deliberate business-state lock, not a connectivity artifact. The Application layer still has no online/offline branching; instead, a `SubscriptionStatus` value (synced down like any other data, cached locally, and re-validated opportunistically) is read by a single cross-cutting guard at the Application layer boundary (not scattered per-command) that blocks state-changing commands once status is `expired` or `suspended`. Read-only access (viewing historical data, exporting a backup) is never blocked, even when locked.

## 8. Dependency Injection & SOLID

- Constructor-based DI throughout; no service locators. Composition roots live in each app's `bootstrap/` folder.
- Every Infrastructure implementation (MongoDB repo, HTTP client, AI provider client) implements an interface defined in `domain` or `application` — enabling test doubles and enabling the AI-provider-swap requirement (Gemini/Groq/local model) without touching application logic.
- SOLID is enforced structurally: Single Responsibility per use case class, Open/Closed via strategy interfaces for tax rules/discount rules/payment providers, Interface Segregation via narrow repository interfaces per aggregate (not one giant `IRepository`), Dependency Inversion via the layering rule in §2.

## 9. Scalability Path

- v1: single backend instance, PostgreSQL, Redis, self-hosted or free-tier — sized for hundreds of tenants.
- Growth: horizontal scaling of the backend (stateless API/WS nodes behind a load balancer), PostgreSQL read replicas for reporting queries, Redis for session/sync-session state and pub/sub across nodes for WebSocket fan-out.
- No architectural rework needed to move from single-tenant-per-shop-instance thinking to true multi-tenant SaaS — the domain model already treats Company as the tenant boundary from v1 (Platform Administration, §3.1, is the sole intentional cross-tenant exception).

---

_Architecture.md — feeds Database.md, API.md, Sync Architecture.md, AI.md._
