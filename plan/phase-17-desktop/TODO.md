# Phase 17 — Backup & Restore TODO
> ⚠️ **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use `useT()` / `t()` with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use `apps/backend/src/lib/errors.ts` with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.


## Core Backup Engine (Wiring Phase 01 scaffold to full production implementation)

- [x] Wire `BackupScheduler` to company-configurable daily time (default 02:00 local time); configurable via settings
- [x] Implement incremental backup: capture only documents modified since last backup using updatedAt index
- [x] Full backup on first run; incremental on subsequent runs
- [x] Implement backup metadata record: store backup manifest in _backup_manifests collection (timestamp, type, collections, rowCounts, checksum, encryptionKeyId, size)
- [x] Backup encryption key: derived from separate passphrase (not the live DB key) stored in OS keystore under a different credential name; rotation does not affect live DB key
- [x] Implement backup retention policy enforcement: after each backup, purge local backups beyond retention count (default 30); purge remote backups beyond retention count (default 90)

## Application — Use Cases

- [x] `CreateBackupCommand` + handler: trigger full or incremental backup, write to LocalDiskAdapter first then queue for SupabaseStorageAdapter; return backupId
- [x] `RestoreBackupCommand` + handler: select backup by id or timestamp; verify integrity (checksum); show confirmation dialog; apply restore; emit RestoreCompleted event; prompt app restart
- [x] `ListBackupsQuery` + handler: union of local and remote backup manifests, sorted by timestamp descending
- [x] `VerifyBackupIntegrityCommand` + handler: download or read backup file, compute SHA-256, compare to stored checksum; return pass/fail with plain-language message if fail
- [x] `DeleteBackupCommand` + handler: soft-delete specific backup from local and remote (does not delete files until retention policy runs)

## Backup During Lock

- [x] Carve-out in SubscriptionWriteLockGuard: CreateBackupCommand and RestoreBackupCommand bypass write-lock check; always allowed even in trial_expired or suspended state

## API Endpoints

- [x] `POST /v1/backups` — trigger manual backup
- [x] `GET /v1/backups` — list all backups (local + remote) with status
- [x] `GET /v1/backups/:id` — backup detail with integrity status
- [x] `POST /v1/backups/:id/restore` — initiate restore with confirmation
- [x] `POST /v1/backups/:id/verify` — run integrity check
- [x] `DELETE /v1/backups/:id` — delete backup

## Validation (Zod)

- [x] `RestoreBackupSchema`: backupId UUIDv7, confirmText string (must equal "RESTORE" to prevent accidental trigger)

## Desktop UI

- [x] `BackupRestorePage.tsx` (`apps/desktop/src/features/settings/BackupRestorePage.tsx`): settings page with two sections — Current Backup Settings (schedule time, retention counts) and Backup History
- [x] `BackupHistoryList.tsx`: table with columns: timestamp, type (full/incremental), source (local/remote), size, integrity indicator (checksum verified/not verified/failed); "Restore" button per row; "Verify" button per row
- [x] `BackupHealthIndicator.tsx`: compact status showing last backup time and success/failure; red if last backup > 25 hours ago
- [x] `RestoreConfirmDialog.tsx`: warning message, type "RESTORE" to confirm, selected backup metadata display
- [x] Manual backup button: prominent "Back Up Now" button; shows progress spinner; shows success/failure toast

## Android UI

- [x] Same BackupRestorePage using shared components

## Permissions

- [x] Enforce `backup.view` on GET backup endpoints
- [x] Enforce `backup.create` on POST /v1/backups
- [x] Enforce `backup.restore` on restore endpoint
- [x] Backup available even when account is locked (carve-out)

## Sync

- [x] Backup manifests are not synced (local to each device); each device maintains its own backup history

## Tests

- [x] See TESTS.md

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation