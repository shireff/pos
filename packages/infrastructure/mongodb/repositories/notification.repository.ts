import { Notification } from '@packages/domain-notifications';
import { getMongoDb } from '../src/mongo-connection';
import type {
  NotificationPriorityLevel,
  NotificationQuery,
  NotificationRepositoryPort,
} from '@packages/application-notifications';

function toDoc(n: Notification): Record<string, unknown> {
  return {
    _id: n.id,
    company_id: n.companyId,
    recipient_user_id: n.recipientUserId,
    trigger_code: n.triggerCode,
    category: n.category,
    priority: n.priority,
    title_key: n.titleKey,
    body_key: n.bodyKey,
    title: n.title,
    body: n.body,
    vars: n.vars,
    action_url: n.actionUrl,
    reference_type: n.referenceType,
    reference_id: n.referenceId,
    is_read: n.isRead,
    is_dismissed: n.isDismissed,
    is_digested: false,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
}

function fromDoc(doc: Record<string, unknown>): Notification {
  return Notification.reconstitute({
    id: String(doc._id),
    companyId: String(doc.company_id),
    recipientUserId: String(doc.recipient_user_id),
    triggerCode: String(doc.trigger_code),
    category: doc.category as Notification['category'],
    priority: doc.priority as NotificationPriorityLevel,
    titleKey: String(doc.title_key),
    bodyKey: String(doc.body_key),
    title: String(doc.title),
    body: String(doc.body),
    vars: (doc.vars as Record<string, string | number>) ?? {},
    actionUrl: doc.action_url ? String(doc.action_url) : null,
    referenceType: doc.reference_type ? String(doc.reference_type) : null,
    referenceId: doc.reference_id ? String(doc.reference_id) : null,
    isRead: Boolean(doc.is_read),
    isDismissed: Boolean(doc.is_dismissed),
    createdAt: doc.created_at instanceof Date ? doc.created_at : new Date(doc.created_at as string),
    updatedAt: doc.updated_at instanceof Date ? doc.updated_at : new Date(doc.updated_at as string),
  });
}

export class MongoNotificationRepository implements NotificationRepositoryPort {
  async save(notification: Notification): Promise<void> {
    const db = await getMongoDb();
    await db
      .collection<any>('notifications')
      .updateOne({ _id: notification.id }, { $set: toDoc(notification) }, { upsert: true });
  }

  async findById(id: string): Promise<Notification | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('notifications').findOne({ _id: id });
    return doc ? fromDoc(doc as Record<string, unknown>) : null;
  }

  async findByQuery(query: NotificationQuery): Promise<Notification[]> {
    const db = await getMongoDb();
    const filter: Record<string, unknown> = {
      company_id: query.companyId,
      recipient_user_id: query.recipientUserId,
    };
    if (query.isRead !== undefined) filter.is_read = query.isRead;
    if (query.category) filter.category = query.category;

    const limit = query.limit ?? 50;
    const cursor = db
      .collection<any>('notifications')
      .find(filter)
      // Unread-first, then newest-first.
      .sort({ is_read: 1, created_at: -1 })
      .limit(limit);
    if (query.cursor) cursor.min({ _id: query.cursor });
    const docs = await cursor.toArray();
    return docs.map((d) => fromDoc(d as Record<string, unknown>));
  }

  async countUnread(companyId: string, recipientUserId: string): Promise<number> {
    const db = await getMongoDb();
    return db.collection<any>('notifications').countDocuments({
      company_id: companyId,
      recipient_user_id: recipientUserId,
      is_read: false,
    });
  }

  async markRead(id: string): Promise<void> {
    const db = await getMongoDb();
    await db
      .collection<any>('notifications')
      .updateOne({ _id: id }, { $set: { is_read: true, updated_at: new Date() } });
  }

  async markAllRead(companyId: string, recipientUserId: string): Promise<void> {
    const db = await getMongoDb();
    await db
      .collection<any>('notifications')
      .updateMany(
        { company_id: companyId, recipient_user_id: recipientUserId, is_read: false },
        { $set: { is_read: true, updated_at: new Date() } },
      );
  }

  async findPendingDigest(
    companyId: string,
    recipientUserId: string,
    priority: NotificationPriorityLevel,
    since: Date,
  ): Promise<Notification[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('notifications')
      .find({
        company_id: companyId,
        recipient_user_id: recipientUserId,
        priority,
        is_read: false,
        is_digested: { $ne: true },
        created_at: { $gte: since },
      })
      .sort({ created_at: 1 })
      .toArray();
    return docs.map((d) => fromDoc(d as Record<string, unknown>));
  }

  async findPendingDigestRecipients(
    priority: NotificationPriorityLevel,
    since: Date,
  ): Promise<Array<{ companyId: string; recipientUserId: string }>> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('notifications')
      .aggregate([
        {
          $match: {
            priority,
            is_read: false,
            is_digested: { $ne: true },
            created_at: { $gte: since },
          },
        },
        {
          $group: {
            _id: { company_id: '$company_id', recipient_user_id: '$recipient_user_id' },
          },
        },
      ])
      .toArray();
    return docs.map((d) => ({
      companyId: String((d._id as Record<string, unknown>).company_id),
      recipientUserId: String((d._id as Record<string, unknown>).recipient_user_id),
    }));
  }

  async markDigested(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getMongoDb();
    await db
      .collection<any>('notifications')
      .updateMany({ _id: { $in: ids } }, { $set: { is_digested: true, updated_at: new Date() } });
  }
}
