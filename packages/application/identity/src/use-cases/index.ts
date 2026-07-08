// Re-exports all identity use cases for barrel imports.
// Each use case lives in its own folder under packages/application/identity/src/<use-case>/
// These folders are created in Phase 02 (Authentication & Licensing).
export { AuthenticateUser } from './authenticate-user';
export type { AuthenticateUserInput, AuthenticateUserOutput } from './authenticate-user';
export { RegisterDevice } from './register-device';
export type { RegisterDeviceInput, RegisterDeviceOutput } from './register-device';
export { StartTrial } from './start-trial';
export type { StartTrialInput, StartTrialOutput } from './start-trial';
export { RevokeDevice } from './revoke-device';
export type { RevokeDeviceInput, RevokeDeviceOutput } from './revoke-device';
export { RefreshToken } from './refresh-token';
export type { RefreshTokenInput, RefreshTokenOutput } from './refresh-token';
export { Logout } from './logout';
export type { LogoutInput, LogoutOutput } from './logout';
export { PlatformAdminLogin } from './platform-admin-login';
export type { PlatformAdminLoginInput, PlatformAdminLoginOutput } from './platform-admin-login';
export { PlatformAdminMfaVerify } from './platform-admin-mfa-verify';
export type {
  PlatformAdminMfaVerifyInput,
  PlatformAdminMfaVerifyOutput,
} from './platform-admin-mfa-verify';
export { ChangeTenantPlan } from './platform-admin-change-plan';
export type { ChangeTenantPlanInput, ChangeTenantPlanOutput } from './platform-admin-change-plan';
export { SuspendTenant } from './platform-admin-suspend-tenant';
export type { SuspendTenantInput, SuspendTenantOutput } from './platform-admin-suspend-tenant';
export { ReactivateTenant } from './platform-admin-reactivate-tenant';
export type {
  ReactivateTenantInput,
  ReactivateTenantOutput,
} from './platform-admin-reactivate-tenant';
export { ExtendTrial } from './platform-admin-extend-trial';
export type { ExtendTrialInput, ExtendTrialOutput } from './platform-admin-extend-trial';
export { OfflinePinLogin, SetOfflinePin } from './offline-pin-login';
export type {
  OfflinePinLoginInput,
  OfflinePinLoginOutput,
  SetOfflinePinInput,
  SetOfflinePinOutput,
} from './offline-pin-login';
export type {
  UserRepository,
  RoleRepository,
  DeviceRepository,
  PermissionCodeRepository,
  PasswordHasher,
  TokenIssuer,
  RefreshTokenRepository,
  RefreshTokenRecord,
} from '../ports';
