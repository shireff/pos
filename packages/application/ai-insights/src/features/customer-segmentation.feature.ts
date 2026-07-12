import type { CustomerSegmentationCommand } from './ai-features.types';
import { AIRecommendation } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class CustomerSegmentationFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: CustomerSegmentationCommand): Promise<AIRecommendation[]> {
    const segments = this.computeRFMSegments(command.customers);
    const prompt = `RFM customer segments:\n${JSON.stringify(segments)}\n\nAssign a memorable tier name (e.g., "Champions", "Loyalists", "At Risk") to each segment and suggest a communication strategy for each.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 512,
      temperature: 0.4,
    });

    return segments.map((segment) =>
      AIRecommendation.create({
        companyId: command.companyId,
        insightType: 'customer_segment',
        payload: JSON.stringify(segment),
        narrativeText: result.text,
        source: 'local',
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    );
  }

  private computeRFMSegments(customers: CustomerSegmentationCommand['customers']): Array<{
    segment: string;
    count: number;
    avgRecency: number;
    avgFrequency: number;
    avgMonetary: number;
  }> {
    if (customers.length === 0) return [];

    const avgRecency = customers.reduce((s, c) => s + c.recencyDays, 0) / customers.length;
    const avgFrequency = customers.reduce((s, c) => s + c.frequency, 0) / customers.length;
    const avgMonetary = customers.reduce((s, c) => s + c.monetary, 0) / customers.length;

    const segments: Record<string, { recency: number; frequency: number; monetary: number; count: number }> = {};

    for (const customer of customers) {
      const recencyScore = customer.recencyDays < avgRecency ? 2 : 1;
      const frequencyScore = customer.frequency > avgFrequency ? 2 : 1;
      const monetaryScore = customer.monetary > avgMonetary ? 2 : 1;
      const key = `${recencyScore}${frequencyScore}${monetaryScore}`;

      if (!segments[key]) {
        segments[key] = { recency: 0, frequency: 0, monetary: 0, count: 0 };
      }
      segments[key].recency += customer.recencyDays;
      segments[key].frequency += customer.frequency;
      segments[key].monetary += customer.monetary;
      segments[key].count += 1;
    }

    return Object.entries(segments).map(([key, value]) => ({
      segment: key,
      count: value.count,
      avgRecency: Math.round(value.recency / value.count),
      avgFrequency: Math.round(value.frequency / value.count),
      avgMonetary: Math.round(value.monetary / value.count),
    }));
  }
}
