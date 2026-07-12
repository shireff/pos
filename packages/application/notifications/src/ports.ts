import type {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationPriorityLevel,
} from '@packages/domain-notifications';
import type { Notification } from '@packages/domain-notifications';

export type {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationPriorityLevel,
} from '@packages/domain-notifications';

export type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

/** Abstraction over "now" so handlers/jobs can be driven by an injected clock (clock simulation). */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

// ─── Recipient resolution ──────────────────────────────────────────────────────

export type RecipientSpec =
  | { kind: 'OWNER' }
  | { kind: 'BRANCH_MANAGER'; branchId?: string }
  | { kind: 'APPROVER'; branchId?: string }
  | { kind: 'COMPANY_ADMINS' }
  | { kind: 'USER'; userId: string }
  | { kind: 'ROLE'; role: string };

export interface RecipientResolverPort {
  resolve(companyId: string, spec: RecipientSpec): Promise<string[]>;
}

// ─── Notification draft produced by a handler ──────────────────────────────────

export interface NotificationDraft {
  companyId: string;
  recipientUserIds: string[];
  triggerCode: string;
  category: NotificationCategory;
  priority: NotificationPriorityLevel;
  titleKey: string;
  bodyKey: string;
  vars?: Record<string, string | number>;
  /** When set, the in-app notification (and push) deep-links to the action. */
  actionUrl?: string;
  referenceType?: string;
  referenceId?: string;
}

// ─── Context handed to each handler when an event fires ────────────────────────

export interface NotificationHandlerContext {
  t: TranslateFn;
  clock: Clock;
  resolve: (spec: RecipientSpec) => Promise<string[]>;
}

export interface NotificationHandler<E = unknown> {
  /** Domain event class name this handler listens for (e.g. 'ReturnRequested'). */
  readonly eventType: string;
  handle(event: E, ctx: NotificationHandlerContext): Promise<NotificationDraft[]>;
}

// ─── Channel abstraction (implemented in infrastructure-notifications) ─────────

export interface ChannelSendInput {
  notification: Notification;
  recipientUserId: string;
  channel: NotificationChannel;
}

export interface NotificationChannelPort {
  readonly channel: NotificationChannel;
  /** Returns true when the channel is available/configured for delivery. */
  isAvailable(recipientUserId: string): Promise<boolean> | boolean;
  send(input: ChannelSendInput): Promise<void>;
}

// ─── Repositories (ports implemented in infrastructure-mongodb) ────────────────

export interface NotificationQuery {
  companyId: string;
  recipientUserId: string;
  isRead?: boolean;
  category?: NotificationCategory;
  limit?: number;
  cursor?: string;
}

export interface NotificationRepositoryPort {
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByQuery(query: NotificationQuery): Promise<Notification[]>;
  countUnread(companyId: string, recipientUserId: string): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(companyId: string, recipientUserId: string): Promise<void>;
  findPendingDigest(
    companyId: string,
    recipientUserId: string,
    priority: NotificationPriorityLevel,
    since: Date,
  ): Promise<Notification[]>;
  findPendingDigestRecipients(
    priority: NotificationPriorityLevel,
    since: Date,
  ): Promise<Array<{ companyId: string; recipientUserId: string }>>;
  markDigested(ids: string[]): Promise<void>;
}

export interface NotificationPreferenceRow {
  userId: string;
  companyId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  isEnabled: boolean;
}

export interface NotificationPreferenceRepositoryPort {
  getForUser(
    userId: string,
    companyId: string,
    category: NotificationCategory,
  ): Promise<NotificationPreferenceRow[]>;
  getAllForUser(userId: string, companyId: string): Promise<NotificationPreferenceRow[]>;
  upsert(row: NotificationPreferenceRow): Promise<void>;
}

export interface RateLimitWindow {
  userId: string;
  category: NotificationCategory;
  windowStartsAt: Date;
  windowEndsAt: Date;
  count: number;
  lastKey: string;
  /** When the last (user, category, key) was recorded — used for duplicate suppression. */
  lastKeyAt: Date;
}

export interface RateLimitRepositoryPort {
  getWindow(
    userId: string,
    category: NotificationCategory,
    now: Date,
  ): Promise<RateLimitWindow | null>;
  increment(
    userId: string,
    category: NotificationCategory,
    now: Date,
    key: string,
    windowMs: number,
    keyAt?: Date,
  ): Promise<RateLimitWindow>;
}

export interface DigestRepositoryPort {
  save(digest: NotificationDigestRecord): Promise<void>;
  findLatest(
    companyId: string,
    recipientUserId: string,
    frequency: 'HOURLY' | 'DAILY',
  ): Promise<NotificationDigestRecord | null>;
}

export interface NotificationDigestRecord {
  id: string;
  companyId: string;
  recipientUserId: string;
  frequency: 'HOURLY' | 'DAILY';
  categoryCounts: Record<string, number>;
  notificationIds: string[];
  titleKey: string;
  bodyKey: string;
  vars: Record<string, string | number>;
  actionUrl?: string;
  isRead: boolean;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}
