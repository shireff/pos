import type { AnomalyDetectionCommand } from './ai-features.types';
import { AIPrediction } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class AnomalyDetectionFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: AnomalyDetectionCommand): Promise<AIPrediction[]> {
    const anomalies = this.detectZScoreAnomalies(command.values, command.labels);
    if (anomalies.length === 0) return [];

    const prompt = `Z-score anomaly detection results for "${command.metricName}":\n${JSON.stringify(anomalies)}\n\nExplain the probable causes of these anomalies in 1-2 sentences each.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 512,
      temperature: 0.2,
    });

    return anomalies.map((anomaly) =>
      AIPrediction.create({
        companyId: command.companyId,
        branchId: command.branchId,
        insightType: 'anomaly',
        deterministicValue: anomaly.zScore,
        deterministicUnit: 'z-score',
        narrativeText: result.text,
        source: result.source as 'local',
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    );
  }

  private detectZScoreAnomalies(values: number[], labels: string[]): Array<{ label: string; value: number; zScore: number }> {
    const n = values.length;
    if (n < 2) return [];

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return [];

    const threshold = 2;
    const anomalies: Array<{ label: string; value: number; zScore: number }> = [];

    for (let i = 0; i < n; i++) {
      const zScore = (values[i] - mean) / stdDev;
      if (Math.abs(zScore) > threshold) {
        anomalies.push({ label: labels[i] ?? String(i), value: values[i], zScore: Math.round(zScore * 100) / 100 });
      }
    }

    return anomalies;
  }
}
