import type { NextRequest } from 'next/server';
import type { Notification } from '@packages/domain-notifications';
import { t } from '../../../../lib/i18n';

export interface SerializedNotification {
  id: string;
  companyId: string;
  recipientUserId: string;
  triggerCode: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  actionUrl: string | null;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

/** Serializes a Notification, re-rendering title/body in the request locale. */
export function serializeNotification(
  n: Notification,
  request: NextRequest,
): SerializedNotification {
  return {
    id: n.id,
    companyId: n.companyId,
    recipientUserId: n.recipientUserId,
    triggerCode: n.triggerCode,
    category: n.category,
    priority: n.priority,
    title: t(n.titleKey, n.vars, request),
    body: t(n.bodyKey, n.vars, request),
    actionUrl: n.actionUrl,
    referenceType: n.referenceType,
    referenceId: n.referenceId,
    isRead: n.isRead,
    isDismissed: n.isDismissed,
    createdAt: n.createdAt.toISOString(),
  };
}
