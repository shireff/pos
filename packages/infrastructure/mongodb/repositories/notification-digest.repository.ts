import { getMongoDb } from '../src/mongo-connection';
import type { DigestRepositoryPort, NotificationDigestRecord } from '@packages/application-notifications';

function toDoc(d: NotificationDigestRecord): Record<string, unknown> {
  return {
    _id: d.id,
    company_id: d.companyId,
    recipient_user_id: d.recipientUserId,
    frequency: d.frequency,
    category_counts: d.categoryCounts,
    notification_ids: d.notificationIds,
    title_key: d.titleKey,
    body_key: d.bodyKey,
    vars: d.vars,
    action_url: d.actionUrl,
    is_read: d.isRead,
    period_start: d.periodStart,
    period_end: d.periodEnd,
    created_at: d.createdAt,
  };
}

export class MongoDigestRepository implements DigestRepositoryPort {
  async save(digest: NotificationDigestRecord): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>('notification_digests').updateOne({ _id: digest.id }, { $set: toDoc(digest) }, { upsert: true });
  }

  async findLatest(
    companyId: string,
    recipientUserId: string,
    frequency: 'HOURLY' | 'DAILY',
  ): Promise<NotificationDigestRecord | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection('notification_digests')
      .find({ company_id: companyId, recipient_user_id: recipientUserId, frequency })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    if (doc.length === 0) return null;
    const d = doc[0] as Record<string, unknown>;
    return {
      id: String(d._id),
      companyId: String(d.company_id),
      recipientUserId: String(d.recipient_user_id),
      frequency: d.frequency as 'HOURLY' | 'DAILY',
      categoryCounts: (d.category_counts as Record<string, number>) ?? {},
      notificationIds: (d.notification_ids as string[]) ?? [],
      titleKey: String(d.title_key),
      bodyKey: String(d.body_key),
      vars: (d.vars as Record<string, string | number>) ?? {},
      actionUrl: d.action_url ? String(d.action_url) : undefined,
      isRead: Boolean(d.is_read),
      periodStart: d.period_start as Date,
      periodEnd: d.period_end as Date,
      createdAt: d.created_at as Date,
    };
  }
}
