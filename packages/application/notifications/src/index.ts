export * from './ports';
export * from './priority-gate';
export * from './rate-limiter';
export * from './digest-batcher';
export * from './notification-keys';
export * from './preferences';
export * from './dispatcher';

// Handlers
export * from './handlers/base';
export * from './handlers/trial-approaching.handler';
export * from './handlers/trial-expired.handler';
export * from './handlers/account-suspended.handler';
export * from './handlers/low-stock-alert.handler';
export * from './handlers/stock-transfer-status.handler';
export * from './handlers/po-approval-request.handler';
export * from './handlers/po-approved-rejected.handler';
export * from './handlers/return-approval-request.handler';
export * from './handlers/return-approved-rejected.handler';
export * from './handlers/shift-reminder.handler';
export * from './handlers/large-discount-applied.handler';
export * from './handlers/backup-failure.handler';
export * from './handlers/new-device-registered.handler';
export * from './handlers/discount-approval-request.handler';
export * from './handlers/credit-limit-approaching.handler';
export * from './handlers/supplier-overdue-payment.handler';
export * from './handlers/loyalty-tier-upgrade.handler';
export * from './handlers/price-change-approval.handler';
export * from './handlers/ai-insight-available.handler';
export * from './handlers/sync-conflict.handler';

// Scheduled jobs
export * from './scheduled-jobs/hourly-digest.job';
export * from './scheduled-jobs/daily-digest.job';
export * from './scheduled-jobs/supplier-overdue-check.job';
export * from './scheduled-jobs/trial-countdown.job';

import type { NotificationHandler } from './ports';
import {
  TrialApproachingHandler,
  TrialExpiredHandler,
  AccountSuspendedHandler,
  AccountReactivatedHandler,
  PlanChangedHandler,
  LowStockAlertHandler,
  TransferPendingApprovalHandler,
  TransferApprovedHandler,
  TransferShippedHandler,
  TransferReceivedHandler,
  TransferCancelledHandler,
  PurchaseOrderApprovalRequestHandler,
  PurchaseOrderApprovedHandler,
  PurchaseOrderRejectedHandler,
  ReturnApprovalRequestHandler,
  ReturnApprovedHandler,
  ReturnRejectedHandler,
  ShiftOpenReminderHandler,
  ShiftCloseReminderHandler,
  LargeDiscountAppliedHandler,
  BackupFailureHandler,
  NewDeviceRegisteredHandler,
  DiscountApprovalRequestHandler,
  CreditLimitApproachingHandler,
  SupplierOverduePaymentHandler,
  LoyaltyTierUpgradeHandler,
  PriceChangeApprovalRequestHandler,
  AiInsightAvailableHandler,
  AiAnomalyHandler,
  SyncConflictHandler,
} from './handlers';

/**
 * Returns every notification trigger handler registered in the system. The
 * dispatcher subscribes to each handler's event type on the EventBus.
 */
export function getAllHandlers(clock?: { now(): Date }): NotificationHandler[] {
  return [
    new TrialApproachingHandler(clock),
    new TrialExpiredHandler(),
    new AccountSuspendedHandler(),
    new AccountReactivatedHandler(),
    new PlanChangedHandler(),
    new LowStockAlertHandler(),
    new TransferPendingApprovalHandler(),
    new TransferApprovedHandler(),
    new TransferShippedHandler(),
    new TransferReceivedHandler(),
    new TransferCancelledHandler(),
    new PurchaseOrderApprovalRequestHandler(),
    new PurchaseOrderApprovedHandler(),
    new PurchaseOrderRejectedHandler(),
    new ReturnApprovalRequestHandler(),
    new ReturnApprovedHandler(),
    new ReturnRejectedHandler(),
    new ShiftOpenReminderHandler(),
    new ShiftCloseReminderHandler(),
    new LargeDiscountAppliedHandler(),
    new BackupFailureHandler(),
    new NewDeviceRegisteredHandler(),
    new DiscountApprovalRequestHandler(),
    new CreditLimitApproachingHandler(),
    new SupplierOverduePaymentHandler(),
    new LoyaltyTierUpgradeHandler(),
    new PriceChangeApprovalRequestHandler(),
    new AiInsightAvailableHandler(),
    new AiAnomalyHandler(),
    new SyncConflictHandler(),
  ];
}
