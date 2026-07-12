import { logger, type LogContext } from '@packages/shared-kernel';
import { Notification } from '@packages/domain-notifications';
import type { DomainEventBase } from '@packages/shared-kernel';
import type {
  Clock,
  NotificationChannelPort,
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
  NotificationPreferenceRow,
  NotificationRepositoryPort,
  NotificationPreferenceRepositoryPort,
  RateLimitRepositoryPort,
  RecipientResolverPort,
  TranslateFn,
} from './ports';
import { systemClock } from './ports';
import { decideRouting } from './priority-gate';
import { RateLimiter, DEFAULT_RATE_LIMIT_CONFIG, type RateLimiterConfig } from './rate-limiter';

export interface NotificationDispatcherDeps {
  handlers: NotificationHandler[];
  channels: NotificationChannelPort[];
  notificationRepo: NotificationRepositoryPort;
  preferenceRepo: NotificationPreferenceRepositoryPort;
  rateLimitRepo: RateLimitRepositoryPort;
  resolver: RecipientResolverPort;
  translator: TranslateFn;
  clock?: Clock;
  rateLimitConfig?: RateLimiterConfig;
  logger?: typeof logger;
}

function getCompanyId(event: unknown): string {
  const e = event as Record<string, unknown>;
  return String(e.companyId ?? e.targetCompanyId ?? e.company_id ?? '');
}

/**
 * The single point through which every Domain Event becomes a human-visible
 * notification (Notifications.md §1, BR-NOT-001). Subscribes to all domain
 * events on the shared EventBus, routes each to its registered handler(s),
 * then applies the priority gate, rate limiter, and preference/digest logic
 * before delivering to the channel adapters.
 */
export class NotificationDispatcher {
  private readonly handlers: NotificationHandler[];
  private readonly channels: Map<string, NotificationChannelPort>;
  private readonly notificationRepo: NotificationRepositoryPort;
  private readonly preferenceRepo: NotificationPreferenceRepositoryPort;
  private readonly rateLimitRepo: RateLimitRepositoryPort;
  private readonly resolver: RecipientResolverPort;
  private readonly translator: TranslateFn;
  private readonly clock: Clock;
  private readonly rateLimiter: RateLimiter;
  private readonly log: NonNullable<NotificationDispatcherDeps['logger']>;
  private unsubscribe: (() => void)[] = [];

  constructor(deps: NotificationDispatcherDeps) {
    this.handlers = deps.handlers;
    this.channels = new Map(deps.channels.map((c) => [c.channel, c]));
    this.notificationRepo = deps.notificationRepo;
    this.preferenceRepo = deps.preferenceRepo;
    this.rateLimitRepo = deps.rateLimitRepo;
    this.resolver = deps.resolver;
    this.translator = deps.translator;
    this.clock = deps.clock ?? systemClock;
    this.rateLimiter = new RateLimiter(deps.rateLimitRepo, deps.rateLimitConfig ?? DEFAULT_RATE_LIMIT_CONFIG);
    this.log = deps.logger ?? logger;
  }

  /** Subscribe to all event types handled by the registered handlers. */
  public start(eventBus: {
    subscribe: <T>(eventType: string, handler: (e: T) => Promise<void> | void) => () => void;
  }): void {
    for (const handler of this.handlers) {
      this.unsubscribe.push(
        eventBus.subscribe(handler.eventType, (event) => this.dispatch(event as DomainEventBase)),
      );
    }
  }

  public stop(): void {
    for (const u of this.unsubscribe) u();
    this.unsubscribe = [];
  }

  /** Handle a single domain event: route to handlers, then deliver drafts. */
  public async dispatch(event: DomainEventBase): Promise<void> {
    const companyId = getCompanyId(event);
    const ctx: NotificationHandlerContext = {
      t: this.translator,
      clock: this.clock,
      resolve: (spec) => this.resolver.resolve(companyId, spec),
    };

    for (const handler of this.handlers) {
      if (handler.eventType !== event.constructor.name) continue;
      try {
        const drafts = await handler.handle(event, ctx);
        for (const draft of drafts) {
          await this.deliver(draft);
        }
      } catch (err) {
        this.log.error(`[notifications] handler ${handler.eventType} failed`, err as LogContext);
      }
    }
  }

