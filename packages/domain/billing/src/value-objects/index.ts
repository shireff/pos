export type SubscriptionStatus =
  'trialing' | 'active' | 'past_due' | 'locked' | 'canceled' | 'suspended';

export type LockReason =
  'trial_expired' | 'payment_failed' | 'platform_admin_manual' | 'policy_violation';

export type PlanCode = 'basic' | 'pro' | 'enterprise';

export interface PlanFeatureFlags {
  aiAssistant: boolean;
  ocr: boolean;
  fraudDetection: boolean;
  customRoles: boolean | 'partial';
  branchLimit: number | null; // null = unlimited
  userLimit: number | null; // null = unlimited
}
