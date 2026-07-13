# Phase 17 — Backup & Restore Checklist

A phase is **NOT complete** until every item below is checked.

## Backup Creation

- [x] Daily automatic backup fires at configured time
- [x] Manual backup button creates backup within 30 seconds
- [x] Backup encryption key is independent from live DB key (different credential name in OS keystore)
- [x] Backup file is gzip-compressed and AES-256 encrypted
- [x] SHA-256 checksum included in every backup manifest

## **Fresh-Device Restore — MANDATORY EXIT GATE**

- [ ] Fresh install of the app, import backup from disk, restore completes — ALL collections present with correct data, zero data loss verified

## Corrupted Backup Guard

- [x] Backup with tampered checksum blocked from restore with plain-language error message
- [x] Backup with corrupted encryption rejected with plain-language error message
- [x] No raw exception or stack trace shown to user on integrity failure

## Availability During Lock

- [x] Backup can be triggered when account status is trial_expired
- [x] Backup can be triggered when account status is suspended
- [x] Backup history is accessible in both lock states
- [x] SubscriptionWriteLockGuard carve-out is present and tested

## Retention Policy

- [ ] Local backups beyond retention count (default 30) are automatically purged
- [ ] Remote backups beyond retention count (default 90) are automatically purged

## UI

- [ ] BackupRestorePage shows both settings and backup history
- [ ] BackupHistoryList shows timestamp, type, source, size, integrity indicator
- [ ] BackupHealthIndicator turns red when last backup > 25 hours ago
- [ ] RestoreConfirmDialog requires typing "RESTORE" before confirming

## Supabase Storage Queue

- [ ] Backup queued correctly when Supabase Storage unreachable
- [ ] Queue drains automatically when connectivity restored

## Tests

- [ ] Backup → corrupt file → restore fails with plain-language error test passes
- [ ] Backup → restore succeeds with full data integrity test passes
- [ ] Queue offline-and-drain test passes
- [ ] Backup during lock test passes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
