import type { Notification } from '@packages/domain-notifications';
import type {
  ChannelSendInput,
  NotificationChannelPort,
  NotificationPreferenceRepositoryPort,
  NotificationPreferenceRow,
  NotificationQuery,
  NotificationRepositoryPort,
  RateLimitRepositoryPort,
  RateLimitWindow,
  RecipientResolverPort,
  RecipientSpec,
  TranslateFn,
  NotificationPriorityLevel,
} from '@packages/application-notifications';

// ─── In-memory notification repository ─────────────────────────────────────────

export class InMemoryNotificationRepository implements NotificationRepositoryPort {
  public readonly store: Notification[] = [];

  async save(notification: Notification): Promise<void> {
    this.store.push(notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.store.find((n) => n.id === id) ?? null;
  }

  async findByQuery(query: NotificationQuery): Promise<Notification[]> {
    let rows = this.store.filter(
      (n) => n.companyId === query.companyId && n.recipientUserId === query.recipientUserId,
    );
    if (query.isRead !== undefined) rows = rows.filter((n) => n.isRead === query.isRead);
    if (query.category) rows = rows.filter((n) => n.category === query.category);
    rows = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (query.limit) rows = rows.slice(0, query.limit);
    return rows;
  }

  async countUnread(companyId: string, recipientUserId: string): Promise<number> {
    return this.store.filter(
      (n) =>
        n.companyId === companyId && n.recipientUserId === recipientUserId && !n.isRead,
    ).length;
  }

  async markRead(id: string): Promise<void> {
    const n = this.store.find((x) => x.id === id);
    if (n) n.markRead();
  }

  async markAllRead(companyId: string, recipientUserId: string): Promise<void> {
    for (const n of this.store) {
      if (n.companyId === companyId && n.recipientUserId === recipientUserId) n.markRead();
    }
  }

  async findPendingDigest(
    companyId: string,
    recipientUserId: string,
    priority: NotificationPriorityLevel,
    since: Date,
  ): Promise<Notification[]> {
    return this.store.filter(
      (n) =>
        n.companyId === companyId &&
        n.recipientUserId === recipientUserId &&
        n.priority === priority &&
        !n.isRead &&
        n.createdAt >= since,
    );
  }

  async findPendingDigestRecipients(
    priority: 'MEDIUM' | 'LOW',
    since: Date,
  ): Promise<Array<{ companyId: string; recipientUserId: string }>> {
    const map = new Map<string, { companyId: string; recipientUserId: string }>();
    for (const n of this.store) {
      if (n.priority === priority && n.createdAt >= since && !n.isRead) {
        map.set(`${n.companyId}:${n.recipientUserId}`, {
          companyId: n.companyId,
          recipientUserId: n.recipientUserId,
        });
      }
    }
    return [...map.values()];
  }

  async markDigested(ids: string[]): Promise<void> {
    const set = new Set(ids);
    for (const n of this.store) if (set.has(n.id)) n.markRead();
  }
}

// ─── In-memory preference repository ───────────────────────────────────────────

export class InMemoryPreferenceRepository implements NotificationPreferenceRepositoryPort {
  public readonly rows: NotificationPreferenceRow[] = [];

  async getForUser(
    userId: string,
    companyId: string,
    category: NotificationPreferenceRow['category'],
  ): Promise<NotificationPreferenceRow[]> {
    return this.rows.filter(
      (r) => r.userId === userId && r.companyId === companyId && r.category === category,
    );
  }

  async getAllForUser(userId: string, companyId: string): Promise<NotificationPreferenceRow[]> {
    return this.rows.filter((r) => r.userId === userId && r.companyId === companyId);
  }

  async upsert(row: NotificationPreferenceRow): Promise<void> {
    const idx = this.rows.findIndex(
      (r) =>
        r.userId === row.userId &&
        r.companyId === row.companyId &&
        r.category === row.category &&
        r.channel === row.channel,
    );
    if (idx >= 0) this.rows[idx] = row;
    else this.rows.push(row);
  }
}

// ─── In-memory rate-limit repository ───────────────────────────────────────────

export class InMemoryRateLimitRepository implements RateLimitRepositoryPort {
  private readonly windows = new Map<string, RateLimitWindow>();

  private key(userId: string, category: string): string {
    return `${userId}:${category}`;
  }

  async getWindow(
    userId: string,
    category: RateLimitWindow['category'],
    now: Date,
  ): Promise<RateLimitWindow | null> {
    const w = this.windows.get(this.key(userId, category));
    if (!w) return null;
    if (w.windowEndsAt.getTime() < now.getTime()) return null; // expired
    return w;
  }

  async increment(
    userId: string,
    category: RateLimitWindow['category'],
    now: Date,
    key: string,
    windowMs: number,
    keyAt?: Date,
  ): Promise<RateLimitWindow> {
    const k = this.key(userId, category);
    const existing = this.windows.get(k);
    const live =
      existing && existing.windowEndsAt.getTime() >= now.getTime() ? existing : null;
    const window: RateLimitWindow = {
      userId,
      category,
      windowStartsAt: live ? live.windowStartsAt : new Date(now.getTime() - windowMs / 2),
      windowEndsAt: live ? live.windowEndsAt : new Date(now.getTime() + windowMs / 2),
      count: (live?.count ?? 0) + 1,
      lastKey: key,
      lastKeyAt: keyAt ?? now,
    };
    this.windows.set(k, window);
    return window;
  }
}

// ─── Fake recipient resolver ───────────────────────────────────────────────────

export class FakeRecipientResolver implements RecipientResolverPort {
  async resolve(_companyId: string, spec: RecipientSpec): Promise<string[]> {
    switch (spec.kind) {
      case 'OWNER':
        return ['owner1'];
      case 'BRANCH_MANAGER':
        return ['mgr1'];
      case 'APPROVER':
        return ['approver1'];
      case 'COMPANY_ADMINS':
        return ['owner1', 'admin1'];
      case 'USER':
        return [spec.userId];
      case 'ROLE':
        return [`role:${spec.role}`];
      default:
        return [];
    }
  }
}

// ─── Identity translator (returns the key unchanged) ───────────────────────────

export const identityTranslator: TranslateFn = (key) => key;

// ─── Fake channel (records every send) ─────────────────────────────────────────

export class FakeChannel implements NotificationChannelPort {
  public readonly sent: ChannelSendInput[] = [];

  constructor(
    public readonly channel: 'PUSH' | 'EMAIL',
    private readonly available = true,
  ) {}

  isAvailable(): boolean {
    return this.available;
  }

  async send(input: ChannelSendInput): Promise<void> {
    this.sent.push(input);
  }
}
