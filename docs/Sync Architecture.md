# Sync Architecture.md — Smart Retail OS

**Status:** v1.0 — Draft for founder review, ready for implementation-agent handoff
**Owner:** Single founder, implementation via AI coding agents
**Depends on:** PRD.md, Vision.md
**Consumed by:** Technical Architecture.md, Database Design.md, API Specification.md, AI.md, UI_UX.md, Testing.md, Implementation Pipeline.md

## 0. Assumptions Log

Carried forward from PRD.md (A1–A7), plus sync-specific assumptions below. Any assumption may be revisited without re-running discovery.

| #   | Assumption                                                                                  | Rationale                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Every write-capable device holds a full local MongoDB database, not a cache                 | Offline-first requires zero degradation; a cache implies a source of truth elsewhere. MongoDB local is always the source of truth on the device; sync is background-only                              |
| S2  | All entity IDs are client-generated UUIDv7 (timestamp-ordered)                              | Enables offline creation without server round-trip, while keeping IDs roughly sortable by creation time                                                                                               |
| S3  | Clock ordering uses a Hybrid Logical Clock (HLC), not wall-clock timestamps alone           | Wall clocks drift/lie on cheap Android hardware; HLC gives causally-consistent ordering without a synchronized clock                                                                                  |
| S4  | Inventory-affecting entities are event-sourced; all other entities use field-level merge    | Matches FR-14.3 exactly; inventory cannot tolerate "last write wins" because it represents physical stock, not just a data field                                                                      |
| S5  | The cloud relay is a store-and-forward relay, not a authoritative rewriting server          | Preserves "no vendor lock-in" — the relay could be swapped for any dumb message broker without changing conflict logic, which lives entirely in client + backend sync engine code shared as a library |
| S6  | A branch's LAN is the default transport when any two company devices share a subnet         | Lower latency, zero data cost, works with zero internet — directly serves the offline-first goal                                                                                                      |
| S7  | Conflict resolution logic is deterministic and identical on every device and on the backend | Determinism means any node (or the AI agent building it) can independently compute the same merge result — required for the sync engine to be testable and for trust in reconciliation                |

## 1. Purpose & Scope

This document is the single source of truth for how data moves, merges, and stays consistent across every Smart Retail OS device — Desktop (Tauri), Android (Capacitor), and the self-hostable backend. It governs:

- How every module (POS, Inventory, Customers, Purchasing, etc.) writes data locally first, always.
- How two or more devices that changed the same data reconcile without data loss or silent corruption.
- How the system chooses between LAN peer-to-peer and cloud relay transport.
- How failures, retries, and queuing work so that no operation is ever blocked by a network condition.

Per Vision.md §5, **data safety outranks feature velocity at every design decision in this document.** Where a tradeoff exists between sync elegance and the risk of losing or corrupting a transaction, this document always resolves in favor of safety, even at the cost of extra manual-conflict prompts.

Out of scope here (covered elsewhere): database schema definitions (Database Design.md), REST/event API contracts (API Specification.md), UI treatment of conflict prompts (UI_UX.md), backup/restore mechanics (Backup & Disaster Recovery, per PRD §4.15).

## 2. Core Principles

1. **Local write is the only write that matters at the moment of the transaction.** A sale, stock adjustment, or customer edit is considered "complete" the instant it is durably committed to the local database (NFR-2). Sync is a background process layered on top — never a precondition for a business operation to succeed.
2. **Every mutation is captured as a change, not just a state.** Whether the underlying storage is an event log (inventory) or a row-based table (products, customers), the sync engine treats every write as a discrete, timestamped, attributable change record. This is what makes merge and replay possible.
3. **No mutation is ever silently lost.** If two devices produced conflicting changes that cannot be merged deterministically, the system surfaces a manual conflict — it never picks a "winner" silently for financially or operationally meaningful fields.
4. **Sync is invisible when it works, loud when it can't.** Per FR-14.2, sync should require zero owner attention 99% of the time. The 1% (true conflicts) must be impossible to miss and easy to resolve.
5. **Transport is an implementation detail, not a user concern.** The owner never picks "sync via LAN" or "sync via cloud" — the system does, automatically, per §7.

