# PRD.md — Smart Retail OS (Smart POS)

**Status:** v1.0 — Founder-approved discovery, ready for architecture phase
**Owner:** Single founder, implementation via AI coding agents
**Related documents:** Vision.md (context), Functional Specification.md (screen-level detail), Technical Architecture.md, Database Design.md, API Specification.md, Synchronization Architecture.md, Security.md, AI Architecture.md

## 0. Assumptions Log

Where the founder said "you decide" or where a gap existed, the following assumptions are made and carried consistently through all documents. Any assumption may be revisited later without re-running discovery.

| #   | Assumption                                                                                                                                                                                                                                                                         | Rationale                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Company = tenant boundary; Branch = operational unit under a Company                                                                                                                                                                                                               | Matches multi-company + multi-branch requirement                                                                                                                                |
| A2  | Currency precision stored as integer minor units (e.g., piasters)                                                                                                                                                                                                                  | Avoids floating-point financial errors                                                                                                                                          |
| A3  | All timestamps stored in UTC, rendered in branch-local timezone (Africa/Cairo default)                                                                                                                                                                                             | Standard practice for multi-branch/future MENA expansion                                                                                                                        |
| A4  | Soft-delete (archival) used for all business entities; hard delete never allowed except via GDPR-style data erasure request                                                                                                                                                        | Required for audit log integrity                                                                                                                                                |
| A5  | "Owner" and "Super Admin" are distinct: Owner = business owner role scoped to their company; Super Admin = the SaaS vendor's own internal role for platform operations                                                                                                             | Prevents conflating tenant admin with platform admin                                                                                                                            |
| A6  | There is no permanent free tier. Every new Company starts a single 14-day free trial with **all paid features (Pro-equivalent) unlocked**; at trial end, the account is **fully locked** (not silently downgraded to Free) until an active paid subscription is selected           | Founder-specified change from an earlier Free-tier-loss-leader model; a full-featured trial converts better and avoids indefinitely-usable free accounts eating support/AI cost |
| A7  | ETA e-invoice module ships disabled-by-default, enabled per company when needed                                                                                                                                                                                                    | Founder specified modular, optional activation                                                                                                                                  |
| A8  | Platform Administration (FR-19) is a distinct authentication realm from tenant/company auth — a Platform Admin (Super Admin, per A5) can view and manage every Company's subscription, plan, and lock state, including granting a company full access regardless of billing status | Founder requires direct operational control over every subscriber account, separate from any tenant-level Owner permission                                                      |

## 1. Product Summary

Smart Retail OS is a multi-tenant, offline-first, AI-embedded retail management platform delivered as Desktop (Tauri) + Android (Capacitor) applications backed by a self-hostable sync/AI backend. It targets Egyptian retail businesses of all sizes with a single flexible core engine, monetized via monthly EGP subscriptions across three paid tiers (Basic, Pro, Enterprise), preceded by a single full-featured 14-day free trial (no permanent free tier — see A6).

## 2. Modules Overview

1. Identity, Companies & Branches
2. Users, Roles & Permissions
3. Product Catalog & Inventory
4. Point of Sale (Sales)
5. Purchasing & Suppliers
6. Customers & Loyalty
7. Payments
8. Discounts, Coupons & Promotions
9. Taxes & Compliance (ETA-ready)
10. Warehousing & Stock Transfers
11. Reports & Dashboards
12. Notifications
13. AI Services (Assistant, Predictions, Fraud, OCR, Health Score)
14. Synchronization & Offline Engine
15. Backup & Disaster Recovery
16. Licensing & Subscription Billing
17. Audit Logging
18. Hardware Integration Layer
19. Platform Administration (internal, SaaS-vendor-only)

## 3. User Personas

- **Owner** — runs one or more companies; wants confidence, visibility, and growth insight; least technical, most outcome-focused.
- **Branch Manager** — runs daily operations of one branch; needs speed, approvals, staff oversight.
- **Cashier** — front-line, high transaction volume; needs an interface that is fast and error-resistant, minimal decision-making surface.
- **Inventory/Warehouse Employee** — manages stock accuracy; needs fast scanning workflows, transfer/receiving tools.
- **Accountant/Financial Manager** — needs accurate, exportable financial reports and tax data; least tolerant of data inconsistency.
- **Auditor/Read-only User** — needs full visibility, zero edit rights.
- **Purchasing Officer** — manages supplier relationships and POs.

