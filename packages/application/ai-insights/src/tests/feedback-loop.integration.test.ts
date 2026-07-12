import { describe, it, expect, vi } from 'vitest';
import { SubmitFeedbackHandler } from '../submit-feedback/submit-feedback.handler';
import { AcceptRecommendationHandler } from '../accept-recommendation/accept-recommendation.handler';
import { AdvisoryOnlyGuard } from '@packages/domain-ai-insights';
import { AIRecommendation } from '@packages/domain-ai-insights';
import { AIInsightFeedback } from '@packages/domain-ai-insights';
import { AcceptanceRateTracker } from '@packages/domain-ai-insights';

describe('Feedback loop integration', () => {
  it('accept creates feedback record', async () => {
    const handler = new SubmitFeedbackHandler();
    const result = await handler.execute({
      insightId: 'insight-1',
      userId: 'user-1',
      accepted: true,
    });

    expect(result.feedbackId).toBeDefined();
    expect(result.feedbackId.length).toBeGreaterThan(0);
  });

  it('reject creates feedback record', async () => {
    const handler = new SubmitFeedbackHandler();
    const result = await handler.execute({
      insightId: 'insight-2',
      userId: 'user-2',
      accepted: false,
    });

    expect(result.feedbackId).toBeDefined();
  });

  it('acceptance rate calculated correctly from feedback collection', () => {
    const feedbacks = [
      { accepted: true },
      { accepted: true },
      { accepted: false },
      { accepted: true },
      { accepted: false },
    ];

    const result = AcceptanceRateTracker.calculate(feedbacks);
    expect(result.total).toBe(5);
    expect(result.accepted).toBe(3);
    expect(result.rejected).toBe(2);
    expect(result.acceptanceRate).toBeCloseTo(0.6);
  });

  it('advisory-only guard prevents auto-approval', () => {
    const recommendation = AIRecommendation.reconstitute({
      id: 'rec-1',
      companyId: 'c1',
      insightType: 'price_change',
      state: 'generated',
      payload: '{}',
      narrativeText: 'test',
      source: 'local',
      generatedAt: new Date().toISOString(),
      presentedAt: null,
      resolvedAt: null,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const result = AdvisoryOnlyGuard.validateAcceptance(recommendation);
    expect(result.isFail()).toBe(true);
  });
});
