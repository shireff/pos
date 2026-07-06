# EXECUTION_RULES.md — Smart Retail OS Implementation Rules

**These rules are non-negotiable. A step that violates any rule below is not complete, regardless of whether the feature "works."**

---

## 1. The Golden Rule

If at any point a step cannot meet its Definition of Done without violating a rule in:

- `Architecture.md`
- `Security.md`
- `Sync_Architecture.md`

**STOP and FLAG it.** Do not proceed with a workaround. Do not rationalize. Escalate.

---

## 2. Phase/Step Sequencing Rules

- Never start a phase before its prerequisite phases have passed their exit gate.
- Exit gates are mandatory manual checkpoints. An AI agent confirms criteria; the founder signs off before the next phase begins.
- Stage 4 (Phase 15: Sync) exit gate additionally requires a dedicated review session — not just a PR approval.
- Stage 5 trial/paywall and Platform Admin steps (Phases 19 partial) require the founder to personally exercise every Platform Admin action against a real test account before that gate passes.
- Never parallelize Phase 15 with any other feature phase. It is isolated by design.
- Phases 12, 13, 14 may run in parallel ONLY after Phase 15 exits.
- Phase 14 (AI) must start only after Phase 12's read-model layer is stable.

---

## 3. Code Quality Rules

- **No `any` in TypeScript.** Use `unknown` + narrowing. `@typescript-eslint/no-explicit-any` is a CI-blocking error.
- **No `// @ts-nocheck`.** Anywhere. Ever.
- **`strict: true`** in every `tsconfig.json`. No exceptions.
- **No TODO comments.** A TODO means the step is not done.
- **No placeholder implementations.** Every exported function must be complete and correct.
- **No pseudo-code.** All code must compile and pass tests.
- **No hardcoded strings in UI.** All user-facing text goes through the i18n layer.
- **No hardcoded hex colors.** All colors use CSS variables from Design_System.md §2.
- **No hardcoded secrets.** Environment variables only. CI lint rule enforced.

---

## 4. Architecture Rules

- **Domain and Application packages have zero framework dependencies.** No React, Tauri, Capacitor, SQLite, or HTTP clients may be imported from `packages/domain` or `packages/application`. This lint rule must be verified working — not just configured — before any feature code is written (Phase 01).
- **Infrastructure implements interfaces owned by Domain/Application.** Never the reverse.
- **No service locators.** Constructor-based DI only. Composition roots live in `apps/*/bootstrap/`.
- **One command = one handler = one file.** No multi-responsibility handlers.
- **Platform Administration is never reachable through a tenant JWT.** The `aud` claim check is the guard. This is enforced at the middleware level, not per-route.
- **`platform_admins` are never rows in `users`.** They are a separate table, separate auth realm, separate JWT signing key.

---

## 5. Database Rules

- **Schema migrations run identically on SQLite and PostgreSQL.** Single migration-definition source. Never diverge.
- **Migrations are backward-compatible** for at least one prior app version.
- **`stock_movement_events`, `audit_entries`, `sync_outbox`, `platform_admin_actions`** are append-only. UPDATE/DELETE is forbidden and enforced by DB triggers.
- **Every table carries standard audit columns**: `id (UUID)`, `created_at`, `updated_at`, `created_by_device_id`, `is_deleted`, `sync_version`.
- **Hard delete is never allowed.** Soft-delete only via `is_deleted` flag (PRD assumption A4).
- **All IDs are client-generated UUIDv7.** Never server-assigned auto-increment IDs.
- **All timestamps are stored UTC.** Rendered in branch-local timezone (Africa/Cairo default).
- **Currency values are stored as integer minor units (piasters).** Never floats.

---

## 6. API Rules

- **Every API endpoint matches API.md exactly.** Request shape, response shape, error codes — all must match.
- **Every list endpoint supports `?page=&pageSize=` and returns** `{ data: [], meta: { page, pageSize, total } }`.
- **Every response includes `requestId`.**
- **Every 403 includes the specific `permissionCode`** that was missing. Never a generic denial.
- **`TRIAL_EXPIRED` and `ACCOUNT_SUSPENDED` always include** `details.readOnly: true` and `details.upgradeUrl` or `details.contactSupportUrl`.
- **`clientTxnId` on `POST /v1/orders` is mandatory** and makes the endpoint idempotent.
- **Platform Admin endpoints live on a separate host** (`admin-api.<domain>`). They are never path-only prefixes on the tenant API host.

---

## 7. Business Rules

- _*BR-* codes are stable identifiers._* They are never renumbered, only appended or deprecated.
- **A rule in Business_Rules.md with no corresponding test is treated as unimplemented.**
- **Every permission check happens at the Application layer (command/query handlers).** UI filtering is a convenience, never the sole gate.
- **AI recommendations are advisory only.** There is no code path from an AI output directly to an applied change. `UpdatePriceCommand` has no AI-auto-approve branch. This is enforced structurally, not by convention.
- **Discount amounts never exceed line subtotals.** Enforced at both UI and Application layer.
- **A sale is never "undone" by sync merge.** BR-SYN-010. Completed sales are Class A events — immutable.

---

## 8. Sync Rules

