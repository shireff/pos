# Phase 17 — Backup & Restore

## Purpose

Full backup lifecycle — incremental encrypted compressed backups to local disk (primary) and Supabase Storage (secondary), offline queue, version history, point-in-time restore, integrity verification, scheduled daily backup, manual backup, and backup health monitoring UI. Backup must remain available even when the account is in trial_expired or suspended state (data-safety carve-out — users must always be able to export their data).

## Scope

- **Backup Process**: incremental snapshot of all MongoDB collections, gzip-compressed, AES-256 encrypted with a key derived independently from the live DB encryption key (per Security.md §8 — different keys so that a DB key compromise does not expose backups), SHA-256 integrity checksum
- **Local Disk Adapter**: writes to configurable local path, lists snapshots by timestamp, reads back for restore — already scaffolded in Phase 01, now fully wired to UI and scheduler
- **Supabase Storage Adapter**: uploads encrypted backup file, downloads for restore, lists remote snapshots — queues when offline, drains on reconnect
- **Offline Queue**: durable queue in MongoDB _backup_queue collection — survives app restart, auto-drains on connectivity restore
- **Scheduler**: daily automatic backup at configurable time; manual backup on demand via UI button
- **Version History**: UI shows list of backups with timestamp, size, source (local/remote), and integrity status
- **Restore Flow**: user selects backup by timestamp → integrity check → confirmation dialog → restore applied to local MongoDB → app restart prompt
- **Integrity Verification**: SHA-256 checksum verified before restore; corrupted backup blocked with plain-language error message
- **Retention Policy**: configurable retention count (default: keep last 30 local, last 90 remote); auto-cleanup of older snapshots
- **Encryption Key Independence**: backup encryption key is stored separately from live DB key; key rotation for backups does not affect live DB
- **Backup During Lock**: account in trial_expired or suspended state can still trigger manual backup and access backup history

## Expected Output

A working backup system where:

- Daily automatic backup fires at configured time
- Manual backup completes and appears in history within seconds
- Restore from a valid backup reproduces full system state with zero data loss
- Corrupted backup is rejected before restore with a user-friendly message
- Backup is accessible during trial_expired and suspended account states

## Documents Referenced

- Database.md §9
- Security.md §8
- PRD.md §4.15
- Business_Rules.md §13

## Included Modules

- `packages/infrastructure/backup/*` (fully wired — scaffolded in Phase 01)
- `packages/infrastructure/mongodb/migrations/017_backup_queue_schema.ts`
- `packages/application/backup/src/create-backup.command.ts`
- `packages/application/backup/src/restore-backup.command.ts`
- `packages/application/backup/src/list-backups.query.ts`
- `packages/application/backup/src/verify-backup-integrity.command.ts`
- `apps/backend/src/http/backups/*`
- `packages/ui-components/src/backup/BackupHistoryList.tsx`
- `packages/ui-components/src/backup/BackupHealthIndicator.tsx`
- `packages/ui-components/src/backup/RestoreConfirmDialog.tsx`
- `apps/desktop/src/features/settings/BackupRestorePage.tsx`
- `apps/android/src/features/settings/BackupRestorePage.tsx`
