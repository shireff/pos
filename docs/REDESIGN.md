# Smart Retail OS — UI/UX Audit & Redesign (Phase 01: Foundation)

**Scope of this pass:** Full UI audit, delivered redesign plan, a unified
**Design System** in `packages/ui-components`, the **Component Migration Plan**,
and the **incremental screen-by-screen redesign** of every existing screen in
the Android and Desktop shells, including the QR/barcode surface. All UI is now
**100% Arabic, RTL-correct, token-driven, and accessible**.

---

## 1. UI Audit (before)

| Area | Finding |
|------|---------|
| **Architecture** | Three front-ends share `packages/ui-components`, but the shared lib used **100% inline `style={{}}` with hardcoded hex** — the opposite of the documented Design System (`docs/Design_System.md`). |
| **Styling** | Shells had proper token CSS (`tokens.css`/`globals.css`) but the shared components ignored it. Two sources of truth, permanently out of sync. |
| **i18n / RTL** | No i18n library. Strings were scattered bilingual ternaries (`language === 'ar' ? … : …`). Several screens (e.g. Android `ProductListPage`) were **hardcoded English** inside an otherwise Arabic app. |
| **Inconsistencies** | `btn-ghost`/`section-label` used but **undefined** in CSS; hardcoded colors (`#eff6ff`, `#64748b`…) in JS; semantic `<button className="card">`; missing dark/light parity. |
| **Dead code** | Desktop `ProductListPage.tsx` & `CategoryTreePage.tsx` existed but were **never wired** into `App.tsx`. |
| **Accessibility** | No focus management in modals, no `aria` on icon buttons, physical `paddingLeft`/`marginLeft` broke RTL, no visible focus rings in components. |
| **QR / Barcode** | `BarcodeDisplay` rendered a **fake decorative SVG** (not scannable). MFA setup QR was generated server-side but **never displayed** (`setupMfa` thunk never dispatched). |
| **Dashboard** | No dashboard. The "catalog" screen was a flat tab list with ad-hoc stat cards. |

**Root cause:** the "shared" component library was not actually shared — it
re-implemented styling inline, defeating the design system.

---

## 2. Redesign Plan (what we built)

1. **One canonical Design System** in `packages/ui-components/src/styles/`
   (`tokens.css` → `base.css` → `components.css`), imported once by each shell.
2. **Centralized i18n** (`i18n/`) with a default **Arabic** dictionary; no more
   scattered ternaries. Components call `useT()`.
3. **Self-contained icon set** (`components/Icon.tsx`) — Lucide-style inline SVGs,
   direction-aware, zero new dependencies.
4. **Rebuilt every presentational component** on tokens + i18n + RTL logical
   properties (no inline hex).
5. **Rebuilt every screen** (login/MFA, catalog dashboard, products, categories,
   units, subscription, platform admin, mobile home/more, PIN pad).
6. **QR integration:** real EAN-13 barcode encoder (`catalog/barcode.ts`) +
   MFA enrollment QR wired into the login flow.
7. Wrapped both apps in `<LocaleProvider locale="ar">` + `<ToastProvider>`.

---

## 3. Design System (tokens)

All values live in CSS custom properties; **no component hardcodes color**.
Dark mode is a token swap only (`[data-theme='dark']`).

- **Color:** `--color-primary #0f7b6c` (deep teal), semantic `--success/--warning/--danger/--info/--ai-accent` **plus** `--*-soft`/`--*-on` tints for surfaces.
- **Typography:** `--font-family-base` IBM Plex Sans Arabic / Cairo / Inter; scale `xs…4xl`; tabular numerals for tables/prices.
- **Spacing:** 4px base (`--space-1…20`). **Radius, shadow, control heights, touch-target 44px, z-index, motion** all tokenized.
- **RTL:** every component uses **logical properties** (`margin-inline-start`, `inset-inline-end`, `text-align: end` for numerics). Directional icons auto-mirror via `document.dir`.

