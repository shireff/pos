# Phase 20 — Final QA & Release Checklist

Every item below must be checked. Release is BLOCKED until ALL items pass on a CLEAN ENVIRONMENT (fresh install, no migration carryover from a prior state).

## E2E Critical Flows (all 10 — on CLEAN environment)

- [ ] E2E Flow #1 PASSES: offline cash sale → stock decremented → receipt issued
- [ ] E2E Flow #2 PASSES: return with approval → inventory restored → loyalty reversed
- [ ] E2E Flow #3 PASSES: trial expiry → offline self-lock → paywall shown
- [ ] E2E Flow #4 PASSES: Platform Admin suspend → tenant lockout → read-only preserved
- [ ] E2E Flow #5 PASSES: offline conflict detected → resolved in UI → both devices converge
- [ ] E2E Flow #6 PASSES: backlog catch-up after extended offline period
- [ ] E2E Flow #7 PASSES: full purchase order lifecycle (draft → received → inventory updated)
- [ ] E2E Flow #8 PASSES: backup created → corrupted → blocked; clean backup → restored
- [ ] E2E Flow #9 PASSES: AI advisory enforcement — AI output cannot trigger write without approval
- [ ] E2E Flow #10 PASSES: hardware fallback — printer offline → digital receipt issued

## Full Permission Matrix Test

- [ ] All 17 system roles × all 90+ permission codes: correct 200/403 for every combination
- [ ] 403 responses include correct permissionCode in all cases

## Sync Conflict Catalog

- [ ] All sync conflict scenarios from Sync Architecture.md verified by simulation harness

## Cross-Cutting Mandatory Tests

- [ ] Property-based stock commutativity test passes
- [ ] Advisory-only AI enforcement test passes
- [ ] Hardware adapter contract tests pass (all 4 adapters)
- [ ] Backup integrity test passes
- [ ] Security audit automated test suite passes

## Localization QA

- [ ] Arabic MSA: all screens reviewed — no English fallback visible to Arabic users
- [ ] RTL layout: all screens render correctly RTL on Desktop and Android
- [ ] Egyptian Arabic AI tone: conversational AI responses reviewed and approved
- [ ] English localization: all strings translated — no Arabic text in English mode
- [ ] RTL/LTR runtime switch: layout reflips correctly without app restart

## Security Audit

- [ ] All items from Security.md automated checklist pass
- [ ] Manual security items documented and reviewed
- [ ] Platform Admin compromise-response drill EXECUTED and documented
- [ ] Drill results recorded in `docs/runbooks/platform-admin-compromise-response.md`

## Deployment Pipeline

- [ ] `.github/workflows/release.yml` runs end-to-end on tag push
- [ ] Windows installer built and signed — test install on clean Windows 10 and Windows 11
- [ ] Windows auto-update verified: update from previous version to new version works
- [ ] Android APK built and signed — tested on physical Android device (API >= 29)
- [ ] Platform Admin deployed to admin-api.<domain> — tenant tokens rejected, HTTPS only

## Performance (All NFRs verified)

- [ ] POS sale < 300ms on low-end hardware profile (NFR-1)
- [ ] All report queries < 200ms on 12-month dataset
- [ ] Sync backlog catch-up (4 weeks) < 60 seconds

## Final Code Quality

- [ ] Zero TypeScript errors across entire monorepo
- [ ] Zero ESLint errors across entire monorepo
- [ ] All DONE.md files for phases 01–19 are filled in

## Release Authorization

- [ ] Founder has reviewed and signed off
- [ ] v1.0.0 tag pushed to repository
- [ ] Commercial launch authorized