## 4. Functional Requirements by Module

### 4.1 Identity, Companies & Branches

- FR-1.1: System supports multiple Companies (tenants), each with multiple Branches.
- FR-1.2: A Company has one or more Warehouses, which may be branch-specific or central/shared.
- FR-1.3: Company-level settings (currency, tax mode, language, working hours) cascade as defaults to branches, which may override where the business rule allows.
- FR-1.4: Company onboarding wizard collects business type (from the vertical list in §4.13) to preconfigure catalog templates and unit presets.

### 4.2 Users, Roles & Permissions

- FR-2.1: Predefined roles ship out of the box (Owner, Company Administrator, Branch Manager, Assistant Manager, Cashier, Inventory Manager, Warehouse Employee, Purchasing Officer, Sales Employee, Accountant, Financial Manager, Auditor, Customer Service, Marketing Employee, Delivery Employee, Technical Support, Read-only User).
- FR-2.2: Owner can create fully custom roles with granular, per-module, per-action permissions (view/create/edit/delete/approve).
- FR-2.3: A user account may hold different roles in different branches simultaneously.
- FR-2.4: Owner role has cross-company, cross-branch visibility of operations, AI insights, audit logs, billing, and backups.
- FR-2.5: Optional shift-based access: users may be restricted to defined working hours; system auto-logs-out outside shift window; late logins are flagged.
- FR-2.6: Configurable approval workflows for: large discounts, invoice cancellation, product deletion, inventory adjustments, price changes, manual stock corrections, refund approval, purchase approval. Thresholds and approver roles are owner-configurable per company.

### 4.3 Product Catalog & Inventory

- FR-3.1: Products support: simple products and products with unlimited variant dimensions (size, color, storage, flavor, weight, etc.), generated as SKU combinations.
- FR-3.2: Batch/lot tracking with manufacturing and expiry dates; expiry-based alerts and FEFO (first-expire-first-out) sale suggestions.
- FR-3.3: Unlimited unit-of-measure conversions per product (e.g., carton → piece, kg → gram) with automatic price and stock recalculation across units.
- FR-3.4: Barcode: auto-generation for products without one; support for existing manufacturer barcodes; internal QR generation.
- FR-3.5: Optional serial number tracking per unit for warranty-relevant categories.
- FR-3.6: Bundle/composite products: selling a bundle deducts stock from all component products per their bundle ratio.
- FR-3.7: Manual minimum stock threshold per product/branch; AI-suggested reorder points based on sales velocity and seasonality, requiring owner acceptance before becoming active thresholds.
- FR-3.8: Multi-warehouse stock visibility per product, per branch, aggregated at company level for the Owner.

### 4.4 Point of Sale

- FR-4.1: Cashier screen supports barcode scan, manual search, quick-category grid, and camera-based scanning (Android).
- FR-4.2: Cart supports line-level and cart-level discounts, split payments (unlimited combination of tender types), partial payments/customer credit.
- FR-4.3: Returns: full, partial, exchange, refund to original tender or store credit, mandatory return-reason capture, approval workflow for refunds above configurable threshold.
- FR-4.4: Receipt printing via ESC/POS thermal printers; digital receipt (WhatsApp/SMS/Email) as alternative or supplement.
- FR-4.5: Cash drawer session management: opening float, closing count, discrepancy reporting, per-cashier shift reconciliation.
- FR-4.6: All POS operations function fully offline; transactions queue locally and sync when connectivity resumes.

### 4.5 Purchasing & Suppliers

- FR-5.1: Purchase orders with approval workflow, supplier invoice recording (manual or OCR-assisted), goods receiving against PO with discrepancy handling.
- FR-5.2: Supplier ledger: payments, credit balances, returns, price history, delivery performance, AI-generated supplier performance rating.

### 4.6 Customers & Loyalty

- FR-6.1: Customer profile identified via phone number, loyalty ID, or customer code; purchase history, outstanding credit balance, credit limit and due dates.
- FR-6.2: Loyalty program: points accrual/redemption, membership tiers, cashback, birthday rewards, campaign-based bonus points.
- FR-6.3: Automated reminders for outstanding balances via configurable channel (WhatsApp/SMS/Email/Push).

### 4.7 Payments

