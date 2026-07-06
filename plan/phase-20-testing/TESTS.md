# Phase 20 — Final QA & Release Tests

## Full Regression Suite (all must pass simultaneously on clean environment)

### All 10 E2E Critical Flows

- Flow #1: Cash sale fully offline — passes
- Flow #2: Return with approval workflow — passes
- Flow #3: Stock transfer between warehouses — passes
- Flow #4: Purchase Order → OCR review → confirm → stock increases — passes
- Flow #5: Offline conflict detection and resolution — passes
- Flow #6: Sync backlog catch-up after weeks offline — passes
- Flow #7: Store Health Dashboard with multi-branch synced data — passes
- Flow #8: AI Assistant from local read model (no raw DB dump) — passes
- Flow #9: AI recommendation requires explicit owner approval — passes
- Flow #10: Fresh-device restore with zero data loss — passes

### Full Permission Matrix

- Every system role × every permission code: correct 200/403 behavior
- 403 always includes permissionCode (never generic)
- Owner cross-branch short-circuit works correctly
- Platform Admin realm separation: tenant JWT rejected by admin endpoints and vice versa

### Full Sync Conflict Catalog

- All scenarios from Sync_Architecture.md §3 verified with multi-device harness
- Class A: stock events from any number of devices converge to correct projection
- Class B: concurrent same-field edit → conflict queued, never silently resolved
- Role/permission conflict → escalates to Owner

### AI Advisory-Only Enforcement

- No AI recommendation can apply without explicit owner approval (final verification at domain/command layer)

### Hardware Adapter Contract Tests (all peripherals)

- All failure scenarios produce graceful fallbacks

### Backup Integrity Test

- Backup → corrupt → restore blocked; clean backup → restore succeeds

## Localization QA (manual + automated)

- Arabic MSA UI: every screen checked — all strings translated, no English leakage
- RTL layout: every screen, every component — no LTR-specific layout bugs
- Egyptian Arabic AI tone: AI Assistant responses reviewed for tone consistency
- English LTR mode: every screen functional with English locale

## Security Audit Checklist

- No secrets committed to repository
- Dependency vulnerabilities checked (npm audit clean)
- SQLite/Electron never referenced anywhere
- No Kotlin/Java UI code in Android
- MongoDB encryption verified active (plaintext file check)
- Platform Admin compromise-response drill executed and documented
- Audit immutability verified (UPDATE/DELETE rejected at DB layer)
- accessToken never persisted to disk

## Performance Regression

- POS sale <300ms on low-end hardware baseline still holds after all changes
- No new bundle size regressions introduced

## Release Checklist

- Windows installer signed with valid code signing certificate
- Android APK signed with release keystore
- admin-api.<domain> deployed and health endpoint responds
- apps/platform-admin deployed and MFA login works
- Update mechanism tested (new version installs over old version)
- CHANGELOG.md complete and accurate
- Version v1.0 tagged in git
