# Coding_Standards.md — Smart Retail OS Coding Standards

**Depends on:** Architecture.md (layering, DDD, SOLID)
**Feeds into:** every implementation step in Implementation_Pipeline.md — this document is the lint/CI rule source referenced in Step 0.1, and the Definition-of-Done reference for "is this code acceptable" across every stage.
**Governing rule:** because implementation is largely AI-agent-driven (Vision.md §3), standards here are written to be **mechanically enforceable** wherever possible (lint rule, CI check, code-review checklist item) rather than left as prose convention an agent might interpret loosely.

## 1. Language & Type Safety

- **TypeScript everywhere** (Desktop React, Android React, Backend Node) — one language across the whole stack, per Architecture.md's cross-platform domain-sharing design. Both Desktop (Tauri) and Android (Capacitor) package the same React application; the MongoDB driver and all infrastructure adapters are written in TypeScript and shared via `packages/infrastructure/mongodb/` — no platform-specific database code.
- No raw MongoDB queries in feature code — use the repository pattern. The `packages/infrastructure/mongodb/repositories/` layer is the only place MongoDB driver calls are permitted (enforced by the same layer-boundary lint rule that blocks SQL in Domain/Application packages).
- **Strict mode mandatory**: `strict: true` in every package's `tsconfig.json`, no exceptions, no per-file `// @ts-nocheck`.
- **`any` is forbidden.** Enforced via `@typescript-eslint/no-explicit-any` as a CI-blocking error, not a warning. Where a type is genuinely unknown at a boundary (e.g., parsing external JSON), use `unknown` and narrow explicitly — never `any` as a shortcut.
- **No implicit `null`/`undefined` leakage** — `strictNullChecks` is part of strict mode; optionality is always explicit in a type signature (`field?: string` or `field: string | null`), never inferred by omission.
- **Domain and Application layer packages have zero framework dependencies** (Architecture.md §2) — enforced by a lint rule blocking imports of `react`, `tauri`, `@capacitor/*`, or any MongoDB/HTTP library from within `packages/domain` or `packages/application`. This is the single most important guardrail in the project (Implementation_Pipeline.md Step 0.1 review gate) and must be verified working — not just configured — before any feature code is written.

## 2. Project Organization — Feature-Based, Not Type-Based

- Within each Bounded Context package (`packages/domain/inventory`, `packages/application/inventory`, etc.), code is organized **by feature/use-case**, not by technical type — i.e., not one giant `entities/` folder, one giant `services/` folder. Each use case owns its command/query, handler, and DTOs together.
- Example structure inside `packages/application/inventory`:

```
inventory/
├── adjust-stock/
│   ├── adjust-stock.command.ts
│   ├── adjust-stock.handler.ts
│   └── adjust-stock.handler.test.ts
├── transfer-stock/
│   ├── transfer-stock.command.ts
│   ├── transfer-stock.handler.ts
│   └── transfer-stock.handler.test.ts
└── get-stock-levels/
    ├── get-stock-levels.query.ts
    └── get-stock-levels.handler.ts
```

- This keeps a use case's full logic and its test co-located and independently reviewable — an AI agent implementing "adjust stock" touches one folder, not four scattered technical-layer folders.

## 3. SOLID, Applied Concretely

Per Architecture.md §8, SOLID is structurally enforced, not aspirational. Concrete rules:

- **Single Responsibility:** one command/query = one handler class = one file. A handler that both validates business rules _and_ orchestrates a multi-step workflow spanning unrelated aggregates is a signal to split it.
- **Open/Closed:** variability (tax rules, discount rules, payment tender types, AI providers, notification channels, hardware adapters) is implemented via a strategy interface + registered implementations — never via a growing `if/else` or `switch` on a type string inside a handler. Adding a new tax rule, AI provider, or hardware adapter must never require editing existing handler code, only adding a new implementation and registering it.
- **Liskov Substitution:** every interface implementation (repository, AI provider, notification channel, hardware adapter) must be fully substitutable — a test double/simulated adapter used in CI must satisfy the exact same contract a real adapter does, including error behavior, not just the happy path.
- **Interface Segregation:** repository interfaces are narrow and per-aggregate (`ProductRepository`, `StockMovementRepository`) — never one giant `IRepository<T>` that forces every consumer to depend on methods it doesn't use.
- **Dependency Inversion:** enforced by the layering rule (§1) — Infrastructure implements interfaces owned by Domain/Application; nothing in Domain/Application ever imports a concrete Infrastructure class.

