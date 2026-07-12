import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { ReorderPointReached } from '@packages/domain-inventory';

/**
 * Low stock alert (Notifications.md §3). Fires on the ReorderPointReached domain
 * event. When the quantity on hand reaches zero it is a Critical stockout, else
 * a High priority low-stock alert. Recipients: Branch Manager + Owner.
 */
export class LowStockAlertHandler implements NotificationHandler<ReorderPointReached> {
  public readonly eventType = 'ReorderPointReached';

  public async handle(
    event: ReorderPointReached,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const isStockout = event.quantityOnHand <= 0;
    const recipients = await ctx.resolve({ kind: 'BRANCH_MANAGER' });
    const owners = await ctx.resolve({ kind: 'OWNER' });
    const recipientUserIds = Array.from(new Set([...recipients, ...owners]));
    if (recipientUserIds.length === 0) return [];

    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds,
        triggerCode: isStockout ? 'STOCKOUT' : 'LOW_STOCK',
        category: 'INVENTORY',
        priority: isStockout ? 'CRITICAL' : 'HIGH',
        titleKey: isStockout ? NOTIFICATION_KEYS.stockout : NOTIFICATION_KEYS.lowStock,
        bodyKey: isStockout ? NOTIFICATION_KEYS.stockout : NOTIFICATION_KEYS.lowStock,
        vars: { productId: event.productId, quantity: event.quantityOnHand },
        referenceType: 'Product',
        referenceId: event.productId,
      }),
    ];
  }
}