  private async deliver(draft: NotificationDraft): Promise<void> {
    for (const userId of draft.recipientUserIds) {
      await this.deliverToRecipient(draft, userId);
    }
  }

  private async deliverToRecipient(draft: NotificationDraft, userId: string): Promise<void> {
    const routing = decideRouting(draft.priority, draft.category);
    const now = this.clock.now();
    const key = `${draft.triggerCode}:${draft.referenceId ?? ''}`;

    if (!routing.bypassesRateLimit) {
      const result = await this.rateLimiter.evaluate(userId, draft.category, key, now);
      if (result.duplicate) return; // sliding-window suppression
      if (result.capReached) {
        await this.ensureRateLimitSummary(userId, draft, now);
        return; // fold into summary rather than flooding
      }
    }

    const title = this.translator(draft.titleKey, draft.vars);
    const body = this.translator(draft.bodyKey, draft.vars);
    const notification = Notification.create({
      companyId: draft.companyId,
      recipientUserId: userId,
      triggerCode: draft.triggerCode,
      category: draft.category,
      priority: draft.priority,
      titleKey: draft.titleKey,
      bodyKey: draft.bodyKey,
      title,
      body,
      vars: draft.vars,
      actionUrl: draft.actionUrl ?? null,
      referenceType: draft.referenceType ?? null,
      referenceId: draft.referenceId ?? null,
    });

    // In-app record is always created — the source of truth (BR-NOT-001).
    await this.notificationRepo.save(notification);

    const prefs = await this.preferenceRepo.getForUser(userId, draft.companyId, draft.category);
    const prefByChannel = new Map<string, NotificationPreferenceRow>(
      prefs.map((p) => [p.channel, p]),
    );

    // Push + Email — immediate only for CRITICAL/HIGH, or when the user's
    // channel frequency is IMMEDIATE. MEDIUM/LOW are deferred to digest jobs.
    const immediateChannels: Array<'PUSH' | 'EMAIL'> = routing.immediate
      ? ['PUSH', 'EMAIL']
      : this.immediateChannelsForPrefs(prefByChannel);

    for (const channel of immediateChannels) {
      const pref = prefByChannel.get(channel);
      if (pref && !pref.isEnabled) continue; // channel muted (allowed even for safety)
      const adapter = this.channels.get(channel);
      if (!adapter) continue;
      if (!(await adapter.isAvailable(userId))) continue;
      try {
        await adapter.send({ notification, recipientUserId: userId, channel });
      } catch (err) {
        this.log.error(`[notifications] ${channel} delivery failed`, err as LogContext);
      }
    }
  }

  private immediateChannelsForPrefs(
    prefByChannel: Map<string, NotificationPreferenceRow>,
  ): Array<'PUSH' | 'EMAIL'> {
    const result: Array<'PUSH' | 'EMAIL'> = [];
    for (const channel of ['PUSH', 'EMAIL'] as const) {
      const pref = prefByChannel.get(channel);
      if (pref && pref.frequency === 'IMMEDIATE' && pref.isEnabled) result.push(channel);
    }
    return result;
  }

  private async ensureRateLimitSummary(
    userId: string,
    draft: NotificationDraft,
    now: Date,
  ): Promise<void> {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const existing = await this.notificationRepo.findByQuery({
      companyId: draft.companyId,
      recipientUserId: userId,
      limit: 100,
    });
    const summaryKey = `RATE_LIMIT_SUMMARY:${draft.category}`;
    const summary = existing.find((n) => n.triggerCode === summaryKey && n.createdAt >= startOfDay);
    if (summary) return; // one summary per category per day

    const notification = Notification.create({
      companyId: draft.companyId,
      recipientUserId: userId,
      triggerCode: summaryKey,
      category: draft.category,
      priority: 'LOW',
      titleKey: 'notifications.rateLimitSummary',
      bodyKey: 'notifications.rateLimitSummary',
      title: this.translator('notifications.rateLimitSummary', {
        category: draft.category,
      }),
      body: this.translator('notifications.rateLimitSummary', { category: draft.category }),
      vars: { category: draft.category },
    });
    await this.notificationRepo.save(notification);
  }
}
