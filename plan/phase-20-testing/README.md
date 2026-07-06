# Phase 20 — Final QA & Release

## Purpose

Full regression suite, localization QA (Arabic MSA, Egyptian Arabic AI tone, English, RTL/LTR layout), security audit checklist execution, Platform Admin compromise-response drill, deployment pipeline finalization, Windows installer signing, Android APK signing, and admin console deployment on a separate subdomain. This phase tags v1.0 and authorizes commercial launch.

## Scope

- **Full Regression**: all 10 E2E critical flows, full permission matrix test, full sync conflict catalog, AI advisory-only enforcement test, hardware adapter contract tests, backup integrity test — all run on a clean environment (fresh install, no migration carryover)
- **Localization QA**: every screen in Arabic MSA (right-to-left, all text translated), Egyptian Arabic AI narrative tone (casual, market-appropriate), English localization, RTL/LTR layout switching verified on both Desktop and Android
- **Security Audit**: all items from Security.md executed as a verification checklist — JWT key separation, tenant/platform-admin realm isolation, append-only collection enforcement, encryption at rest, backup encryption independence, PII handling
- **Compromise-Response Drill**: documented Platform Admin compromise runbook executed step-by-step; results recorded; runbook updated if any step fails
- **Deployment Pipeline**: CI release workflow builds Windows installer (signed with code-signing certificate), Android APK (signed with keystore), pushes Platform Admin console to admin-api.<domain> subdomain
- **Windows Installer**: Tauri NSIS/MSI installer built, signed, and tested on clean Windows machine
- **Android APK**: Capacitor APK built, signed, and tested on physical Android device
- **Update Mechanism**: auto-update channel verified (Desktop checks for updates on launch; Android notifies of new APK)
- **Admin Console Deployment**: Platform Admin app deployed to admin-api.<domain> on separate server; verified that tenant API keys do not work against it

## Expected Output

v1.0 release where:

- All prior phase exit gates pass simultaneously on a clean environment
- All 10 E2E critical flows pass
- All localization variants render correctly
- Security audit checklist is fully checked
- Compromise-response drill is executed and documented
- Windows installer installs, runs, and updates cleanly
- Android APK installs and runs on physical device
- v1.0 tag pushed to repository

## Documents Referenced

- Testing.md §11
- Implementation_Pipeline.md Stage 9
- Security.md §10

## Included Modules

- `.github/workflows/release.yml` (CI release workflow)
- `apps/desktop/src-tauri/tauri.conf.json` (installer config, update endpoint)
- `apps/android/android/app/build.gradle` (signing config — no native UI, signing only)
- `infra/platform-admin/deploy.sh`
- `docs/runbooks/platform-admin-compromise-response.md`
- `locales/ar-MSA/*`
- `locales/en/*`
