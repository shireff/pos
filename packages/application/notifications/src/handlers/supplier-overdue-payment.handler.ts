import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { SupplierOverduePayment } from '@packages/domain-purchasing';

/**
 * Supplier overdue payment (Notifications.md §3). Fires on the nightly
 * supplier-ledger check → High priority alert to owner/accountant.
 */
export class SupplierOverduePaymentHandler
  implements NotificationHandler<SupplierOverduePayment>
{
  public readonly eventType = 'SupplierOverduePayment';

  public async handle(
    event: SupplierOverduePayment,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'SUPPLIER_OVERDUE',
        category: 'GENERAL',
        priority: 'HIGH',
        titleKey: NOTIFICATION_KEYS.supplierOverduePayment,
        bodyKey: NOTIFICATION_KEYS.supplierOverduePayment,
        vars: { supplierId: event.supplierId, days: event.daysOverdue },
        referenceType: 'Supplier',
        referenceId: event.supplierId,
      }),
    ];
  }
}
