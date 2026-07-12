# Phase 20 — Final QA & Release TODO
> ⚠️ **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use `useT()` / `t()` with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use `apps/backend/src/lib/errors.ts` with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.


## Full Regression Suite

- [ ] Run E2E Flow #1 (offline cash sale) on clean Desktop environment — must pass
- [ ] Run E2E Flow #2 (return with approval + loyalty reversal) — must pass
- [ ] Run E2E Flow #3 (trial expiry + offline self-lock) — must pass
- [ ] Run E2E Flow #4 (Platform Admin suspend + tenant lockout) — must pass
- [ ] Run E2E Flow #5 (offline conflict detection + manual resolution) — must pass
- [ ] Run E2E Flow #6 (sync backlog catch-up) — must pass
- [ ] Run E2E Flow #7 (full purchase order lifecycle) — must pass
- [ ] Run E2E Flow #8 (backup and restore) — must pass
- [ ] Run E2E Flow #9 (AI advisory enforcement — AI output cannot trigger write without approval) — must pass
- [ ] Run E2E Flow #10 (hardware fallback — printer offline → digital receipt issued) — must pass
- [ ] Run full permission matrix test (all system roles × all permission codes) — must pass
- [ ] Run full sync conflict scenario catalog via simulation harness — all scenarios must converge correctly
- [ ] Run property-based commutativity test (stock events) — must pass
- [ ] Run advisory-only enforcement test — must pass
- [ ] Run hardware adapter contract tests — must pass
- [ ] Run backup integrity test — must pass

## Localization QA

- [ ] Arabic MSA: review every screen in Arabic with native Arabic speaker or MSA reference; verify all labels, placeholders, error messages, and button text are translated; no English fallback visible to Arabic users
- [ ] Arabic RTL layout: verify all screens render correctly RTL; no layout elements appear mirrored incorrectly; number alignment is correct
- [ ] Egyptian Arabic AI tone: verify AI assistant and AI narrative responses use appropriate Egyptian Arabic tone (not formal MSA for conversational AI)
- [ ] English localization: switch app to English; verify all strings are translated; no Arabic strings leak into English mode
- [ ] RTL/LTR switching: switch language from Arabic to English at runtime; verify layout reflips without requiring app restart
- [ ] Font rendering: verify Arabic fonts render correctly at all sizes; no character-joining artifacts

## Security Audit Checklist

- [ ] JWT signing key separation verified (tenant key ≠ platform-admin key) — automated test
- [ ] Tenant JWT rejected by every /v1/platform-admin/* endpoint — automated test
- [ ] Platform Admin JWT rejected by every /v1/* tenant endpoint — automated test
- [ ] Append-only enforcement on audit_entries and platform_admin_actions — automated test
- [ ] MongoDB field-level encryption active — automated test
- [ ] accessToken never written to persistent storage — automated test
- [ ] Backup encryption key is independent from live DB key — manual verification with key rotation test
- [ ] All permission codes enforced at Application layer — automated matrix test
- [ ] Custom role ceiling enforcement tested — automated test
- [ ] No raw PII in AI context payloads — code review + automated test

## Platform Admin Compromise-Response Drill

- [ ] Execute documented runbook (`docs/runbooks/platform-admin-compromise-response.md`) step by step
- [ ] Verify: all admin sessions can be revoked from a secondary admin account
- [ ] Verify: all tenant accounts can be audited for unauthorized changes via platform_admin_actions log
- [ ] Verify: compromised admin account can be locked within 5 minutes
- [ ] Document results; update runbook if any step fails or is unclear

## Deployment Pipeline

- [ ] Create `.github/workflows/release.yml`: trigger on tag v*._._, run full test suite, build Windows installer, build Android APK, deploy Platform Admin console
- [ ] Windows installer: Tauri NSIS/MSI build; sign with code-signing certificate; test install/uninstall on clean Windows 10 and Windows 11 VMs
- [ ] Windows update: Tauri updater configured; test that update download and apply works from a previous version
- [ ] Android APK: Capacitor build; sign with release keystore; test install on physical Android device (minimum API 29)
- [ ] Platform Admin deployment: `infra/platform-admin/deploy.sh` deploys to admin-api.<domain>; verify tenant API tokens rejected; verify HTTPS only
- [ ] Post-deployment smoke test: run health endpoint check on all deployed services

## Pre-Release Final Checks

- [ ] Zero TypeScript errors across entire monorepo (`tsc --noEmit`)
- [ ] Zero ESLint errors across entire monorepo
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass (flows #1–#10)
- [ ] Bundle size within documented budgets
- [ ] POS sale < 300ms on low-end hardware profile (NFR-1)
- [ ] Backup integrity test on fresh database passes

## Release

- [ ] Tag git commit as `v1.0.0`
- [ ] Push tag to trigger release CI workflow
- [ ] Publish Windows installer to distribution channel
- [ ] Publish Android APK to distribution channel
- [ ] Update public changelog

## Documentation

- [ ] Update root README.md with production deployment instructions
- [ ] Verify all phase DONE.md files are filled in
- [ ] Write post-release runbook for common operational scenarios
