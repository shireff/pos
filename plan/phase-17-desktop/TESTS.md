# Phase 17 — Backup & Restore Tests

## Unit Tests

- Incremental backup: only changed documents since last snapshot are included
- Backup encryption key is different from live DB encryption key
- Integrity checksum (SHA-256) is computed and stored with every backup
- Corrupted backup file (1 byte changed): integrity check fails with plain-language error
- Cleanup policy: backups older than retention period are deleted; most recent N backups always retained
- Restore from a non-verified backup is blocked (State_Machines.md §12: only verified backups can be restored)

## Integration Tests

### backup/local-disk.integration.test.ts

- Full backup cycle: trigger → backup written to disk → list shows new snapshot → restore from snapshot → state matches original
- Restore from corrupted file: blocked with BACKUP_INTEGRITY_CHECK_FAILED error message
- Two backups: restore selects by timestamp correctly

### backup/supabase-storage.integration.test.ts

- Backup uploaded to Supabase Storage after local backup succeeds
- Download from Supabase Storage → integrity check → restore succeeds
- Supabase unavailable: backup queued locally, uploaded when connectivity restored

### backup/locked-account.integration.test.ts

- Account in trial_expired state: backup trigger command still succeeds (data-safety carve-out — BR-BAK-004)
- Account in suspended state: same — restore still available

### backup/permissions.integration.test.ts

- backup.trigger_manual: Owner → 200; Cashier → 403
- backup.restore: Owner → requires confirmation dialog; Company Administrator without explicit grant → 403
- backup.view_history: Owner, Financial Manager, Auditor → 200; Cashier → 403

## E2E Tests (Critical Flow #10 — MANDATORY)

### e2e/flow-10-restore.e2e.test.ts (Critical Flow #10)

- Complete a backup on Desktop → verify backup in history list
- Simulate device data loss (clear local MongoDB)
- Restore from backup → verify all data restored with zero loss
- Verify synced data also restored correctly after reconnect
- Corrupted backup → restore blocked with user-friendly error message
