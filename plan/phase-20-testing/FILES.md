# Phase 20 — Final QA & Release Files

## Test Suites (final regression)

```
tests/regression/all-e2e-flows.regression.test.ts
tests/regression/permission-matrix.regression.test.ts
tests/regression/sync-conflict-catalog.regression.test.ts
tests/regression/ai-advisory-only.regression.test.ts
tests/regression/hardware-adapters.regression.test.ts
tests/regression/backup-integrity.regression.test.ts
tests/regression/localization-rtl.regression.test.ts
tests/regression/offline-all-flows.regression.test.ts
```

## Localization QA

```
apps/desktop/src/i18n/ar.json (complete Arabic MSA translation — all keys)
apps/desktop/src/i18n/en.json (complete English translation — all keys)
apps/android/src/i18n/ar.json
apps/android/src/i18n/en.json
tests/localization/missing-keys.test.ts
tests/localization/rtl-layout.test.ts
```

## Deployment Pipeline

```
infra/ci/release.yml (GitHub Actions release workflow)
infra/deploy/windows-installer.config.ts (Tauri bundler config)
infra/deploy/android-signing.config.ts (Capacitor APK signing)
infra/deploy/backend-deploy.sh
infra/deploy/platform-admin-deploy.sh
infra/deploy/supabase-setup.md (Supabase project setup guide)
```

## Security Audit

```
docs/security-audit-checklist.md (filled during this phase)
docs/platform-admin-compromise-response.md (runbook executed and documented)
```

## Release Artifacts

```
CHANGELOG.md
dist/smart-retail-os-v1.0-windows-setup.exe (signed)
dist/smart-retail-os-v1.0.apk (signed)
```
