/**
 * i18n key namespace for notification titles/bodies.
 * Keys are rendered via the injected translate fn (backend i18n in production,
 * a test dictionary in unit tests) and must exist in every locale dictionary.
 */
export const NOTIFICATION_KEYS = {
  // Billing & Trial
  trialApproaching7: 'notifications.trialApproaching7',
  trialApproaching10: 'notifications.trialApproaching10',
  trialApproaching13: 'notifications.trialApproaching13',
  trialExpired: 'notifications.trialExpired',
  accountSuspended: 'notifications.accountSuspended',
  planChanged: 'notifications.planChanged',
  accountReactivated: 'notifications.accountReactivated',

  // Inventory
  lowStock: 'notifications.lowStock',
  stockout: 'notifications.stockout',
  batchExpired: 'notifications.batchExpired',

  // Approvals
  poApprovalRequest: 'notifications.poApprovalRequest',
  poApproved: 'notifications.poApproved',
  poRejected: 'notifications.poRejected',
  transferPendingApproval: 'notifications.transferPendingApproval',
  transferApproved: 'notifications.transferApproved',
  transferShipped: 'notifications.transferShipped',
  transferReceived: 'notifications.transferReceived',
  transferCancelled: 'notifications.transferCancelled',
  returnApprovalRequest: 'notifications.returnApprovalRequest',
  returnApproved: 'notifications.returnApproved',
  returnRejected: 'notifications.returnRejected',
  discountApprovalRequest: 'notifications.discountApprovalRequest',
  priceChangeApprovalRequest: 'notifications.priceChangeApprovalRequest',

  // Sync
  syncConflict: 'notifications.syncConflict',

  // AI Insights
  aiInsight: 'notifications.aiInsight',
  aiAnomaly: 'notifications.aiAnomaly',
  deadProduct: 'notifications.deadProduct',
  forecastReady: 'notifications.forecastReady',

  // Security
  newDevice: 'notifications.newDevice',
  backupFailure: 'notifications.backupFailure',

  // CRM
  loyaltyTierUpgrade: 'notifications.loyaltyTierUpgrade',
  creditLimitApproaching: 'notifications.creditLimitApproaching',

  // Reports
  reportReady: 'notifications.reportReady',

  // Supplier
  supplierOverduePayment: 'notifications.supplierOverduePayment',

  // Shifts
  shiftOpenReminder: 'notifications.shiftOpenReminder',
  shiftCloseReminder: 'notifications.shiftCloseReminder',

  // Discounts
  largeDiscount: 'notifications.largeDiscount',

  // Digests
  digestHourlyTitle: 'notifications.digest.hourlyTitle',
  digestHourlyBody: 'notifications.digest.hourlyBody',
  digestDailyTitle: 'notifications.digest.dailyTitle',
  digestDailyBody: 'notifications.digest.dailyBody',
  rateLimitSummary: 'notifications.rateLimitSummary',
} as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[keyof typeof NOTIFICATION_KEYS];
