# Testing.md — Smart Retail OS Testing Strategy

**Depends on:** Architecture.md, Coding_Standards.md §9, Implementation_Pipeline.md §3
**Feeds into:** every Stage exit gate in Implementation_Pipeline.md references a section of this document
**Governing rule:** a step is not "done" without its tests passing (Implementation_Pipeline.md §3) — testing is part of the Definition of Done, never a follow-up task.

## 1. Testing Pyramid

```
        ┌───────────────┐
        │   E2E (few)   │   Critical user flows, real/simulated devices
        ├───────────────┤
        │ Integration    │   Cross-layer: use case → repo → SQLite
        │ (moderate)     │
        ├───────────────┤
        │  Unit (many)   │   Domain logic, pure functions, value objects
        └───────────────┘
```

- **Unit tests** dominate by volume — they're fast, isolated, and test the Domain layer in complete isolation from SQLite/React/Tauri (enabled directly by Architecture.md §2's zero-framework-dependency rule for Domain/Application).
- **Integration tests** verify a real use case against a real (in-memory or temp-file) SQLite instance — catching issues unit tests with mocked repositories can't (migration mismatches, actual query correctness, SQLCipher behavior).
- **E2E tests** are deliberately few and reserved for the Critical Flows in §4 — expensive to write/maintain/run, so scoped to what genuinely must never break.

## 2. Unit Testing

- **Scope:** Domain entities/value objects/aggregates, Application command/query handlers (with repository interfaces mocked/faked), pure calculation logic (tax, discount, forecast baseline math in AI.md §3).
- **Tooling:** Vitest (fast, ESM-native, works identically across `packages/domain`, `packages/application`, and any package with zero framework runtime dependency).
- **Requirement:** every business rule mentioned in a spec document (e.g., "bundle stock deduction ratio," Implementation_Pipeline.md Step 1.1) has at least one corresponding unit test named after that rule — a rule with no test is treated as unimplemented, regardless of whether the code appears to handle it.
- **No mocking the system under test.** Only true collaborators (repositories, external clients) are faked; the domain object/handler itself is exercised for real.

## 3. Integration Testing

- **Scope:** repository implementations against real SQLite (Implementation_Pipeline.md Step 0.3), migration correctness, use-case-to-database round trips, HTTP controller-to-use-case wiring on the backend.
- **Environment:** a fresh, migrated, temp-file SQLite database per test suite run (never a shared persistent test DB, to avoid cross-test pollution) — migrations applied via the same runner used in production (Database.md §8), so migration bugs surface here, not in the field.
- **API contract tests:** every endpoint in API.md is covered by a test asserting the documented request/response shape and error codes (API.md §3) — a spec/implementation drift here is a CI failure, not a silent divergence.

## 4. Critical End-to-End (E2E) Flows

These flows are the non-negotiable, always-tested-before-release scenarios referenced throughout Implementation_Pipeline.md's Stage exit gates. Each runs on real or realistically simulated device environments (Desktop via Tauri test harness, Android via emulator/device farm).

| #   | Flow                                                                                                         | Verifies                                                          |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 1   | Cashier completes a cash sale, receipt prints/falls back, stock decrements                                   | Core POS loop, Hardware.md §2 fallback, Inventory projection      |
| 2   | Cashier processes a return against a prior sale                                                              | Return/refund flow, approval threshold branching (API.md §4.2)    |
| 3   | Manager creates a stock transfer between warehouses, approves, ships, receives                               | Multi-step Inventory workflow, event-sourced stock reconciliation |
| 4   | Purchase Order created → approved → received → stock increases → supplier invoice OCR reviewed and confirmed | Purchasing + AI OCR (AI.md §5) end-to-end                         |
| 5   | Two devices go offline, each makes conflicting stock adjustments, both reconnect                             | Sync conflict detection + resolution (Sync Architecture.md §3)    |
| 6   | A device offline for an extended period reconnects and catches up via `sync/pull` pagination                 | Sync backlog handling (API.md §5.2)                               |
| 7   | Owner views Store Health Dashboard reflecting data synced from multiple branches                             | Reports.md read-model correctness across branches                 |
| 8   | AI Assistant answers a business question using only local read-model context, never raw data                 | AI.md §2 context-assembly privacy guarantee                       |
| 9   | A price-change AI recommendation is generated, owner must explicitly approve before it applies               | AI.md governing rule — advisory-only enforcement                  |
| 10  | Fresh device restore from an encrypted backup reproduces full state                                          | Security.md §8 backup integrity                                   |

Flows 5 and 6 gate Stage 4 specifically (Implementation_Pipeline.md); flow 9's underlying enforcement test additionally gates the Stage 5/6/7 exit.

## 5. Offline Testing

- Every Critical Flow in §4 that is expected to work offline (flows 1–4, 7 partially, 8) has a dedicated test variant run with the device's network layer fully disabled (not just "server unreachable" — actual airplane-mode-equivalent simulation), verifying the Application layer genuinely has no online/offline branching (Architecture.md §7) and behaves identically either way except for sync status indicators.
- A device restarting mid-transaction (simulating a crash/power loss, common in unreliable-power environments) must never lose a completed sale — tested by killing the process after the local commit but before the Outbox send, then verifying the event is still present and syncs correctly on next launch.

