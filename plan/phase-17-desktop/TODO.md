# Phase 17 — Backup & Restore TODO

## Core Backup Engine (Wiring Phase 01 scaffold to full production implementation)

- [ ] Wire `BackupScheduler` to company-configurable daily time (default 02:00 local time); configurable via settings
- [ ] Implement incremental backup: capture only documents modified since last backup using updatedAt index
- [ ] Full backup on first run; incremental on subsequent runs
- [ ] Implement backup metadata record: store backup manifest in _backup_manifests collection (timestamp, type, collections, rowCounts, checksum, encryptionKeyId, size)
- [ ] Backup encryption key: derived from separate passphrase (not the live DB key) stored in OS keystore under a different credential name; rotation does not affect live DB key
- [ ] Implement backup retention policy enforcement: after each backup, purge local backups beyond retention count (default 30); purge remote backups beyond retention count (default 90)

## Application — Use Cases

- [ ] `CreateBackupCommand` + handler: trigger full or incremental backup, write to LocalDiskAdapter first then queue for SupabaseStorageAdapter; return backupId
- [ ] `RestoreBackupCommand` + handler: select backup by id or timestamp; verify integrity (checksum); show confirmation dialog; apply restore; emit RestoreCompleted event; prompt app restart
- [ ] `ListBackupsQuery` + handler: union of local and remote backup manifests, sorted by timestamp descending
- [ ] `VerifyBackupIntegrityCommand` + handler: download or read backup file, compute SHA-256, compare to stored checksum; return pass/fail with plain-language message if fail
- [ ] `DeleteBackupCommand` + handler: soft-delete specific backup from local and remote (does not delete files until retention policy runs)

## Backup During Lock

- [ ] Carve-out in SubscriptionWriteLockGuard: CreateBackupCommand and RestoreBackupCommand bypass write-lock check; always allowed even in trial_expired or suspended state

## API Endpoints

- [ ] `POST /v1/backups` — trigger manual backup
- [ ] `GET /v1/backups` — list all backups (local + remote) with status
- [ ] `GET /v1/backups/:id` — backup detail with integrity status
- [ ] `POST /v1/backups/:id/restore` — initiate restore with confirmation
- [ ] `POST /v1/backups/:id/verify` — run integrity check
- [ ] `DELETE /v1/backups/:id` — delete backup

## Validation (Zod)

- [ ] `RestoreBackupSchema`: backupId UUIDv7, confirmText string (must equal "RESTORE" to prevent accidental trigger)

## Desktop UI

- [ ] `BackupRestorePage.tsx` (`apps/desktop/src/features/settings/BackupRestorePage.tsx`): settings page with two sections — Current Backup Settings (schedule time, retention counts) and Backup History
- [ ] `BackupHistoryList.tsx`: table with columns: timestamp, type (full/incremental), source (local/remote), size, integrity indicator (checksum verified/not verified/failed); "Restore" button per row; "Verify" button per row
- [ ] `BackupHealthIndicator.tsx`: compact status showing last backup time and success/failure; red if last backup > 25 hours ago
- [ ] `RestoreConfirmDialog.tsx`: warning message, type "RESTORE" to confirm, selected backup metadata display
- [ ] Manual backup button: prominent "Back Up Now" button; shows progress spinner; shows success/failure toast

## Android UI

- [ ] Same BackupRestorePage using shared components

## Permissions

- [ ] Enforce `backup.view` on GET backup endpoints
- [ ] Enforce `backup.create` on POST /v1/backups
- [ ] Enforce `backup.restore` on restore endpoint
- [ ] Backup available even when account is locked (carve-out)

## Sync

- [ ] Backup manifests are not synced (local to each device); each device maintains its own backup history

## Tests

- [ ] See TESTS.md