- FR-7.1: Supported tenders at launch: cash, card (manual record; API-ready), Vodafone Cash/Orange Cash/Etisalat Cash/WE Pay, InstaPay, bank transfer, customer credit, store credit; gift cards architecturally reserved for future.
- FR-7.2: Split payments across unlimited tender combinations per transaction.
- FR-7.3: Payment provider integrations are plugin-based; no core-system change required to add a new provider.

### 4.8 Discounts, Coupons & Promotions

- FR-8.1: Discount types: item, cart, category, customer-specific, membership, time-based, Buy-X-Get-Y, quantity break.
- FR-8.2: Coupons: percentage/fixed, single/multi-use, expiry, scoped to customer/product/category/campaign.
- FR-8.3: All discount/coupon rules are owner-configurable without code changes (rule engine, not hardcoded logic).

### 4.9 Taxes & Compliance

- FR-9.1: Modular tax engine; default VAT-style configuration for Egypt, extensible to other tax regimes for future markets.
- FR-9.2: ETA e-invoice/e-receipt module: architecturally supported from v1, toggled on per company when required; invoice data model already carries all fields ETA submission requires (documented in API Specification.md).

### 4.10 Warehousing & Stock Transfers

- FR-10.1: Transfer lifecycle: Request → Approval → Shipment → Receiving → Inventory Adjustment → Audit Log entry, at every step.
- FR-10.2: Central warehouse-to-branch and branch-to-branch transfers both supported.

### 4.11 Reports & Dashboards

- FR-11.1: Day-one reports: Daily Sales & Revenue Summary, Profit & Loss, Inventory Valuation & Movement, Best/Worst Sellers, Employee/Cashier Performance, Expenses, Purchases, Customer Debts, Supplier Debts, Tax Summary, Cash Flow, AI Insights, Dead Products, Branch Comparison, Discount Analysis, Return Analysis, Product Profitability.
- FR-11.2: All reports filterable, exportable (PDF/CSV), and schedulable (daily/weekly/monthly/quarterly) for automated delivery via Email/PDF/Push/Dashboard.

### 4.12 Notifications

- FR-12.1: Channels: Push, In-App, Email, WhatsApp, SMS — provider-agnostic, replaceable.
- FR-12.2: Trigger catalog includes stock/prediction alerts, fraud/anomaly alerts, backup status, sync status/conflicts, subscription lifecycle events, large refund/discount alerts, AI recommendations, system updates — all owner-configurable per channel and threshold.

### 4.13 AI Services

See AI Architecture.md for full design. Functional scope for v1 (must-have): AI Assistant (hybrid offline/online), Sales Prediction, Inventory Prediction, Smart Alerts, Store Health Score, Fraud Detection, Dead Product Detection, Branch Comparison, Cash Flow Prediction, Customer Segmentation, basic OCR (printed Arabic/English invoices), Anomaly Detection. All AI outputs are recommendations; no AI action is irreversible or auto-applied (pricing, purchase orders, deletions all require owner approval).

### 4.14 Synchronization & Offline Engine

- FR-14.1: 100% of daily operations function fully offline with zero feature degradation for core POS/inventory/customer functions.
- FR-14.2: Sync is automatic, silent, and background; conflicts requiring human judgment surface a review prompt to the owner/manager before applying.
- FR-14.3: Inventory movements are event-sourced (never raw overwrite); other entities use field-level merge; true conflicts fall back to manual resolution.
- FR-14.4: Sync transport auto-selects the fastest available path: LAN/peer-to-peer when devices share a network, cloud relay otherwise.

### 4.15 Backup & Disaster Recovery

- FR-15.1: Incremental, encrypted, compressed backups to any combination of local disk, external drive, network storage, and cloud.
- FR-15.2: Automatic daily backup, on-demand manual backup, automatic integrity verification, point-in-time restore, and selective restore.

### 4.16 Licensing & Subscription Billing

