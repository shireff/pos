import { z } from 'zod';

/**
 * Validation schemas for authentication and subscription operations.
 * Used by backend API routes for request body validation.
 */

export const LoginSchema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  username: z.string().email('Username must be a valid email'),
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

export const RegisterDeviceSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  deviceType: z.enum(['desktop', 'android']),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
});
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;

export const UpgradeSubscriptionSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  planId: z.enum(['basic', 'pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
});
export type UpgradeSubscriptionInput = z.infer<typeof UpgradeSubscriptionSchema>;

export const PlatformAdminLoginSchema = z.object({
  email: z.string().email('Email must be valid'),
  password: z.string().min(1, 'Password is required'),
});
export type PlatformAdminLoginInput = z.infer<typeof PlatformAdminLoginSchema>;

export const MfaVerifySchema = z.object({
  mfaChallengeToken: z.string().min(1, 'MFA challenge token is required'),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});
export type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;

export const MfaSetupSchema = z.object({
  email: z.string().email('Email must be valid'),
  password: z.string().min(1, 'Password is required'),
});
export type MfaSetupInput = z.infer<typeof MfaSetupSchema>;

export const MfaSetupVerifySchema = z.object({
  setupToken: z.string().min(1, 'MFA setup token is required'),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});
export type MfaSetupVerifyInput = z.infer<typeof MfaSetupVerifySchema>;

export const ChangePlanSchema = z.object({
  planId: z.enum(['basic', 'pro', 'enterprise']),
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ChangePlanInput = z.infer<typeof ChangePlanSchema>;

export const SuspendTenantSchema = z.object({
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type SuspendTenantInput = z.infer<typeof SuspendTenantSchema>;

export const ReactivateTenantSchema = z.object({
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ReactivateTenantInput = z.infer<typeof ReactivateTenantSchema>;

export const ExtendTrialSchema = z.object({
  newTrialEndsAt: z.string().datetime('Must be a valid ISO date'),
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ExtendTrialInput = z.infer<typeof ExtendTrialSchema>;