### Component inventory (now in the system)
Button (primary/secondary/ghost/danger/success × sm/md/lg/block/icon), Card, Badge, Chip, Form Field/Input/Select/Textarea (label-above, reserved error slot), Table (sticky header, zebra, numeric-end, bulk bar), Tabs, Segmented, Modal, Bottom Sheet, Sidebar/NavItem/NavGroup, StatCard, EmptyState, Spinner, Skeleton, Toast (+ provider), StatusBadge, Switch, Tooltip, Search bar, PIN pad, Accordion, Auth shell, Health screen, Paywall.

---

## 4. Component Migration Plan

| Before | After |
|--------|-------|
| Inline hex in `ProductCard`/`VariantBadge`/`UnitSelector`/`BarcodeDisplay` | `components/StatusBadge`, `Icon`, `Badge`/`Chip`, real `BarcodeDisplay` |
| Hardcoded English/Arabic strings | `useT()` from `i18n` (Arabic default) |
| `paddingLeft`/`marginLeft` (breaks RTL) | logical `padding-inline-start` etc. |
| Undefined `btn-ghost`/`section-label` | defined in `components.css` |
| Fake barcode SVG | `encodeBarcode()` → real EAN-13 bits |
| No toast/modal infrastructure | `ToastProvider`/`useToast`, `Modal` |

**Rule going forward:** never hardcode a color or a user-facing string in a
component; use tokens + `t()`. Preserve all business logic, Redux slices, API
contracts, and backend endpoints unchanged.

---

## 5. Screen-by-Screen Redesign

| Screen | Shell | Status | Changes |
|--------|-------|--------|---------|
| Login + MFA | Desktop | ✅ | i18n, design-system form, removed EN toggle, **MFA QR enrollment modal added** |
| Login + MFA + PIN | Android | ✅ | i18n, Icon-based toggles, status card, bottom nav |
| Catalog Dashboard | Desktop | ✅ | New premium dashboard (stat cards, product list, alerts, devices), tab nav, i18n |
| Products | Desktop | ✅ | Split layout, `ProductCard`, `BarcodeDisplay`, variants, stock, archive |
| Categories / Units / System | Desktop | ✅ | i18n, tables, plan cards, device registration |
| Platform Admin | Desktop | ✅ | Removed English parentheticals, Icon logo, i18n actions |
| Product list / detail | Android | ✅ | i18n, `StatusBadge`, `BarcodeDisplay`, `VariantBadge`, search |
| Category tree | Android | ✅ | i18n, Icon chevrons, move/unit picker |
| More (device/PIN/subscription) | Android | ✅ | i18n, status rows, PIN pad |
| Health screen / Paywall | Both | ✅ | token-driven, i18n |

### QR / Barcode integration (verified)
- `BarcodeDisplay` now renders a **scannable EAN-13** barcode from the product
  barcode (pure encoder, no deps) with copy action.
- The server-generated **MFA enrollment QR** (`auth/setupMfa` → `qrCode`) is now
  exposed via a dedicated modal in the platform-admin login, closing the
  previously-hidden QR gap. All business logic / endpoints preserved.

---

## 6. Responsive / Platform Layouts

- **Web (Android Next.js / responsive):** single-column mobile-first; 8-col grid
  unlocks ≥768px; bottom tab bar on phones, content `max-width: 1440px`.
- **Tablet (Android):** same shell, larger touch targets, multi-column grids.
- **Desktop (Vite/Tauri):** dense-but-readable tables, sidebar-ready token
  classes (`--sidebar-width`), keyboard-accessible buttons, sticky headers.
- **Dark mode:** token swap only — every component automatically supports it.

---

## 7. Verification

- `npm run typecheck --workspace=@packages/ui-components` ✅
- `npm run typecheck:desktop` ✅
- `npm run typecheck:android` ✅
- `npm run build:desktop` ✅ (Vite)
- `npm run build:android` ✅ (Next.js static export; added `transpilePackages`)
- ESLint clean on all touched files (project enforces `max-warnings=0`).

## 8. Remaining (future phases)
- Wire the dead desktop `ProductListPage`/`CategoryTreePage` (deprecated
  duplicates of the Android catalog) or remove them.
- Build out the full Sales/Orders/Reports dashboards (data not yet present in
  the catalog-only frontend skeleton) using the new `StatCard`/`Table`/`Modal`.
- Add a persistent Desktop sidebar nav (classes already provided).
- Add Playwright/Cypress e2e for the redesigned flows + a visual snapshot suite.