- FR-16.1: Three paid tiers — Basic, Pro, Enterprise — differentiated by branch count, user count, AI feature access, and support level (full matrix in §6). There is no permanent free tier (per A6).
- FR-16.2: License bound to Company account, not device; devices register under the company, enabling device replacement without a new license.
- FR-16.3: Hybrid offline validation: offline activation, silent background validation when online, long grace period for **paid, active** subscriptions — business operations never halt due to short-term connectivity loss for a company in good standing. This grace period is distinct from, and does not extend, the trial period in FR-16.4.
- FR-16.4: **14-day free trial**, no payment method required to start. During the trial, every feature across every module in §2 is unlocked — functionally equivalent to the highest (Enterprise) tier — so a prospective customer evaluates the complete product, not a limited slice.
- FR-16.5: **Trial expiry behavior:** when the 14-day trial ends without an active paid subscription selected, the account transitions to a **fully locked state** — no module (POS, Inventory, Reports, AI, etc.) remains usable, and no new offline transactions may be recorded, until the Owner selects and activates a paid tier. Locking is a deliberate hard stop, not a downgrade to a reduced feature set, per A6.
  - Exception (data-safety carve-out, per NFR-2/Vision.md "data safety above all"): a locked account may still (a) view its own historical read-only reports/data already synced, (b) export a backup of its data, and (c) access the billing/upgrade screen — but may not create, edit, or delete any business record, and may not use any AI feature, while locked.
  - A locked device already holding queued offline transactions from before lock does **not** discard them — they remain safely queued and sync/apply automatically the moment the account is reactivated, consistent with the zero-transaction-loss guarantee (NFR-2).
- FR-16.6: Trial-ending reminders fire at day 7, day 3, day 1, and the moment of lock (see Notifications.md), so an Owner is never surprised by a lock.
- FR-16.7: Reactivating a locked account (selecting and paying for a tier) unlocks all functionality immediately upon payment confirmation, with no re-onboarding required — all data created before the lock (and any safely-queued offline transactions) is exactly as it was.

### 4.17 Audit Logging

- FR-17.1: Immutable audit trail for: login/logout/failed login, price changes, product edits, stock adjustments, returns, refunds, discounts, permission/role changes, backup/restore, sync events, subscription changes.

### 4.18 Hardware Integration

- FR-18.1: ESC/POS thermal printers (Epson + common Chinese-brand compatibility), USB and Bluetooth barcode scanners, camera-based scanning on Android, cash drawer (printer-triggered), electronic scale, customer-facing display, card terminal (manual record now, API-ready), QR/label/barcode printers. Plugin architecture for future hardware.

### 4.19 Platform Administration (internal)

- FR-19.1: SaaS-vendor-only console for managing tenant billing, license status, platform-wide telemetry, support tooling, and AI provider routing — not exposed to any customer role, and authenticated through an entirely separate credential space from any Company/tenant login (per A8, detailed in Security.md).
- FR-19.2: A Platform Admin can view a list of every Company (subscriber) on the platform, including: current plan/tier, trial vs. paid status, trial end date or current billing period, lock state, last-seen activity, and device count.
- FR-19.3: A Platform Admin can change any Company's assigned plan/tier (e.g., move a company from Basic to Pro) directly, independent of that company's self-service upgrade flow — used for manual sales deals, support goodwill, or correcting a billing error.
- FR-19.4: A Platform Admin can grant a Company a **full-access override** — the company behaves as if fully paid/Enterprise-tier regardless of actual billing/trial state — with a mandatory reason field and an optional expiry date for the override (e.g., a 30-day goodwill extension, or an indefinite override for a partner/reference account). An override always supersedes the normal trial/lock logic in FR-16.5.
- FR-19.5: A Platform Admin can manually **lock or unlock** any Company at will (independent of trial/billing state) — e.g., to suspend an account for a billing dispute or policy violation, or to unlock one early as a courtesy — with a mandatory reason field.
- FR-19.6: Every Platform Admin action against a Company (plan change, override grant/revoke, manual lock/unlock) is recorded in an immutable, cross-tenant admin action log, distinct from each Company's own internal audit log (Security.md §5), and is itself visible in the Platform Admin console for accountability.
- FR-19.7: Platform Admin accounts are provisioned and managed separately from any Company's users (they are not "Company Owners with extra permissions" — they have no Company at all) and require the strongest authentication available in the system (Security.md §11).

## 5. Non-Functional Requirements

