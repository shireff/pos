import { getMongoDb } from '../src/mongo-connection';
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
} from '@packages/domain-notifications';
import type { NotificationPreferenceRepositoryPort, NotificationPreferenceRow } from '@packages/application-notifications';

const ALL_CATEGORIES: NotificationCategory[] = [
  'INVENTORY',
  'APPROVALS',
  'SYNC',
  'AI_INSIGHTS',
  'BILLING_TRIAL',
  'REPORTS',
  'SECURITY',
  'GENERAL',
];
const ALL_CHANNELS: NotificationChannel[] = ['IN_APP', 'PUSH', 'EMAIL'];

/** Sensible per-role defaults (Notifications.md §5). */
export function defaultPreferenceRows(
  userId: string,
  companyId: string,
): NotificationPreferenceRow[] {
  const rows: NotificationPreferenceRow[] = [];
  for (const category of ALL_CATEGORIES) {
    for (const channel of ALL_CHANNELS) {
      // BILLING_TRIAL can never be muted (BR-NOT-004) and only the Owner gets it by default.
      const isBilling = category === 'BILLING_TRIAL';
      rows.push({
        userId,
        companyId,
        category,
        channel,
        frequency: isBilling ? 'IMMEDIATE' : 'IMMEDIATE',
        isEnabled: isBilling ? true : channel === 'IN_APP' ? true : category !== 'GENERAL',
      });
    }
  }
  return rows;
}

function toDoc(r: NotificationPreferenceRow): Record<string, unknown> {
  return {
    _id: `${r.userId}:${r.category}:${r.channel}`,
    user_id: r.userId,
    company_id: r.companyId,
    category: r.category,
    channel: r.channel,
    frequency: r.frequency,
    is_enabled: r.isEnabled,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function fromDoc(doc: Record<string, unknown>): NotificationPreferenceRow {
  return {
    userId: String(doc.user_id),
    companyId: String(doc.company_id),
    category: doc.category as NotificationCategory,
    channel: doc.channel as NotificationChannel,
    frequency: doc.frequency as NotificationFrequency,
    isEnabled: Boolean(doc.is_enabled),
  };
}

export class MongoNotificationPreferenceRepository
  implements NotificationPreferenceRepositoryPort
{
  async getForUser(
    userId: string,
    companyId: string,
    category: NotificationCategory,
  ): Promise<NotificationPreferenceRow[]> {
    const stored = await this.getAllForUser(userId, companyId);
    if (stored.length === 0) return defaultPreferenceRows(userId, companyId).filter((r) => r.category === category);
    return stored.filter((r) => r.category === category);
  }

  async getAllForUser(
    userId: string,
    companyId: string,
  ): Promise<NotificationPreferenceRow[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('notification_preferences')
      .find({ user_id: userId, company_id: companyId })
      .toArray();
    if (docs.length === 0) return [];
    return docs.map((d) => fromDoc(d as Record<string, unknown>));
  }

  async upsert(row: NotificationPreferenceRow): Promise<void> {
    const db = await getMongoDb();
    await db
      .collection<any>('notification_preferences')
      .updateOne({ _id: `${row.userId}:${row.category}:${row.channel}` }, { $set: toDoc(row) }, { upsert: true });
  }
}
