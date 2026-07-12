import type { AcceptRecommendationCommand, AcceptRecommendationResult } from './accept-recommendation.command';
import { AdvisoryOnlyGuard } from '@packages/domain-ai-insights';
import { AIRecommendation } from '@packages/domain-ai-insights';
import { AIInsightFeedback } from '@packages/domain-ai-insights';
import { Identifier } from '@packages/shared-kernel';

export class AcceptRecommendationHandler {
  public async execute(command: AcceptRecommendationCommand): Promise<AcceptRecommendationResult> {
    const recommendation = AIRecommendation.reconstitute({
      id: command.recommendationId,
      companyId: '',
      insightType: 'price_change',
      state: 'presented',
      payload: '',
      narrativeText: '',
      source: 'local',
      generatedAt: '',
      presentedAt: new Date().toISOString(),
      resolvedAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const validation = AdvisoryOnlyGuard.validateAcceptance(recommendation);
    if (validation.isFail()) {
      return { success: false };
    }

    const feedback = AIInsightFeedback.record({
      insightId: command.recommendationId,
      accepted: true,
      actingUserId: command.userId,
    });

    return {
      success: true,
      appliedCommand: `apply_recommendation_${command.recommendationId}`,
    };
  }
}
