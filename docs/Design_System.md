# Design System.md — Smart Retail OS

**Depends on:** UI_UX.md
**Applies to:** Desktop (Tauri/React) and Android (Capacitor/React) — one shared component library (`packages/ui-components`), two shells.

## 1. Design Principles

- **Speed over decoration.** This is a tool used hundreds of times a day by cashiers under time pressure — clarity and tap/click speed outrank visual flourish.
- **Arabic-first, not Arabic-retrofitted.** RTL is the default layout direction, not a mirrored afterthought; English/LTR is the alternate mode, built with equal care.
- **Calm authority for AI surfaces.** AI insights/recommendations use a visually distinct but non-alarming treatment — confident, not flashy — since these are trust-sensitive surfaces (per the founder's flagged risk of AI losing user trust).

## 2. Color System

Colors are defined as CSS variables (never hardcoded hex in components), enabling theme switching (light/dark) and future white-labeling without touching component code.

| Token                    | Light   | Dark    | Usage                                                                                                                                                    |
| ------------------------ | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-bg-base`        | #FAFAF9 | #14161A | App background                                                                                                                                           |
| `--color-bg-surface`     | #FFFFFF | #1E2126 | Cards, panels                                                                                                                                            |
| `--color-primary`        | #0F7B6C | #2DD4BF | Primary actions, brand accent (deep teal — trustworthy, distinct from the red/blue saturation of most competing POS brands)                              |
| `--color-primary-hover`  | #0C6358 | #14B8A6 | Hover/active state                                                                                                                                       |
| `--color-success`        | #16A34A | #4ADE80 | Positive stock/health states, confirmations                                                                                                              |
| `--color-warning`        | #D97706 | #FBBF24 | Approaching-threshold stock, pending approvals                                                                                                           |
| `--color-danger`         | #DC2626 | #F87171 | Below-threshold stock, destructive actions, fraud alerts                                                                                                 |
| `--color-ai-accent`      | #6366F1 | #818CF8 | AI-generated content surfaces (insights, predictions, chat) — visually distinct from standard UI so AI-origin content is always identifiable at a glance |
| `--color-text-primary`   | #18181B | #F4F4F5 | Primary text                                                                                                                                             |
| `--color-text-secondary` | #52525B | #A1A1AA | Secondary/meta text                                                                                                                                      |
| `--color-border`         | #E4E4E7 | #2E3138 | Dividers, input borders                                                                                                                                  |

Semantic color usage is never overloaded: `--color-danger` always means "needs attention/risk," never used decoratively.

## 3. Typography

- **Arabic:** primary typeface a modern, screen-optimized Arabic font with good numeral support (e.g., an open-source geometric Arabic family such as Noto Kufi Arabic or IBM Plex Sans Arabic — final selection confirmed during implementation, open-source requirement per project cost philosophy).
- **Latin/English:** a matching-weight open-source sans-serif (e.g., Inter) paired to have visually consistent x-height/weight against the Arabic face so mixed Arabic+English screens (e.g., a product name in English inside an Arabic UI) don't look mismatched.
- **Scale:** `--font-size-xs 12px / sm 14px / base 16px / lg 18px / xl 20px / 2xl 24px / 3xl 30px`. Base body text never below 14px anywhere in the cashier-facing flow (readability under real-world lighting/distance conditions at a register).
- **Numerals:** Western numerals (0–9) by default per PRD, rendered in a tabular/monospaced numeral style within tables and price fields so columns of numbers align visually.

## 4. Spacing & Layout Grid

- Base unit: 4px. Scale: 4/8/12/16/24/32/48/64.
- Desktop content max-width per panel: 1440px, with a 12-column grid for dashboard/report layouts.
- Android: single-column by default, 8-column grid unlocked on tablet widths (≥768px) per UI_UX.md §6.
- Minimum touch target 44×44px (Android) / 32×32px (Desktop, mouse-driven).

## 5. Iconography

- One open-source icon set used exclusively (e.g., Lucide, matching the `lucide-react` library available in this environment) — no mixing icon families, ensuring visual consistency and avoiding licensing complexity.
- Icons always paired with text labels in primary navigation and on any state that also conveys meaning via color (per UI_UX.md §6 accessibility rule).

## 6. Core Components

- **Buttons:** Primary (filled, `--color-primary`), Secondary (outlined), Ghost (text-only), Destructive (filled `--color-danger`, always paired with a confirmation dialog per UI_UX.md §3). Consistent height scale: sm 32px / md 40px / lg 48px (lg used for primary POS actions like "Complete Sale" to maximize tap reliability).
- **Cards:** used for dashboard metrics, product tiles, and the Store Health sub-score panels; consistent radius (`--radius-md: 8px`), subtle elevation via shadow token rather than heavy borders in light mode, border-only (no shadow) in dark mode for performance/clarity.
- **Inputs:** consistent label-above pattern (not placeholder-as-label, to remain usable once a value is entered), inline validation message slot always reserved (prevents layout shift when an error appears), RTL-aware icon/affix positioning (e.g., currency symbol position flips with direction).
- **Tables:** sticky header, zebra-striping optional per density setting, right-aligned numeric columns in LTR mode / left-aligned in RTL mode (numerals always read left-to-right internally regardless of row direction), row-level action menu consistently placed at the leading edge of the reading direction.
- **Dialogs/Modals:** standard header (title + close), body, footer (Cancel + primary action, primary action always the reading-direction-trailing button), used for all Create/Edit and confirmation flows per UI_UX.md §3.
- **Badges/Status Pills:** used for order status, sync status, approval status — consistent shape/size regardless of semantic color used.

## 7. Dark Mode

- Full dark theme is a v1 requirement (not deferred), since many shops operate in low-light back-office/evening conditions.
- Dark mode is a token swap only (§2) — no component-level conditional logic — enforced by the "never hardcode color" rule so every new component automatically supports both themes.

## 8. RTL / LTR

- Layout direction is a single root-level `dir` attribute switch; all spacing/positioning in components uses logical CSS properties (`margin-inline-start`, not `margin-left`) so the entire component library flips correctly without per-component RTL overrides.
- Icons that imply direction (e.g., arrows, chevrons) are mirrored automatically via a direction-aware icon wrapper; icons with no directional meaning (e.g., a barcode icon) are never mirrored.
- Mixed-content lines (Arabic UI showing an English product SKU) follow Unicode bidi handling by default; numeral runs and Latin-script product codes are wrapped to guarantee correct visual order regardless of surrounding Arabic text direction.

## 9. Motion

- Minimal, functional motion only: 150–200ms ease-out for dialogs/panels, no decorative animation on the cashier-facing POS screen (motion costs time at the register). AI-surface panels (assistant, insights) may use slightly more expressive transitions (250–300ms) since they're lower-frequency, more deliberate interactions.

---

_Design System.md — the token/component contract every screen in UI_UX.md is built from._
