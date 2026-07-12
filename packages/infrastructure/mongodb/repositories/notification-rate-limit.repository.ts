import { getMongoDb } from '../src/mongo-connection';
import type { NotificationCategory } from '@packages/domain-notifications';
import type { RateLimitRepositoryPort, RateLimitWindow } from '@packages/application-notifications';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toWindow(doc: Record<string, unknown>): RateLimitWindow {
  return {
    userId: String(doc.user_id),
    category: doc.category as NotificationCategory,
    windowStartsAt: doc.window_starts_at as Date,
    windowEndsAt: doc.window_ends_at as Date,
    count: Number(doc.count),
    lastKey: String(doc.last_key ?? ''),
    lastKeyAt: (doc.last_key_at as Date) ?? (doc.window_starts_at as Date),
  };
}

export class MongoRateLimitRepository implements RateLimitRepositoryPort {
  async getWindow(
    userId: string,
    category: NotificationCategory,
    now: Date,
  ): Promise<RateLimitWindow | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('notification_rate_limits').findOne({
      user_id: userId,
      category,
      window_ends_at: { $gt: now },
    });
    return doc ? toWindow(doc as Record<string, unknown>) : null;
  }

  async increment(
    userId: string,
    category: NotificationCategory,
    now: Date,
    key: string,
    windowMs: number,
    keyAt?: Date,
  ): Promise<RateLimitWindow> {
    const db = await getMongoDb();
    const dayStart = startOfDay(now);
    const dayEnd = new Date(dayStart.getTime() + windowMs);

    const existing = await db.collection<any>('notification_rate_limits').findOne({
      user_id: userId,
      category,
      window_ends_at: { $gt: now },
    });

    if (!existing) {
      const doc = {
        _id: `${userId}:${category}:${dayStart.toISOString()}`,
        user_id: userId,
        category,
        window_starts_at: dayStart,
        window_ends_at: dayEnd,
        count: 1,
        last_key: key,
        last_key_at: keyAt ?? now,
        created_at: now,
      };
      await db.collection<any>('notification_rate_limits').insertOne(doc);
      return toWindow(doc as unknown as Record<string, unknown>);
    }

    await db
      .collection('notification_rate_limits')
      .updateOne(
        { _id: existing._id },
        { $inc: { count: 1 }, $set: { last_key: key, last_key_at: keyAt ?? now } },
      );
    return toWindow({
      ...(existing as Record<string, unknown>),
      count: Number(existing.count) + 1,
      last_key: key,
      last_key_at: keyAt ?? now,
    } as Record<string, unknown>);
  }
}