## 4. Naming Conventions

| Element                                  | Convention              | Example                                                                       |
| ---------------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| Files                                    | kebab-case              | `adjust-stock.handler.ts`                                                     |
| Classes / Interfaces / Types             | PascalCase              | `StockMovementEvent`, `ProductRepository`                                     |
| Interfaces are **not** prefixed with `I` | —                       | `ProductRepository`, not `IProductRepository`                                 |
| Functions / variables                    | camelCase               | `calculateOrderTotal`                                                         |
| Constants (true immutable config)        | UPPER_SNAKE_CASE        | `MAX_PAGE_SIZE`                                                               |
| Commands                                 | `<Verb><Noun>Command`   | `CreateSaleCommand`, `TransferStockCommand`                                   |
| Queries                                  | `Get<Noun>Query`        | `GetDailySalesSummaryQuery`                                                   |
| Domain Events                            | `<Noun><PastTenseVerb>` | `StockMovementRecorded`, `OrderCompleted`                                     |
| Database tables                          | snake_case, plural      | `stock_movement_events` (matches Database.md exactly)                         |
| Permission codes                         | `module.action`         | `inventory.adjust`, `reports.view.financial` (matches Security.md §4 exactly) |

Naming in code must match naming in the spec documents (Database.md, API.md, AI.md, etc.) **exactly** — a table named `stock_movement_events` in Database.md must never appear as `stockMovements` or `stock_movements` in code. Any mismatch discovered is a documentation-or-code bug to fix immediately, not a style preference to leave alone.

## 5. Error Handling

- **Result type over exceptions for expected/business-rule failures.** Domain and Application layers return a `Result<T, DomainError>` (defined in `shared-kernel`, per Implementation_Pipeline.md Step 0.2) rather than throwing for conditions like `STOCK_INSUFFICIENT` or `BUSINESS_RULE_VIOLATION` — these are expected outcomes of business logic, not exceptional program states.
- **Exceptions are reserved for truly exceptional/programmer-error conditions** (a broken invariant, an unreachable code path, an infrastructure failure like a lost DB connection) — caught at the Infrastructure/HTTP boundary and translated into the standard API error envelope (API.md §3), never leaked as a raw stack trace to a client.
- Every `DomainError` carries a stable `code` matching the error codes table in API.md §3 — the mapping from domain error to HTTP status/code is a single translation table at the API boundary, not duplicated logic scattered across controllers.
- **No silent catch blocks.** A caught error is always either handled meaningfully (mapped to a `Result` failure, retried per a documented policy) or re-thrown/logged — never swallowed with an empty `catch {}`.

## 6. Logging

- Structured logging only (JSON log lines with consistent fields: `timestamp`, `level`, `companyId`, `userId`, `deviceId`, `requestId`, `message`, `context`) — never bare `console.log` string interpolation in committed code.
- `requestId` (API.md §1) is threaded through every log line for a given request/command, enabling correlation across the sync/AI/report worker boundaries described in Architecture.md.
- **Never log:** raw passwords, full JWTs/refresh tokens, full credit card or payment provider secrets, raw AI provider API keys. Sensitive fields are redacted at the logger's serialization layer, not left to each call site's discipline.
- Log levels: `error` (unhandled/infrastructure failures), `warn` (recovered/degraded conditions — e.g., AI provider fallback triggered per AI.md §1), `info` (state-changing business events — order completed, sync batch applied), `debug` (verbose, disabled by default in production builds).

## 7. Documentation (Inline & Package-Level)

