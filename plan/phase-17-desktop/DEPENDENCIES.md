# Phase 17 — Backup & Restore Dependencies

## Incoming

- Phase 01 (Foundation) — backup infrastructure adapters and queue scaffolded
- Phase 12 (Offline Sync) — backup captures the fully-synced data state; sync should be stable first

## Outgoing

- Phase 20 (Final QA) — E2E Critical Flow #10 (restore) must pass in final regression

## Documents Used

- Database.md §9 (Backup Architecture — primary document for this phase)
- Security.md §8 (backup encryption, key independence from live DB key)
- PRD.md §4.15 (FR-15.1–15.2)
- Business_Rules.md §13 (BR-BAK-001 through BR-BAK-005)
- State_Machines.md §12 (Backup Job lifecycle)
- Permission_Matrix.md §17 (backup permissions)
- UI_UX.md §2.6 (Backup & Restore settings screen), §3 (destructive action pattern for restore)
- Error_Catalog.md §10 (BACKUP_INTEGRITY_CHECK_FAILED, RESTORE_REQUIRES_CONFIRMATION)

## Critical Rules

- Backup encryption key is derived INDEPENDENTLY from live DB key (Security.md §8)
- Restore is always a confirmation-required destructive action (never one-click)
- Restore remains available during trial_expired/suspended lock (data-safety carve-out)
- Integrity checksum verified on EVERY restore attempt — corrupted backup is never silently applied
- Supabase Storage is the secondary (cloud) backup location — not a primary database