## 3. Two Sync Strategies by Data Class

Not all data behaves the same way when edited concurrently. Smart Retail OS splits every entity in the system into exactly one of two classes.

### 3.1 Class A — Event-Sourced Entities (Inventory & Stock Movements)

**Applies to:** stock levels, stock movements of every kind (sale, return, purchase receipt, transfer, adjustment, bundle deduction, expiry write-off, damage write-off).

**Why:** A stock quantity is not "a value" — it is the running total of every physical movement that ever happened to it. Two branches selling the same SKU offline simultaneously are not "conflicting edits of one number"; they are two independent, both-valid events that must both be applied. Treating stock as a mutable field (e.g., `quantity: 42`) and doing last-write-wins would silently destroy one of the two sales' effect on stock. Event sourcing makes this class of bug structurally impossible.

**Mechanics:**

- Every stock-affecting action appends an immutable `StockEvent` record: `{event_id (UUIDv7), entity_id (product/variant/batch), branch_id, warehouse_id, event_type, quantity_delta, hlc_timestamp, origin_device_id, causal_reference (e.g., sale_id), created_at_local}`.
- Current stock is a **materialized projection** — the sum of all applicable events for that product/branch/warehouse — never a value that is directly written by the UI.
- Events are never edited or deleted. A correction (e.g., "that adjustment was wrong") is itself a new, opposite-signed event with a reference back to the event it corrects. This preserves a full, honest audit trail (feeds directly into Audit Logging, PRD §4.17).
- Sync of Class A data is pure **event replay**: devices exchange the events the other hasn't seen yet (see §6 Incremental Sync), each device appends them to its local event log, and the projection recalculates. Because addition is commutative, the order events arrive in doesn't matter to the final total — only causal display order matters for showing a history.
- **Negative-stock guard:** because a sale event applied offline may briefly push a projection negative before a matching restock event syncs in, negative stock is allowed transiently but flagged; it self-corrects once all events are merged, and any lasting negative balance after a full sync converges into an anomaly alert (feeds AI.md §Anomaly Detection).

**FEFO/batch note (FR-3.2):** batch/lot records are Class A too — each batch has its own event stream, so FEFO suggestions and expiry write-offs are just typed events against a specific batch, not edits to a shared "batch table" row.

### 3.2 Class B — Field-Merged Entities (Everything Else)

**Applies to:** products (name, description, price, category, images), customers, suppliers, users/roles, discounts/promotions, settings, most everything that isn't a stock movement.

**Why:** These entities are naturally "current state" objects — a product has one current price, one current name. Concurrent edits to _different fields_ of the same entity (owner changes the price on Desktop while a manager changes the description on Android, both offline) should both survive. Concurrent edits to the _same field_ are the only real conflict.

**Mechanics:**

