# PROJECT_ROADMAP.md — Smart Retail OS Development Roadmap

**Source:** Development_Plan.md, PRD.md, Vision.md, Implementation_Pipeline.md

---

## 1. Phase Order & Milestones

### Milestone 0 — Skeleton Ready

**Target phases:** 01, 02, 03

- Monorepo scaffolded, lint/CI enforced
- Full database schema migrations running identically on SQLite and PostgreSQL
- Backend server running locally in Docker
- No user-facing feature yet; architecture is proven

---

### Milestone 1 — Single-Device Operational

**Target phases:** 04, 05, 06, 07, 08, 09, 10, 11, 16

- A shop can run an entire day on **one device, fully offline**
- Catalog with variants, units, bundles, barcodes
- Event-sourced inventory with batch/expiry tracking
- Full POS: scan → cart → split payment → receipt (print or digital fallback)
- Returns with approval workflow
- Purchase orders received into stock
- Customers with loyalty points
- Hardware adapters (printer, scanner, drawer, scale) with graceful fallbacks

**This is the earliest point the founder can dogfood the product on a real reference shop.**

---

### Milestone 2 — Multi-Device Sync

**Target phase:** 15

- Two or more devices (Desktop + Android) sync data safely, online and offline
- All conflict scenarios from Sync_Architecture.md §3 verified
- Event-sourced inventory merges correctly across devices
- LAN peer-to-peer sync works; cloud relay fallback works
- Zero data loss demonstrated under simulated crash and offline scenarios

**This is the earliest point the product can be sold to a multi-cashier or multi-branch business.**

---

### Milestone 3 — Business Intelligence Layer

**Target phases:** 12, 13, 14

- Every report from Reports.md renders correctly against real synced data
- Every Notifications.md trigger fires at the correct priority
- All AI features operational with advisory-only enforcement verified
- Store Health Score live; AI Assistant answering questions from local read models

**This is the point the product becomes differentiated — an AI-first retail OS, not just a POS.**

---

### Milestone 4 — Commercial Readiness

**Target phases:** 17, 18, 19 (trial/paywall slice)

- Desktop installer built and signed
- Android APK built and installable
- 14-day trial lifecycle enforced end-to-end (trial → expired → locked → upgrade)
- Minimal Platform Admin console operational (view accounts, change plan, suspend/reactivate)
- Backup and restore working with encryption and integrity checks

**This is the commercial gate — no real paying customer before this milestone.**

---

### Milestone 5 — Enterprise & Compliance Depth

**Target phases:** 19 (full Platform Admin console), plus ETA module, Custom Role Builder, Multi-company

- Custom role/permission builder available to owners
- ETA e-invoicing module (dormant-by-default, activatable per company)
- Full Platform Admin console (multi-admin roles, advanced analytics, bulk operations)
- Multi-company owner cross-visibility

---

### Milestone 6 — Launch Ready

**Target phases:** 20, 21, 22

- Full regression suite passes (all 10 E2E critical flows, full permission matrix, sync conflict catalog)
- Performance: POS sale completion <300ms on low-end hardware baseline (NFR-1)
- Localization QA: Arabic MSA UI + Egyptian Arabic AI tone + English, RTL/LTR complete
- Security audit checklist passed; Platform Admin compromise-response drill executed
- Deployment pipeline finalized: Windows installer, APK signed, admin console deployed on separate subdomain

**The EGP 20,000 MRR clock starts here (Vision.md §3 goal: 6 months post-launch).**

---

## 2. MVP Definition

**Minimum Viable Product** = Milestone 1 + Milestone 2 + Milestone 4 (commercial readiness slice only)

The MVP is the smallest product a single-cashier shop can pay for and use daily without data loss, with their owner able to manage subscription from a Platform Admin console.

**MVP Phase set:** 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 15 → 16 → 17 → 19 (minimal)

---

## 3. Beta Definition

All features usable by multi-branch paying customers, including reports and basic AI:

**Beta Phase set:** MVP + 12 + 13 + 14 + 18

Beta is the point to begin external customer onboarding for paid plans.

---

## 4. Stable Release Definition

All 22 phases complete. Stage 9 final release gate passed on a clean environment. Localization QA done. Security audit done. Installer/APK signed and distributed. Admin console live on `admin-api.<domain>`.

---

## 5. Version Roadmap

| Version    | Milestone | Core Capabilities                                                              |
| ---------- | --------- | ------------------------------------------------------------------------------ |
| v0.1-alpha | M0        | Dev skeleton only — no user-facing feature                                     |
| v0.2-alpha | M1        | Single-device POS/Inventory/Purchasing/CRM working offline                     |
| v0.3-beta  | M2        | Multi-device sync, conflict resolution live                                    |
| v0.5-beta  | M3        | Reports, notifications, AI all wired                                           |
| v0.8-rc    | M4        | Commercial readiness: trial/paywall, Platform Admin minimal, Desktop + Android |
| v0.9-rc    | M5        | Enterprise depth: ETA, custom roles, full Platform Admin                       |
| v1.0       | M6        | Launch-ready: hardened, localized, performance-validated, deployed             |

---

## 6. Post-v1 Roadmap (directional, per Vision.md §8)

- **v1.1:** Dynamic pricing recommendations, product placement optimization, churn prediction
- **v1.2:** Advanced employee analytics, supplier intelligence, ETA e-invoicing full activation
- **v1.3:** Linux/macOS desktop builds, direct payment terminal API integration
- **v2.0:** MENA expansion, multi-currency, SMS/WhatsApp channel activation, voice AI assistant
- **v2.x+:** Computer-vision shelf analysis, autonomous (opt-in) recommendation execution, franchise tooling
