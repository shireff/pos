export type NotificationCategory =
  | 'INVENTORY'
  | 'APPROVALS'
  | 'SYNC'
  | 'AI_INSIGHTS'
  | 'BILLING_TRIAL'
  | 'REPORTS'
  | 'SECURITY'
  | 'GENERAL';

export type NotificationPriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL';

export type NotificationFrequency = 'IMMEDIATE' | 'HOURLY_DIGEST' | 'DAILY_DIGEST';
