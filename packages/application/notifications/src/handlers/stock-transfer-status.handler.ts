import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import {
  StockTransferRequested,
  StockTransferApproved,
  StockTransferShipped,
  StockTransferReceived,
  StockTransferCancelled,
} from '@packages/domain-inventory';

export class TransferPendingApprovalHandler
  implements NotificationHandler<StockTransferRequested>
{
  public readonly eventType = 'StockTransferRequested';

  public async handle(
    event: StockTransferRequested,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const approvers = await ctx.resolve({ kind: 'APPROVER', branchId: event.toWarehouseId });
    if (approvers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: approvers,
        triggerCode: 'TRANSFER_PENDING_APPROVAL',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.transferPendingApproval,
        bodyKey: NOTIFICATION_KEYS.transferPendingApproval,
        actionUrl: `/stock/transfers/${event.aggregateId}`,
        referenceType: 'StockTransfer',
        referenceId: event.aggregateId,
      }),
    ];
  }
}

export class TransferApprovedHandler implements NotificationHandler<StockTransferApproved> {
  public readonly eventType = 'StockTransferApproved';

  public async handle(
    event: StockTransferApproved,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const managers = await ctx.resolve({ kind: 'BRANCH_MANAGER' });
    if (managers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: managers,
        triggerCode: 'TRANSFER_APPROVED',
        category: 'APPROVALS',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.transferApproved,
        bodyKey: NOTIFICATION_KEYS.transferApproved,
        referenceType: 'StockTransfer',
        referenceId: event.aggregateId,
      }),
    ];
  }
}

export class TransferShippedHandler implements NotificationHandler<StockTransferShipped> {
  public readonly eventType = 'StockTransferShipped';

  public async handle(
    event: StockTransferShipped,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const managers = await ctx.resolve({ kind: 'BRANCH_MANAGER' });
    if (managers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: managers,
        triggerCode: 'TRANSFER_SHIPPED',
        category: 'INVENTORY',
        priority: 'MEDIUM',
        titleKey: NOTIFICATION_KEYS.transferShipped,
        bodyKey: NOTIFICATION_KEYS.transferShipped,
        referenceType: 'StockTransfer',
        referenceId: event.aggregateId,
      }),
    ];
  }
}

export class TransferReceivedHandler implements NotificationHandler<StockTransferReceived> {
  public readonly eventType = 'StockTransferReceived';

  public async handle(
    event: StockTransferReceived,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const managers = await ctx.resolve({ kind: 'BRANCH_MANAGER' });
    if (managers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: managers,
        triggerCode: 'TRANSFER_RECEIVED',
        category: 'INVENTORY',
        priority: 'MEDIUM',
        titleKey: NOTIFICATION_KEYS.transferReceived,
        bodyKey: NOTIFICATION_KEYS.transferReceived,
        referenceType: 'StockTransfer',
        referenceId: event.aggregateId,
      }),
    ];
  }
}

export class TransferCancelledHandler implements NotificationHandler<StockTransferCancelled> {
  public readonly eventType = 'StockTransferCancelled';

  public async handle(
    event: StockTransferCancelled,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const managers = await ctx.resolve({ kind: 'BRANCH_MANAGER' });
    if (managers.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: managers,
        triggerCode: 'TRANSFER_CANCELLED',
        category: 'INVENTORY',
        priority: 'MEDIUM',
        titleKey: NOTIFICATION_KEYS.transferCancelled,
        bodyKey: NOTIFICATION_KEYS.transferCancelled,
        referenceType: 'StockTransfer',
        referenceId: event.aggregateId,
      }),
    ];
  }
}
