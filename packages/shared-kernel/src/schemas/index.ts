import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
  deviceType: z.enum(['desktop', 'android']),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const LogoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type LogoutInput = z.infer<typeof LogoutSchema>;

// ─── Device Schemas ──────────────────────────────────────────────────────────

export const RegisterDeviceSchema = z.object({
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
  deviceType: z.enum(['desktop', 'android']),
});
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;

export const RevokeDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});
export type RevokeDeviceInput = z.infer<typeof RevokeDeviceSchema>;

// ─── Subscription Schemas ────────────────────────────────────────────────────

export const UpgradeSubscriptionSchema = z.object({
  planId: z.enum(['basic', 'pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
});
export type UpgradeSubscriptionInput = z.infer<typeof UpgradeSubscriptionSchema>;

// ─── Platform Admin Auth Schemas ─────────────────────────────────────────────

export const PlatformAdminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type PlatformAdminLoginInput = z.infer<typeof PlatformAdminLoginSchema>;

export const MfaVerifySchema = z.object({
  mfaChallengeToken: z.string().min(1, 'MFA challenge token is required'),
  code: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
});
export type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;

// ─── Platform Admin Tenant Management Schemas ────────────────────────────────

export const ChangePlanSchema = z.object({
  planId: z.enum(['basic', 'pro', 'enterprise']),
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ChangePlanInput = z.infer<typeof ChangePlanSchema>;

export const SuspendSchema = z.object({
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type SuspendInput = z.infer<typeof SuspendSchema>;

export const ReactivateSchema = z.object({
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ReactivateInput = z.infer<typeof ReactivateSchema>;

export const ExtendTrialSchema = z.object({
  newTrialEndsAt: z.string().datetime('newTrialEndsAt must be a valid ISO date'),
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ExtendTrialInput = z.infer<typeof ExtendTrialSchema>;