## 6. Sync Testing

- **Idempotency test:** replaying the same synced event twice must not double-apply it (Implementation_Pipeline.md Step 4.1) — verified by deliberately re-sending an already-acknowledged event batch and asserting no state change occurs the second time.
- **Property-based commutativity test:** stock events applied in every possible order must converge to the same final projected quantity (Implementation_Pipeline.md Step 1.2) — implemented via a property-based testing library (e.g., fast-check) generating random valid event orderings rather than a fixed hand-written sequence, since hand-written orderings tend to miss the exact edge case that breaks commutativity.
- **Multi-device simulation harness:** a dedicated test tool that spins up N simulated device instances (each with its own local event log and vector clock), applies a scripted sequence of concurrent operations, executes sync between them in a specified order, and asserts final convergence — this harness is built _before_ the conflict-resolution logic it tests, per Implementation_Pipeline.md §3's test-first requirement specific to Stage 4.
- **Every conflict scenario cataloged in Sync Architecture.md §3** has its own harness script — field-level merge conflicts (non-inventory entities) and event-sourced merge conflicts (inventory) are tested separately since they use different resolution strategies.

## 7. Hardware Testing

- Adapter contract tests (Hardware.md §7) run against simulated I/O doubles in CI for every peripheral interface (printer, scanner, drawer, scale) — asserting correct command generation and, critically, correct **fallback behavior** on simulated failure (paper-out, disconnect, jam) per Hardware.md §8's error-handling table.
- Physical hardware verification (real printer/scanner/scale models) is a manual checklist run before hardware-touching releases, tracked in project management tooling rather than automated CI, since physical device availability can't be guaranteed in a CI runner.

## 8. Security Testing

- **Permission enforcement tests:** for every `permissionCode` defined (Security.md §4), a test asserts that a user lacking it receives `403 PERMISSION_DENIED` with that exact code, and that a user holding it succeeds — run as a matrix across all system roles, not spot-checked.
- **Offline auth tests:** login works offline after at least one prior online login; login fails offline for a user who has never synced to that device; session timeout is enforced offline (Security.md §2.2).
- **Encryption verification:** an automated check confirms the local SQLite file is genuinely encrypted (not readable as plaintext when opened directly) as part of CI, not just assumed from configuration.
- **Audit immutability test:** a direct UPDATE/DELETE attempt against `audit_entries` or `stock_movement_events` must be rejected by the database trigger (Database.md §7) — tested at the database layer, not just asserted by application code discipline.

## 9. AI Testing

- **Advisory-only enforcement test** (referenced in Implementation_Pipeline.md Stage 5/6/7 gate): for every AI-originated recommendation type (price change, reorder, fraud flag), a test asserts there is no code path by which the recommendation applies to a real record without a corresponding explicit approval command — verified at the domain/command layer (e.g., `UpdatePriceCommand` has no AI-auto-approve branch, per AI.md §6) rather than only checking the AI-layer's stated intent.
- **Provider-fallback test:** simulates the primary cloud AI provider failing/timing out and asserts the fallback chain (Groq → Gemini Flash → graceful degradation) behaves per AI.md §1, including correct `source` tagging in the response.
- **Schema-validation retry test:** a deliberately malformed AI response triggers exactly one automatic retry, then the documented graceful fallback message (AI.md §2) — never a raw/garbled response shown to the user.
- **Forecast determinism test:** given identical historical input data, the statistical baseline forecast (AI.md §3) produces identical numeric output on repeated runs — since the numeric prediction is deterministic by design, non-determinism here is a bug, not expected model variance (that variance is confined to the LLM-generated narrative text only, which is not asserted for exact equality, only for schema validity).

## 10. Performance Testing

- A **low-end hardware baseline device profile** (specified against NFR-1) is used for performance regression testing — app cold-start time, POS "complete sale" latency, and large-report generation time are all benchmarked against this baseline, not against the developer's own machine.
- Sync backlog performance (a device reconnecting after weeks offline, per E2E flow 6) is load-tested with a realistically large pending-event backlog to verify pagination (API.md §5.2) keeps memory/time bounded rather than growing linearly with backlog size in an unacceptable way.

## 11. Full Regression Suite (Stage 9)

- The complete regression suite run before any release combines every category above: full unit + integration suite, all 10 Critical E2E Flows (§4), the full sync conflict catalog (§6), the full permission matrix (§8), and the AI advisory-only enforcement test (§9) — all required to pass together on a clean environment, not selectively re-run based on "what changed," since cross-cutting regressions (e.g., a Sync change subtly breaking a Report) are exactly what a full suite is meant to catch.

## 12. Test Data & Fixtures

- Seed fixtures represent realistic Egyptian retail scenarios (Arabic product names, EGP pricing, multi-branch grocery scenario) rather than generic Latin-placeholder data — catching RTL/i18n-specific bugs that ASCII-only fixtures would never surface.
- Fixtures are versioned alongside schema migrations (Database.md §8) so a fixture set always matches the schema version it's designed for.

---

_Testing.md — every Stage exit gate in Implementation_Pipeline.md cites a specific section of this document; a Stage cannot be considered exited if its corresponding tests here are not passing._
