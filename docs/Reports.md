# Reports.md — Smart Retail OS Reporting & KPI Specification

**Depends on:** Database.md (read models, event sourcing), Architecture.md §4 (CQRS), PRD.md (reporting requirements), API.md §4.6
**Feeds into:** UI_UX.md §2.5 (Report Viewer, Store Health Dashboard), Notifications.md (scheduled delivery), AI.md §7 (Store Health Score narrative)

## 1. Reporting Architecture

- All reports read from **denormalized read models**, never directly from transactional/event tables — per Architecture.md §4 CQRS separation. This keeps report queries fast and lets the write path (Sales, Inventory, Purchasing) stay fully decoupled from report shape.
- Read models are **materialized by a projection worker** (`apps/backend/src/workers`) that consumes Domain Events as they're appended (`stock_movement_events`, `orders`, etc.) and updates report-optimized tables/views incrementally — not by re-scanning the full event log on every request.
- **Offline parity:** the same projection logic runs locally on Desktop/Android (per Architecture.md §7), so every report in §2 below renders fully offline from the device's local event log, with a visible "as of last sync" timestamp (per UI_UX.md §3) when the device hasn't recently synced with peers/server.
- Report queries are always scoped by `company_id` and, where applicable, `branch_id` — enforced by the same tenant-isolation rule as every other query (Database.md §4).

## 2. Report Catalog

Each report below defines: purpose, default filters, key columns/metrics, minimum required permission, and available export formats. All reports support the cross-cutting rules in API.md §1 (pagination, filtering, sorting) where the report is tabular, and `?format=json|pdf|csv` (API.md §4.6) uniformly.

### 2.1 Daily Sales Summary

- **Purpose:** end-of-day snapshot for a branch — the single most-viewed report.
- **Filters:** `branchId` (required), `date` (default today).
- **Metrics:** gross sales, discounts, tax, net sales, transaction count, average basket size, payment-method breakdown (cash/card/wallet), top 5 products by revenue, hourly sales curve.
- **Permission:** `reports.view.sales`.
- **Endpoint:** `GET /v1/reports/daily-sales` (API.md §4.6).

### 2.2 Profit & Loss

- **Purpose:** period-level financial health for owners/accountants.
- **Filters:** `from`, `to`, optional `branchId` (omitted = company-wide roll-up).
- **Metrics:** revenue, COGS (from `product_variants.cost` at time of sale, not current cost — historical cost snapshot per line), gross margin, operating adjustments (returns, shrinkage from stock adjustments), net profit estimate.
- **Permission:** `reports.view.financial` (owner/accountant roles only — never exposed to Cashier).
- **Endpoint:** `GET /v1/reports/profit-loss`.

### 2.3 Inventory Valuation

- **Purpose:** current stock value at cost and at retail price, by warehouse/category.
- **Filters:** `warehouseId`, `categoryId`, `asOfDate` (defaults to now; historical valuation reconstructable since stock is event-sourced, per Architecture.md §6).
- **Metrics:** quantity on hand, unit cost, extended cost value, extended retail value, aging buckets (0–30/31–60/61–90/90+ days since last movement).
- **Permission:** `reports.view.inventory`.

### 2.4 Stock Movement Report

- **Purpose:** full audit trail of a product/warehouse's stock changes — a read-only view over `stock_movement_events`.
- **Filters:** `productVariantId`, `warehouseId`, date range, `eventType`.
- **Metrics:** chronological ledger (event type, quantity delta, running balance, reference, device/user who triggered it).
- **Permission:** `reports.view.inventory`.
- **Endpoint:** underlying data reuses `GET /v1/stock/movements` (API.md §4.3); this report adds running-balance computation and export.

### 2.5 Branch Comparison

- **Purpose:** multi-branch owners comparing performance side by side.
- **Filters:** `branchIds[]`, date range, metric selector (sales/margin/footfall-proxy via transaction count/AI Store Health sub-scores).
- **Metrics:** ranked table + trend sparklines per branch.
- **Permission:** `reports.view.financial` at company scope (requires cross-branch visibility permission, not just single-branch role — see Security.md §4).

### 2.6 Cash Flow Prediction _(Phase 2, per Vision.md §8 roadmap; scaffolded here for schema stability)_

- **Purpose:** forward-looking cash position combining historical sales pattern, pending payables (`purchase_orders`), and receivables (`credit_ledger_entries`).
- **Status:** deferred to Phase 2 per PRD AI priority ranking; the read-model shape (payables/receivables aggregation) is built in Stage 6 so Stage 7's AI layer can consume it without a schema change later.

### 2.7 Employee / Cashier Performance

- **Purpose:** per-cashier sales volume, average transaction time, void/return rate — feeds Fraud Detection (AI.md §4) but is also a standalone manager report.
- **Filters:** `branchId`, `userId`, date range.
- **Metrics:** transactions handled, total sales, average basket, void count/rate, return count/rate, shift variance history (from Shift Open/Close, UI_UX.md §2.1).
- **Permission:** `reports.view.employees`.

### 2.8 Customer & Loyalty Report

- **Purpose:** identified-customer purchase behavior and loyalty program health.
- **Filters:** date range, `segmentId` (from AI.md §8 RFM segmentation, when available), `branchId`.
- **Metrics:** repeat purchase rate, average order value by segment, loyalty points issued/redeemed, top customers by lifetime value.
- **Permission:** `reports.view.customers`.
- **Note:** excludes guest/anonymous sales from customer-level breakdowns, consistent with AI.md §8.

