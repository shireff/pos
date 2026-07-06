export type PlatformAdminRole = 'super_admin' | 'support';

export type PlatformAdminActionCode =
  | 'plan_changed'
  | 'override_granted'
  | 'override_revoked'
  | 'account_locked'
  | 'account_unlocked'
  | 'trial_extended'
  | 'admin_login'
  | 'admin_logout'
  | 'admin_login_failed';