- Every exported function/class in `domain` and `application` packages carries a doc comment stating its contract (inputs, outputs, error conditions) — especially important since AI agents implementing _consumers_ of this code rely on the contract being explicit rather than inferred from reading the implementation.
- Every package (`packages/domain/inventory`, etc.) has a `README.md` documenting its Bounded Context's responsibility and its public exports — written in the same step that introduces the package (Implementation_Pipeline.md §4), not deferred.
- Comments explain **why**, not **what** — code should be readable enough that a comment restating "increments the counter" is unnecessary; a comment explaining "this uses a vector clock rather than a timestamp because clock drift between devices would otherwise misorder events" earns its place.

## 8. Version Control & Review

- Every Step (per Implementation_Pipeline.md's unit of work) ends in one PR, scoped to that step — not a mega-PR spanning multiple steps, and not multiple tiny PRs splitting one step's Definition of Done across several unreviewable partial states.
- PR description references the Implementation_Pipeline.md Step number and restates that step's Definition of Done, so the founder reviewing it (even in a solo-founder + AI-agent workflow) has a checklist to verify against rather than reviewing "does this look okay" unguided.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`) — enables automated changelog generation later and keeps history greppable by change type.
- No direct commits to the main branch — every change, including documentation-only changes, goes through a PR, since documentation drift (Implementation_Pipeline.md §4) is treated as a bug and deserves the same review rigor as code.

## 9. Testing Expectations (summary — full detail in Testing.md)

- A step is not complete without its tests passing, per Implementation_Pipeline.md §3 — this document only adds the _style_ rule: tests live alongside the code they test (§2 folder structure), use the naming pattern `<subject>.test.ts`, and never depend on test execution order or shared mutable state between test cases.

## 10. Formatting & Linting

- Prettier for formatting (no bikeshedding over style — auto-applied on save/commit via a pre-commit hook), ESLint for correctness/architecture rules (§1, §3 boundary enforcement).
- CI fails the build on any lint error — lint is not advisory. A deliberately introduced lint violation must fail CI, and this is explicitly verified as part of Implementation_Pipeline.md Step 0.1's review gate.
- Import ordering is enforced and auto-fixable (external packages → internal packages → relative imports), removing a class of noisy PR diffs.

### Forbidden Patterns (enforced by lint or PR review)

```typescript
// ❌ Raw MongoDB driver calls outside infrastructure layer
// (use repository pattern in packages/infrastructure/mongodb/repositories/ only)
import { MongoClient } from 'mongodb';
const result = await client.db().collection('stock_items').updateOne(...);

// ❌ Equivalent violation — direct collection access in a use case or handler
await db.collection('stock_items').findOneAndUpdate({ variant_id }, { $inc: { qty: -1 } });

// ✅ Correct — call the repository interface (DI-injected, Infrastructure implements it)
await stockItemRepository.decrementQuantity(variantId, delta);

// ❌ Native Android/iOS code (use Capacitor plugins instead — Hardware.md §0)
// import { BarcodeScanner } from 'native-android-module'; // Kotlin/Java bridge — forbidden

// ❌ Electron-specific APIs (use Tauri instead — Architecture.md §1)
// const { ipcRenderer } = require('electron'); // forbidden

// ❌ Direct Tauri/Capacitor imports in Domain or Application packages
// import { invoke } from '@tauri-apps/api'; // forbidden in packages/domain or packages/application
// import { Camera } from '@capacitor/camera';  // forbidden in packages/domain or packages/application
```

## 11. Internationalization in Code

- No hardcoded user-facing strings in component code — all UI text goes through the i18n layer (translation keys), since Arabic-first/English-secondary (Design System.md §1) is a v1 requirement, not a later retrofit.
- Currency and date formatting always goes through `shared-kernel`'s `Money`/`DateTime` value objects (Implementation_Pipeline.md Step 0.2) — never raw `Number`/native `Date` formatting scattered per screen, to guarantee EGP formatting and Cairo-timezone handling stay consistent everywhere (Database.md §2.1 defaults).

---

_Coding_Standards.md — every lint rule and review checklist item here exists to make an AI coding agent's next correct action unambiguous, per Vision.md §3's technical goal of AI-agent-implementable precision._