- Every entity row carries a per-field HLC timestamp (not just one row-level `updated_at`). Conceptually: `{ name: {value, hlc}, price: {value, hlc}, description: {value, hlc}, ... }`.
- **Merge rule:** for each field independently, the change with the later HLC wins. If field A changed only on Device 1 and field B changed only on Device 2, the merged record has Device 1's field A and Device 2's field B — both preserved. This directly implements the PRD §7 edge case: _"price vs. description edited differently on two devices offline → field-level merge applies both."_
- **True conflict rule:** if the _same field_ was changed on two devices with no way to establish one as causally later (concurrent HLCs, i.e., neither device had seen the other's change), the system does **not** silently apply last-write-wins to that field. It is queued as a manual conflict (§5) surfaced to the Branch Manager/Owner, per FR-14.2 and the PRD §7 price-conflict edge case. Everything else on the record still merges automatically — only the contested field blocks.
- Soft-deletes (A4 in PRD) are themselves just a field (`archived_at`) subject to the same per-field merge rule — an "un-delete" on one device and an edit on another both survive correctly.

### 3.3 Class Assignment Table (representative, full table lives in Database Design.md)

| Entity                            | Class                          | Notes                                                                                                                                                                                         |
| --------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stock movements, batch quantities | A (event-sourced)              | Never overwritten, only appended/corrected                                                                                                                                                    |
| Sales / invoices                  | A (event-sourced, append-only) | A sale is itself an event; returns are new linked events, never edits to the original sale                                                                                                    |
| Cash drawer sessions              | A (event-sourced)              | Open/close/count events; reconciliation is a projection                                                                                                                                       |
| Products, variants, pricing       | B (field-merge)                | Per-field merge, price field flagged for stricter conflict review                                                                                                                             |
| Customers, loyalty balances       | B, with loyalty points as A    | Customer profile fields are B; point balance is a derived event stream so redemptions/reversals never race                                                                                    |
| Suppliers, PO headers             | B                              | Purchase order line items receive/reject events are A                                                                                                                                         |
| Users, roles, permissions         | B                              | Conflicts here are rare but escalate to Owner-only resolution given security sensitivity                                                                                                      |
| Settings (company/branch config)  | B                              | Company-level settings changes always outrank branch overrides only if branch hasn't explicitly overridden — modeled as a field-merge with explicit "inherited vs. overridden" flag per field |
| Audit log                         | A (append-only, no merge)      | Immutable by definition; sync is pure append, duplicates de-duplicated by event_id                                                                                                            |

## 4. Identifiers, Clocks & Causality

- **IDs:** All primary keys are client-generated UUIDv7. This lets any device — online or offline — create a fully valid, globally unique record with no server round-trip, while remaining roughly time-sortable for indexing performance.
- **Clock:** A Hybrid Logical Clock (HLC = wall-clock component + logical counter) is maintained per device. HLC advances on every local write and is updated to `max(local, incoming) + 1` whenever a device receives a remote change. This gives:
  - Correct causal ordering even when device clocks are skewed or the device was offline for days.
  - A cheap way to detect true concurrency (§3.2): two changes are concurrent if neither HLC is derivable as "after" the other given what each device had seen at write time.
- **Vector of last-seen state per peer:** each device keeps a per-peer (and per-backend) watermark — the highest HLC it has successfully received from that peer — to drive incremental sync (§6) without re-transmitting history.

## 5. Conflict Resolution — Full Rule Set

| Scenario                                                                         | Class | Resolution                                                                                                                                                       |
| -------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same field, sequential edits (one device had seen the other's change)            | B     | Later HLC applies automatically, no prompt                                                                                                                       |
| Same field, concurrent edits (neither had seen the other's)                      | B     | Manual conflict queued; both values shown side-by-side with device/user/time attribution; Branch Manager/Owner picks or merges manually                          |
| Different fields, same record, concurrent edits                                  | B     | Both auto-applied, no prompt (this is the common case, not a conflict)                                                                                           |
| Two stock events for the same product from different devices                     | A     | Both applied, projection recalculates; never a conflict by construction                                                                                          |
| A stock adjustment appears to make quantity negative after merge                 | A     | Not blocked; flagged as an anomaly for owner review (see AI.md); a genuine oversell is a business event to investigate, not a sync error to hide                 |
| Same role/permission field changed on two devices                                | B     | Escalates directly to Owner (not Branch Manager) given security sensitivity, even below the normal manager threshold                                             |
| Record archived (soft-deleted) on one device, edited on another                  | B     | Archival and edit both apply (record ends up archived with the edited field values); Owner notified so they can un-archive if the edit implies it's still in use |
| Bundle sale attempted where component stock is insufficient after merge resolves | A     | Enforced at the point of sale (local check before sync, FR rule in PRD §7), not a post-hoc sync conflict — sync never "undoes" a completed sale                  |

**UI/notification contract:** every manual conflict generates a Notification (PRD §4.12 trigger catalog: "sync status/conflicts") and is visible in a dedicated Conflict Review queue, never buried silently in a log. Full screen/dialog behavior is defined in UI_UX.md.

## 6. Sync Protocol — Incremental, Outbox-Based

1. **Local outbox:** every local write (event append or field-merge change) is simultaneously written to the entity's local store **and** appended to the local, durable `sync_outbox` **MongoDB collection** in the same atomic operation. MongoDB's document-level atomicity guarantees that if the app crashes mid-write, the outbox entry either exists (and will sync) or doesn't (and the original write also didn't commit) — no partial states. Alternatively, the outbox can be driven by MongoDB **change streams** on the primary collections, capturing every insert/update and fanning it into the outbox collection automatically.
2. **Incremental pull/push:** when connectivity to a peer or the backend is available, a device:
   - Sends its outbox entries with HLC ≥ the peer's last-known watermark for this device.
   - Requests the peer's changes with HLC ≥ its own last-known watermark for that peer.
   - This is a true delta sync — full-table re-sync is never required in steady state, keeping sync fast and cheap even on poor connections (relevant for Egyptian mobile data conditions).
3. **Idempotent apply:** every change (event or field-merge diff) carries its own UUIDv7 `change_id`. Applying the same change twice (e.g., due to a retried connection) is a no-op — the receiving side deduplicates by `change_id` before applying.
4. **Batching & compression:** outbox entries sync in batches (size and cadence configurable; small batches for LAN's low latency, larger compressed batches for cloud relay to minimize round-trips on slow connections).
5. **Backend role:** the backend is a durable relay and a "peer of last resort" — it stores every change it has seen (for devices that are never on the same LAN) but does not rewrite, reorder, or resolve conflicts itself. All conflict logic is shared, versioned client-and-backend library code, so the backend could in principle be swapped (per NFR "no vendor lock-in") without changing merge semantics.

## 7. Transport Selection — LAN First, Cloud Fallback

Per FR-14.4, transport is chosen automatically and re-evaluated continuously, never configured manually by the owner:

1. **Discovery:** devices on the same branch periodically advertise/discover each other via local network service discovery (e.g., mDNS/Bonjour-style broadcast) scoped to the company's device registry — a stranger's device on the same coffee-shop Wi-Fi is never trusted or discovered.
2. **Preference order:**
   - **LAN peer-to-peer** — used whenever two company-registered devices are reachable on the same subnet. Zero data cost, lowest latency, works with zero internet access, and is the default expectation inside a single branch during business hours.
   - **Supabase Realtime (cloud relay channel)** — used when devices are not on the same network (e.g., Owner's phone checking a branch from home, or two branches syncing to each other). Supabase Realtime is used as the cloud relay channel, not as a primary database. Requires internet; queues locally and retries per §8 when unavailable.
   - **WebSocket fallback** — a direct WebSocket connection to the self-hosted backend sync server (API.md §5.4) is used when Supabase Realtime is unavailable or not configured; it provides equivalent store-and-forward relay semantics.
3. **Simultaneous operation:** LAN and cloud sync are not mutually exclusive — a device may push to a LAN peer and the cloud relay at the same time if both are reachable, so a single branch's LAN sync doesn't leave the cloud copy (used for owner's remote dashboards, backups, AI processing) stale.
4. **No user-visible switch:** from the owner's perspective there is one "Sync Status" indicator (Up to date / Syncing / N pending / N conflicts) regardless of which transport is active underneath, per the invisibility principle in §2.

> **Supabase role clarification:** Supabase is used as sync relay infrastructure (Realtime channels for message brokering) and as Supabase Storage for encrypted backup files (Database.md §9). It is **not** a primary database, and sync conflict logic never executes inside Supabase — all merge/conflict resolution runs in the shared client+backend library (§6, §7 assumption S5).

## 8. Queue, Retry & Durability

- **Durable local queue:** the `sync_outbox` collection (per §6) is the queue. It survives app restarts, device reboots, and crashes because it's part of the same local MongoDB write operation as the business write it represents.
- **Retry policy:** exponential backoff with jitter (e.g., 5s → 10s → 20s ... capped, then periodic retry every few minutes) for both LAN discovery attempts and cloud relay pushes. Retries are silent and automatic — never require the user to "tap to retry" for routine connectivity loss.
- **No dead-letter deletion:** a change never expires out of the outbox on its own. It stays queued indefinitely until successfully acknowledged by at least one peer or the cloud relay (whichever is configured as the durability target for that company's plan). This directly serves NFR-2 (zero tolerated transaction loss).
- **Shift-close independence:** per the PRD §7 edge case, an unsynced end-of-shift reconciliation is not blocked by pending outbox entries — local reconciliation reads local state (which already reflects all local writes); sync continues in the background afterward.
- **Backpressure:** if the outbox grows very large (e.g., device offline for weeks), sync resumes as a background incremental catch-up rather than one giant blocking transfer, so the app remains responsive to new sales throughout.

## 9. Security in Transit & at Rest

- All LAN and cloud sync traffic is encrypted in transit (TLS for cloud relay; authenticated encrypted channel for LAN peer connections, keyed off the company's device registry — see Security.md for key management detail).
- Devices only sync with peers that hold a valid, registered credential for the same Company (tenant boundary, per PRD A1) — a device is never able to receive or send another company's data even if physically on the same network.
- At-rest encryption of the local MongoDB database and outbox collection is covered in Security.md (§3.1, MongoDB field-level encryption via libmongocrypt); this document assumes that layer exists underneath the sync engine without re-specifying it.

## 10. Observability & Health Metrics

Per PRD §10 success metrics ("reliable offline sync... conflict-resolution success rate tracked as a core health metric"), the sync engine emits, per device and aggregated per company:

- Pending outbox size (count and oldest-entry age).
- Last successful sync timestamp per peer/backend.
- Conflict count (opened/resolved/pending), surfaced to Reports.md's future "Sync Health" view.
- Failed-apply count (should be structurally ~zero given idempotent apply — a non-zero count indicates a schema or bug issue worth alerting on, not a normal user-facing conflict).

This telemetry feeds both the owner-facing Sync Status indicator (§7) and, at the platform level, Platform Administration (PRD §4.19) for the SaaS vendor to monitor fleet-wide sync health.

## 11. Explicit Non-Goals

- This document does not specify a CRDT library or third-party sync framework by name — the mechanics above (event sourcing for Class A, per-field HLC merge for Class B) are deliberately simple and implementable directly, in keeping with "zero vendor lock-in" and "documented precisely enough for AI coding agents" (Vision.md §3, §5).
- Real-time collaborative editing (e.g., two cashiers seeing each other's cart live) is out of scope — sync latency of seconds is acceptable; this is an eventual-consistency system, not a real-time multiplayer system.
- Cross-company data sharing/merging is explicitly disallowed by the tenant boundary (A1) and is not a sync scenario this document needs to handle.

## 12. Open Items for Technical Architecture.md / Database Design.md

- Exact schema for `sync_outbox`, per-field HLC storage strategy (columnar per-field timestamps vs. a JSON sidecar column) — a database-design decision, not a sync-semantics decision, so deferred to Database Design.md.
- Concrete LAN discovery protocol choice (mDNS vs. a lightweight custom broadcast) — a technology selection to be finalized in Technical Architecture.md under the free/open-source-first policy (Vision.md §5).
- Batch size / retry interval tuning constants — implementation detail, not architecture, to be set (and made configurable) during build.

---

_This document is part of the Smart Retail OS documentation package. Depends on PRD.md and Vision.md. Feeds Technical Architecture.md, Database Design.md, API Specification.md, AI.md, UI_UX.md, and Implementation Pipeline.md._
