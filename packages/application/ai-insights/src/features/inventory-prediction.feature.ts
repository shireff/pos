import type { InventoryPredictionCommand } from './ai-features.types';
import { AIPrediction } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class InventoryPredictionFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: InventoryPredictionCommand): Promise<AIPrediction> {
    const baseline = this.computeAverage(command.stockMovements);
    const prompt = `Given stock movement data for product ${command.productId}:\n${JSON.stringify(command.stockMovements)}\n\nThe average daily movement is ${baseline.toFixed(2)} units.\nSuggest reorder quantities and timing based on this trend.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 256,
      temperature: 0.2,
    });

    return AIPrediction.create({
      companyId: command.companyId,
      branchId: command.branchId,
      insightType: 'inventory_prediction',
      deterministicValue: Math.round(baseline),
      deterministicUnit: 'units',
      narrativeText: result.text,
      source: result.source as 'local',
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  private computeAverage(data: { date: string; quantity: number }[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + d.quantity, 0);
    return sum / data.length;
  }
}
