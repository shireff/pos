# Phase 02 — Authentication & Licensing Tests

## Unit Tests

- LoginHandler: valid credentials → returns tokens; invalid credentials → returns UNAUTHENTICATED
- LoginHandler: refresh token is hashed before storage, never stored plaintext
- RefreshTokenHandler: replayed refresh token is rejected with REFRESH_TOKEN_REUSE_DETECTED
- OfflinePinLoginHandler: valid PIN → session; invalid PIN → UNAUTHENTICATED; no prior login → OFFLINE_AUTH_NO_PRIOR_LOGIN
- EntitlementResolver: override active → Enterprise; trialing + days remaining → Enterprise; active plan → plan flags; past_due within grace → plan flags; expired/locked/suspended → fully locked
- SubscriptionWriteLockGuard: trial_expired → rejects write commands; suspended → rejects write commands; active → passes write commands; read-only operations always pass
- PlatformAdminMfaVerifyHandler: correct TOTP → adminAccessToken; wrong TOTP → reject; 5 failures → account locked

## Integration Tests

- Full login flow: POST /v1/auth/login → 200 with tokens; re-use same refresh token twice → second use returns 401
- Device registration: POST /v1/devices/register → device bound; Owner notification triggered
- Permission enforcement matrix: for every system role × every permissionCode, assert correct 200/403; 403 always includes permissionCode in response body
- Subscription lifecycle: company created → status=trialing; advance clock past trialEndsAt → status=trial_expired; POST /v1/subscription/upgrade (non-Owner) → 403 SUBSCRIPTION_UPGRADE_NOT_OWNER; POST /v1/subscription/upgrade (Owner) → status=active
- Platform Admin realm separation: use tenant accessToken against /v1/platform-admin/accounts → 401 PLATFORM_ADMIN_TOKEN_REJECTED; use adminAccessToken against /v1/auth/login → 401
- Platform Admin MFA lockout: 5 failed MFA attempts → account locked 15 minutes; unlock requires another admin

## E2E Tests

- User opens Desktop app → Login screen renders in Arabic RTL → enters credentials → lands on dashboard
- User goes offline → re-opens app → PIN screen shown → enters PIN → accesses POS offline
- Clock advanced past trial end while offline → next app open shows Paywall (trial_expired variant)
- Platform Admin logs in → MFA challenge → enter TOTP → lands on accounts list
- Platform Admin suspends tenant → tenant's next API call returns 403 ACCOUNT_SUSPENDED with contactSupportUrl

## Security Tests

- accessToken is never written to localStorage or any persistent storage (memory only)
- Platform Admin JWT signing key is different from tenant JWT signing key
- aud claim "platform-admin" is verified before any platform-admin endpoint is processed
- audit_entries collection rejects UPDATE/DELETE operations at repository layer
- platform_admin_actions collection rejects UPDATE/DELETE operations at repository layer
