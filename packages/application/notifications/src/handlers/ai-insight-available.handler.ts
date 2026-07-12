import type {
  NotificationDraft,
  NotificationHandler,
  NotificationHandlerContext,
} from '../ports';
import { makeDraft } from './base';
import { NOTIFICATION_KEYS } from '../notification-keys';
import { AIRecommendationGenerated, AIAnomalyDetected } from '@packages/domain-ai-insights';

/**
 * AI insight available (Notifications.md §3). Daily AI outputs (recommendations,
 * forecasts) are Low priority and batched into the daily digest.
 */
export class AiInsightAvailableHandler
  implements NotificationHandler<AIRecommendationGenerated>
{
  public readonly eventType = 'AIRecommendationGenerated';

  public async handle(
    event: AIRecommendationGenerated,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'AI_INSIGHT',
        category: 'AI_INSIGHTS',
        priority: 'LOW',
        titleKey: NOTIFICATION_KEYS.aiInsight,
        bodyKey: NOTIFICATION_KEYS.aiInsight,
        vars: { type: event.insightType },
      }),
    ];
  }
}

/**
 * AI anomaly / fraud risk (Notifications.md §3). Critical, owner only, SECURITY
 * category — never rate-limited or batched (safety-relevant).
 */
export class AiAnomalyHandler implements NotificationHandler<AIAnomalyDetected> {
  public readonly eventType = 'AIAnomalyDetected';

  public async handle(
    event: AIAnomalyDetected,
    ctx: NotificationHandlerContext,
  ): Promise<NotificationDraft[]> {
    const recipients = await ctx.resolve({ kind: 'OWNER' });
    if (recipients.length === 0) return [];
    return [
      makeDraft({
        companyId: event.companyId,
        recipientUserIds: recipients,
        triggerCode: 'AI_ANOMALY',
        category: 'SECURITY',
        priority: 'CRITICAL',
        titleKey: NOTIFICATION_KEYS.aiAnomaly,
        bodyKey: NOTIFICATION_KEYS.aiAnomaly,
        vars: { type: event.anomalyType, score: event.riskScore },
      }),
    ];
  }
}
