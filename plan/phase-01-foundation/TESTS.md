# Phase 01 — Foundation Tests

## Unit Tests

### shared-kernel/money.test.ts

- Money stores integer piasters, never floats
- Addition: 100 + 200 = 300 piasters
- Subtraction: 500 - 200 = 300 piasters
- Multiplication: 100 * 3 = 300 piasters
- Money.ZERO is 0 piasters
- Negative guard: creating negative Money throws unless explicitly allowed
- Format to EGP string: 10000 piasters → "100.00 EGP"
- Money arithmetic is exact — no floating-point drift

### shared-kernel/hlc.test.ts

- HLC advances on local event (logical counter increments)
- HLC updates to max(local, incoming) + 1 when receiving a remote clock
- Two concurrent HLCs (neither has seen the other) are detected as truly concurrent
- Sequential edits produce causally ordered HLC values
- HLC serializes to string and deserializes without loss

### shared-kernel/result.test.ts

- `Ok(value).map(fn)` applies fn to value
- `Err(error).map(fn)` does not apply fn
- `Ok(value).flatMap(fn)` chains correctly
- `Err(error).getOrThrow()` throws the error
- `Ok(value).getOrThrow()` returns value

### shared-kernel/identifier.test.ts

- UUIDv7 is a valid UUID format
- Two generated IDs are unique
- UUIDv7 IDs are roughly time-sorted (later ID > earlier ID lexicographically)

## Integration Tests

### mongodb/migration-runner.test.ts

- Applying migration `001_initial_schema.ts` on a fresh DB succeeds
- Running the migration runner twice does not error (idempotent)
- Applied migration is recorded in `_migrations` collection
- Rolling back a migration removes the record

### mongodb/encryption.test.ts

- After connecting with field-level encryption, the raw MongoDB BSON file on disk does not contain plaintext field values
- A connection without the correct encryption key fails to read encrypted fields
- Encrypted fields are readable through the repository interface with the correct key

### backup/local-disk.adapter.test.ts

- Writing a backup creates a gzip+encrypted file at the configured path
- Reading back the backup and verifying integrity checksum succeeds
- Corrupting 1 byte of the backup file causes integrity check to fail with a plain-language error message
- Listing snapshots returns entries sorted by timestamp descending

### backup/backup-queue.test.ts

- Queue persists items to MongoDB `_backup_queue` collection (survives app restart)
- When SupabaseStorageAdapter is mocked as offline, items stay in queue
- When connectivity is restored (mock goes online), queue drains automatically
- Queue does not duplicate items on retry

## Architecture Enforcement Tests

### lint/layer-boundary.test (CI gate)

- A file in `packages/domain/catalog/src/` that imports `mongodb` → CI fails
- A file in `packages/application/sales/src/` that imports `react` → CI fails
- A file in `packages/application/identity/src/` that imports `@tauri-apps/api` → CI fails
- A file in `packages/infrastructure/mongodb/src/` that imports `mongodb` → CI passes (infrastructure is allowed)

## E2E Tests

### desktop-boot.e2e.test.ts

- Desktop app launches, health screen renders
- Health screen shows "Local DB: Connected" and "Encryption: Active"
- No console errors on startup

### android-boot.e2e.test.ts

- Android APK installs on emulator, health screen renders
- Health screen shows "Local DB: Connected" and "Encryption: Active"
- No native crash on startup

### backend-health.e2e.test.ts

- `GET /health` returns 200 `{ status: "ok", timestamp, version }`
- Response includes `X-Request-Id` header