- **NFR-1 Performance:** POS sale completion (scan-to-receipt) under 300ms on target low-end hardware (per Technical Architecture.md hardware baseline).
- **NFR-2 Reliability:** Zero tolerated transaction loss; all writes durable locally before being considered "complete," regardless of sync state.
- **NFR-3 Security:** Encryption at rest for local DB, backups, and sensitive fields; encrypted transport for all sync/API calls.
- **NFR-4 Scalability:** Architecture supports growth from 1-branch/1-device to enterprise multi-company/multi-branch/many-device deployments without redesign.
- **NFR-5 Portability:** Desktop targets Windows at launch; architecture remains cross-platform-capable (Linux/macOS later) with no Windows-only dependencies in core logic.
- **NFR-6 Localization:** Arabic (RTL, MSA default UI, Egyptian Arabic AI assistant tone) and English (LTR) at launch; unlimited additional languages without core code changes.
- **NFR-7 Maintainability:** Deterministic, strictly-typed, documented codebase suitable for AI-agent-driven implementation and long-term (10-year) maintenance.
- **NFR-8 Cost:** Free/open-source technology preferred at every layer; any paid dependency must have a documented free fallback.

## 6. Subscription Tier Matrix

| Feature                                         | 14-Day Trial               | Basic                     | Pro                       | Enterprise                |
| ----------------------------------------------- | -------------------------- | ------------------------- | ------------------------- | ------------------------- |
| Branches                                        | Unlimited (trial only)     | Multiple (capped)         | Multi-branch              | Unlimited                 |
| Users                                           | Unlimited (trial only)     | Multiple                  | Multiple                  | Unlimited                 |
| Companies                                       | 1                          | 1                         | 1                         | Multi-company             |
| Core POS/Inventory                              | ✔                          | ✔                         | ✔                         | ✔                         |
| Standard Reports                                | ✔ (all reports)            | ✔                         | ✔                         | ✔                         |
| Basic AI Recommendations                        | ✔                          | ✔                         | ✔                         | ✔                         |
| AI Assistant, OCR, Fraud Detection, Forecasting | ✔                          | —                         | ✔                         | ✔                         |
| Advanced Permissions/Custom Roles               | ✔                          | —                         | Partial                   | ✔                         |
| Priority Support / Dedicated Deployment         | —                          | —                         | —                         | ✔                         |
| Backup                                          | Daily                      | Daily                     | Daily + Cloud             | Daily + Cloud + Custom    |
| After period ends without payment               | **Fully locked** (FR-16.5) | Grace period, then locked | Grace period, then locked | Grace period, then locked |

_(Exact numeric caps per paid tier are a pricing/business decision to be finalized before launch — flagged as an open item, not blocking architecture work. The Trial column is intentionally "everything on" — it mirrors Enterprise feature access for exactly 14 days, per A6/FR-16.4, and is never itself a selectable ongoing tier — a company must convert to Basic, Pro, or Enterprise before or at trial end, or lock per FR-16.5.)_

A Platform Admin may override any Company to full-access regardless of this table, per FR-19.4.

## 7. Edge Cases & Business Rules (representative — full catalog in Functional Specification.md)

- Selling a bundle when a component is out of stock: system blocks sale of the bundle and shows which component is insufficient (never oversells silently).
- Two devices editing the same product price offline: field-level merge applies both if fields differ (e.g., price vs. description); if the same field was changed on both, it queues as a manual conflict for the branch manager/owner.
- Refund requested after loyalty points were earned on the original sale: points are automatically reversed proportionally.
- Cashier shift ends with unsynced offline transactions: transactions remain queued and are included in end-of-shift reconciliation locally; sync completes when connectivity returns without blocking shift close.
- Expired batch still in stock: system prevents sale of expired batch by default (owner-configurable override with manager approval for edge cases like discounted clearance).

## 8. Out of Scope (v1)

- Full computer-vision shelf analysis.
- Voice AI assistant.
- Autonomous (non-approved) pricing or purchasing actions.
- Direct payment terminal API integration (manual recording only at v1; architecture is API-ready).
- Non-Egypt tax regimes (architecture supports; not activated).
- macOS/Linux desktop builds (planned Phase 2+).

## 9. Future Scope

MENA market expansion, multi-currency live operation, computer vision, voice AI, autonomous recommendation execution (with owner opt-in), direct payment terminal integrations, franchise/enterprise deployment tooling, additional retail-vertical modules (restaurant table management, etc.).

## 10. Success Metrics

- EGP 20,000+ MRR within 6 months of launch.
- Growing active paying customer base with high retention (target retention benchmark to be set once first cohort data exists).
- Reliable offline sync (target: zero data-loss incidents; conflict-resolution success rate tracked as a core health metric).
- Stable production system (uptime target defined in Technical Architecture.md).

---

_This document is Phase 2 of the Smart Retail OS documentation package. Next: Functional Specification.md._
