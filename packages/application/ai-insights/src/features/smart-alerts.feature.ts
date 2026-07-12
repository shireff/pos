import type { SmartAlertsCommand } from './ai-features.types';
import { AIPrediction } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class SmartAlertsFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: SmartAlertsCommand): Promise<AIPrediction[]> {
    const alerts: Array<{ type: string; severity: 'high' | 'medium' | 'low'; detail: string }> = [];

    const salesDrop = command.previousDaySales > 0
      ? (command.previousDaySales - command.currentDaySales) / command.previousDaySales
      : 0;
    if (salesDrop > 0.3) {
      alerts.push({
        type: 'sales_drop',
        severity: 'high',
        detail: `Sales dropped ${(salesDrop * 100).toFixed(1)}% day-over-day.`,
      });
    }

    for (const spike of command.paymentMethodSpikes) {
      if (spike.currentRate > spike.baselineRate * 2) {
        alerts.push({
          type: 'payment_spike',
          severity: 'medium',
          detail: `Payment method "${spike.method}" usage spiked to ${(spike.currentRate * 100).toFixed(1)}% (baseline: ${(spike.baselineRate * 100).toFixed(1)}%).`,
        });
      }
    }

    if (alerts.length === 0) return [];

    const prompt = `Anomaly alerts detected:\n${JSON.stringify(alerts)}\n\nGenerate a concise contextual alert message summarizing the anomalies.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 256,
      temperature: 0.2,
    });

    return [
      AIPrediction.create({
        companyId: command.companyId,
        branchId: command.branchId,
        insightType: 'smart_alert',
        deterministicValue: alerts.length,
        deterministicUnit: 'alerts',
        narrativeText: result.text,
        source: result.source as 'local',
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];
  }
}
