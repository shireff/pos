import type { SalesPredictionCommand } from './ai-features.types';
import { AIPrediction } from '@packages/domain-ai-insights';
import { Identifier } from '@packages/shared-kernel';
import type { IAIProvider } from '@packages/application-ai';

export class SalesPredictionFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: SalesPredictionCommand): Promise<AIPrediction> {
    const baseline = this.computeLinearRegression(command.historicalData);
    const prompt = `Given the following daily sales data for the past ${command.historicalData.length} days:\n${JSON.stringify(command.historicalData)}\n\nThe linear regression baseline predicts ${baseline} for the next period.\nProvide a concise narrative summary of the sales trend, noting any seasonality or anomalies.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 256,
      temperature: 0.2,
    });

    return AIPrediction.create({
      companyId: command.companyId,
      branchId: command.branchId,
      insightType: 'sales_prediction',
      deterministicValue: baseline,
      deterministicUnit: 'EGP',
      narrativeText: result.text,
      source: result.source as 'local',
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  private computeLinearRegression(data: { date: string; revenue: number }[]): number {
    if (data.length < 2) return data[0]?.revenue ?? 0;
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i].revenue;
      sumXY += i * data[i].revenue;
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return Math.round(slope * n + intercept);
  }
}