### 2.9 Tax / ETA Report

- **Purpose:** tax collected by rule/category, and (once ETA module active per Vision.md §8 Phase 2) e-invoice submission status roll-up.
- **Filters:** date range, `taxRuleId`.
- **Metrics:** taxable sales, tax collected, `eta_invoices.submission_status` counts (pending/submitted/failed) when `companies.eta_enabled = true`.
- **Permission:** `reports.view.financial`.

### 2.10 Supplier Performance

- **Purpose:** procurement decision support — on-time delivery rate, price trend per supplier, feeds AI.md §3 supplier suggestion logic.
- **Filters:** `supplierId`, date range.
- **Metrics:** order count, average lead time, on-time %, price variance per item over time, open/overdue purchase orders.
- **Permission:** `reports.view.purchasing`.

### 2.11 Store Health Dashboard

- Not a tabular report but the composite dashboard defined in AI.md §7 / UI_UX.md §2.5. Included here for completeness of the KPI registry (§3) since its sub-scores are computed from the same read models as the reports above.

## 3. KPI Definitions Registry

A single source of truth for every metric name used across reports and dashboards, so AI-agent implementers never invent a second definition for the same term.

| KPI                  | Formula                                                                       | Source Read Model                            |
| -------------------- | ----------------------------------------------------------------------------- | -------------------------------------------- |
| Net Sales            | Gross sales − discounts − returns                                             | `orders`, `returns`                          |
| Gross Margin %       | (Revenue − COGS) / Revenue                                                    | `order_lines` (unit_price vs. cost snapshot) |
| Average Basket Size  | Net sales / transaction count                                                 | `orders`                                     |
| Stock Turnover       | COGS (period) / average inventory value (period)                              | `stock_movement_events`, `stock_items`       |
| Reorder Urgency      | quantity_on_hand vs. `reorder_point`, weighted by sales velocity              | `stock_items`, sales history                 |
| Void Rate            | voided line count / total line count, per cashier                             | `order_lines`, `audit_entries`               |
| Return Rate          | returned units / sold units, per cashier or product                           | `returns`, `order_lines`                     |
| Customer Repeat Rate | customers with ≥2 orders in period / total identified customers with ≥1 order | `orders`, `customers`                        |
| On-Time Delivery %   | POs received by expected date / total POs received                            | `purchase_orders`                            |
| Store Health Score   | weighted composite of Sales/Inventory/Financial/Employee/Customer sub-scores  | AI.md §7                                     |

Every KPI formula change is a documentation change to this table in the same PR that changes the code (per the Implementation_Pipeline.md §4 documentation-drift rule).

## 4. Dashboards

- **Owner Dashboard (Desktop, default landing for Owner role):** Net Sales (today/week/month toggle), Store Health gauge, Branch Comparison mini-widget (if multi-branch), pending-approval queue count.
- **Branch Manager Dashboard:** Daily Sales Summary widget, Stock alerts (below reorder point), Employee Performance mini-table, pending approvals for that branch only.
- **Cashier Shift Summary (end-of-shift, POS module):** own transaction count, cash-drawer expected-vs-actual, no cross-cashier or financial data (role-scoped per UI_UX.md §1).
- **Store Health Dashboard:** as specified in UI_UX.md §2.5 and AI.md §7.

## 5. Scheduling & Delivery

- Any report supports `?schedule=` (API.md §4.6) to register a recurring delivery — daily/weekly/monthly cadence, delivered via the channels defined in Notifications.md §2 (email/PDF attachment being the default for scheduled reports).
- Scheduled report generation runs as a backend worker job (`apps/backend/src/workers`), reusing the exact same read-model queries as the on-demand endpoints — no separate "batch-only" report logic, to avoid drift between what a user sees on-demand vs. what arrives by schedule.
- A device that is offline when a scheduled report would generate does not block company-wide delivery if the backend has synced data from other devices; a fully offline single-device business generates scheduled reports locally instead once online delivery is unavailable, queued the same way as other outbound sync traffic (Sync Architecture.md).

## 6. Export & Formats

- **PDF:** printable, branded with company name/logo (from `companies` settings), Arabic-first layout (RTL tables) matching Design System.md typography rules.
- **CSV:** raw tabular data, UTF-8 with BOM (Excel-Arabic compatibility), column headers in the report's active language.
- **JSON:** used internally for the in-app Report Viewer (chart/table toggle, UI_UX.md §2.5) and for any future integration/export API consumer.

## 7. Performance Considerations

- Heavy aggregation reports (Profit & Loss, Branch Comparison) query pre-aggregated daily/monthly rollup tables rather than summing raw order lines on every request — rollups refresh incrementally as new events land (§1).
- Report queries never join across more than the minimum necessary read models; cross-domain reports (e.g., Supplier Performance touching both Purchasing and Inventory) read from a purpose-built denormalized view rather than joining live transactional tables at request time.
- Large exports (CSV of a full year's stock movements) stream rather than buffer fully in memory, to keep the low-end-hardware NFR (Implementation_Pipeline.md Stage 9 performance gate) satisfied on Desktop.

---

_Reports.md — feeds the Report Viewer and Store Health Dashboard in UI_UX.md, and scheduled delivery in Notifications.md._
