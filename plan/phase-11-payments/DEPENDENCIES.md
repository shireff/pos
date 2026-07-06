# Phase 11 — Discounts, Coupons & Taxes Dependencies

## Incoming

- Phase 01, 02 (Foundation, Auth)
- Phase 03 (Products) — discount rules scope to products and categories
- Phase 07 (Sales) — discounts applied at cart/line level during sale

## Outgoing

- Phase 13 (Reports) — Discount Analysis report, Tax Summary report
- Phase 15 (AI Services) — AI dynamic pricing recommendations use existing price/discount data

## Documents Used

- PRD.md §4.8–4.9 (FR-8.1–8.3, FR-9.1–9.2)
- Database.md §2.14–2.15 (discounts, coupons, campaigns, tax_rules, eta_invoices)
- Business_Rules.md §4 (BR-TAX-001–005), §5 (BR-PRC-001–006)
- State_Machines.md §2 (discount approval in cart context)
- Event_Catalog.md §7 (DiscountRuleCreated, CouponCreated, CampaignLaunched, TaxRuleChanged)
- Configuration_System.md §11 (tax settings), §4 (POS discount threshold)

## Shared Modules Produced

- `packages/domain/promotions` — Discount, Coupon, Campaign aggregates (rule_json driven)
- `packages/domain/tax` — TaxRule entity, ETAInvoice entity
- `packages/application/promotions` — discount evaluation engine
- Discount rule evaluation is a pure function — no side effects, fully testable