- **Local write is the only write that counts.** Sync is a background process, never a precondition.
- **Inventory (Class A) is event-sourced.** Never a direct write to a quantity field.
- **Class B (field-merge) conflicts on the same field are never silently resolved.** They surface as manual conflicts.
- **A change never expires from the outbox.** It stays queued until acknowledged.
- **Transport selection is automatic.** The owner never manually picks LAN vs. cloud.
- **Every change carries a UUIDv7 `change_id`.** Replay is idempotent.
- **Role/permission field conflicts always escalate to Owner.** Not Branch Manager.

---

## 9. Security Rules

- **Passwords stored via argon2id.** Never reversible, never logged.
- **Refresh tokens stored hashed.** Rotated on every use.
- **SQLCipher encrypts the entire local database.** Not selected columns.
- **Backup encryption key derived independently** from the live DB key.
- **MFA is mandatory for every Platform Admin account.** No opt-out, no grace period, no "remember this device."
- **Five failed Platform Admin login/MFA attempts locks the account** for 15 minutes. No self-service unlock.
- **`audit_entries` is never the enforcement mechanism.** RBAC is the gate. The audit log records what happened after the fact.
- **No raw stack trace is ever sent to an end user.**

---

## 10. AI Rules

- **AI never executes an irreversible action without explicit owner approval.**
- **Numeric forecasts are computed by deterministic statistical baselines.** The LLM generates only the narrative explanation, never the number.
- **No raw database dump is ever sent to a cloud AI provider.**
- **Customer PII is included in AI prompts only when the specific query genuinely requires it.**
- **A malformed AI response triggers exactly one retry, then graceful fallback.** Never shown raw.
- **All AI features are fully available during the 14-day trial.** No separate AI feature gating for trial accounts.

---

## 11. Testing Rules

- **A step is not done without its tests passing.** Tests are part of the Definition of Done, never deferred.
- **Tests live alongside the code they test.** Same folder, `<subject>.test.ts` naming.
- **Tests never depend on execution order** or shared mutable state between cases.
- **Every sync step requires the multi-device simulation harness to exist before** conflict-resolution logic is considered implemented. Test-first for Phase 15.
- **Every permission code has a test** asserting 403 with the exact `permissionCode` for a user lacking it, and success for a user holding it.
- **The advisory-only AI enforcement test** must exist before any AI feature is considered complete.

---

## 12. Naming Rules

All names must match the spec documents exactly (Database.md, API.md, Business_Rules.md, etc.):

| Element                    | Convention                                                         |
| -------------------------- | ------------------------------------------------------------------ |
| Files                      | kebab-case: `adjust-stock.handler.ts`                              |
| Classes, Interfaces, Types | PascalCase: `StockMovementEvent`                                   |
| Interfaces                 | No `I` prefix: `ProductRepository` not `IProductRepository`        |
| Functions, variables       | camelCase: `calculateOrderTotal`                                   |
| Constants                  | UPPER_SNAKE_CASE: `MAX_PAGE_SIZE`                                  |
| Commands                   | `<Verb><Noun>Command`: `CreateSaleCommand`                         |
| Queries                    | `Get<Noun>Query`: `GetDailySalesSummaryQuery`                      |
| Domain Events              | `<Noun><PastTenseVerb>`: `OrderCompleted`, `StockMovementRecorded` |
| DB tables                  | snake_case plural: `stock_movement_events`                         |
| Permission codes           | `module.action`: `inventory.adjust`, `reports.view.financial`      |

A mismatch between code names and spec document names is a bug, not a style preference.

---

## 13. Documentation Rules

- **Inline doc comments** on every exported function/class in `domain` and `application` packages.
- **Package README** in the same step that introduces the package.
- **Spec documents updated in the same PR** when a step changes a decision documented there.
- **This pipeline and planning documents** updated only when the phase/step sequence genuinely changes.
- **KPI formula changes** are a documentation change to Reports.md §3 in the same PR as the code change.
- **A new error code in code without a corresponding Error_Catalog.md entry** is a documentation-drift bug.
- **A new notification trigger in code without a Notifications.md §3 row** is a documentation-drift bug.

---

## 14. Design Rules

- **Arabic-first, RTL by default.** Every component must work in RTL before LTR is styled.
- **Use logical CSS properties.** `margin-inline-start` not `margin-left`.
- **Dark mode is a v1 requirement.** Every new component must support both themes via token swap.
- **Minimum touch target 44×44px on Android**, 32×32px on Desktop.
- **Color is never the sole indicator of state.** Always pair with icon or text.
- **Base body text never below 14px** anywhere in the cashier-facing flow.
- **Motion on the cashier POS screen is forbidden.** Motion is reserved for AI/insight surfaces only.

---

## 15. Forbidden Patterns

These patterns must never appear in merged code:

```typescript
// ❌ any type
const data: any = ...

// ❌ Direct stock quantity write
await db.run('UPDATE stock_items SET quantity_on_hand = ?', [newQty])

// ❌ AI auto-applying a recommendation
await UpdatePriceCommand.execute({ aiApproved: true })

// ❌ Direct Infrastructure import in Domain
import { SQLiteRepository } from '../../infrastructure/sqlite/...'

// ❌ Hardcoded color
style={{ color: '#DC2626' }}

// ❌ Hardcoded user-facing string
<span>لا يوجد منتجات</span>

// ❌ Platform Admin logic inside tenant auth middleware
if (user.role === 'platform_admin') { ... } // in tenant route handler

// ❌ Raw error to user
res.json({ error: err.stack })

// ❌ Timestamp in local time stored to DB
await db.run('INSERT INTO orders (created_at) VALUES (?)', [new Date().toString()])
```
