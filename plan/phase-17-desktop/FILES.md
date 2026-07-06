# Phase 17 — Backup & Restore Files

## Infrastructure (extends Phase 01 backup scaffold)

```
packages/infrastructure/backup/src/incremental-backup.ts
packages/infrastructure/backup/src/backup-manifest.ts
packages/infrastructure/backup/src/restore-manager.ts
packages/infrastructure/backup/src/restore-manager.test.ts
packages/infrastructure/backup/src/integrity-checker.ts
packages/infrastructure/backup/src/integrity-checker.test.ts
packages/infrastructure/backup/src/cleanup-policy.ts
packages/infrastructure/backup/src/backup-health-monitor.ts
```

## Application Use Cases

```
packages/application/billing/src/trigger-backup/trigger-backup.command.ts
packages/application/billing/src/trigger-backup/trigger-backup.handler.ts
packages/application/billing/src/restore-backup/restore-backup.command.ts
packages/application/billing/src/restore-backup/restore-backup.handler.ts
packages/application/billing/src/restore-backup/restore-backup.handler.test.ts
packages/application/billing/src/get-backup-history/get-backup-history.query.ts
packages/application/billing/src/get-backup-history/get-backup-history.handler.ts
```

## UI Components

```
packages/ui-components/src/backup/BackupHistoryList.tsx
packages/ui-components/src/backup/BackupHistoryList.test.tsx
packages/ui-components/src/backup/RestoreConfirmDialog.tsx
packages/ui-components/src/backup/RestoreConfirmDialog.test.tsx
packages/ui-components/src/backup/BackupHealthIndicator.tsx
packages/ui-components/src/backup/BackupProgressBanner.tsx
```

## Desktop & Android Features

```
apps/desktop/src/features/settings/BackupRestorePage.tsx
apps/android/src/features/settings/BackupRestorePage.tsx
```
