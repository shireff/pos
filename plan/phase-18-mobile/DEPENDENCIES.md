# Phase 18 — Security & Advanced Permissions Dependencies

## Incoming

- Phase 02 (Auth) — extends the RBAC system built there
- Phase 12 (Sync) — custom role changes sync as Class B (security-sensitive, escalates to Owner)
- All prior phases — security audit covers the entire feature set

## Outgoing

- Phase 20 (Final QA) — enterprise scenario walkthrough must pass; security audit checklist must pass

## Documents Used

- Security.md (all sections — especially §4 RBAC, §11 Platform Admin)
- Permission_Matrix.md (all sections — custom roles add to this matrix)
- PRD.md §4.2 (FR-2.2 custom roles), §4.9 (FR-9.2 ETA activation)
- Business_Rules.md §9 (BR-PER-001 through BR-PER-006)
- UI_UX.md §2.6 (Roles & Permissions Builder, Settings screens)
- API.md §8 (Platform Admin advanced console)

## Critical Rules

- Custom role can NEVER exceed the system role ceiling it was derived from
- Custom role can NEVER grant a Platform Administration capability (Architecture.md §3.1)
- Role/permission sync conflict ALWAYS escalates to Owner — never Branch Manager
- ETA module activation is Owner-only (`tax.eta.activate_module` permission)
- No tenant-facing permission code can ever grant Platform Administration capability
