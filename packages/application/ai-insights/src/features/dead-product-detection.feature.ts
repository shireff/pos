import type { DeadProductDetectionCommand } from './ai-features.types';
import { AIRecommendation } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class DeadProductDetectionFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: DeadProductDetectionCommand): Promise<AIRecommendation[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - command.periodDays);

    const deadProducts = command.products.filter((p) => !p.lastSaleDate || new Date(p.lastSaleDate) < cutoff);

    if (deadProducts.length === 0) {
      return [];
    }

    const prompt = `The following products have had no sales in the last ${command.periodDays} days:\n${JSON.stringify(deadProducts)}\n\nFor each product, suggest one action: markdown, bundle, or discontinue. Provide a brief rationale.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 512,
      temperature: 0.3,
    });

    return deadProducts.map((product, index) =>
      AIRecommendation.create({
        companyId: command.companyId,
        insightType: 'dead_product',
        payload: JSON.stringify({ productId: product.id, action: 'unknown', rationale: result.text }),
        narrativeText: result.text,
        source: 'local',
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    );
  }
}
