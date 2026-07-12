import type { CashFlowPredictionCommand } from './ai-features.types';
import { AIPrediction } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class CashFlowPredictionFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: CashFlowPredictionCommand): Promise<AIPrediction> {
    const avgInflow = command.historicalPayments.reduce((s, p) => s + p.inflow, 0) / command.historicalPayments.length;
    const avgOutflow = command.historicalPayments.reduce((s, p) => s + p.outflow, 0) / command.historicalPayments.length;
    const projectedNet = (avgInflow - avgOutflow) * command.horizonDays;

    const prompt = `Based on historical payment data (avg inflow: ${avgInflow.toFixed(2)}, avg outflow: ${avgOutflow.toFixed(2)}), project the cash flow for the next ${command.horizonDays} days. Net projected: ${projectedNet.toFixed(2)}.\nProvide a brief narrative summary.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 256,
      temperature: 0.2,
    });

    return AIPrediction.create({
      companyId: command.companyId,
      branchId: command.branchId,
      insightType: 'cash_flow_prediction',
      deterministicValue: Math.round(projectedNet),
      deterministicUnit: 'EGP',
      narrativeText: result.text,
      source: result.source as 'local',
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
}
