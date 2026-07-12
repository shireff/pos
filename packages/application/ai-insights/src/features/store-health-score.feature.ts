import type { StoreHealthScoreCommand } from './ai-features.types';
import { HealthScoreSnapshot } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class StoreHealthScoreFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: StoreHealthScoreCommand): Promise<HealthScoreSnapshot> {
    const overallScore = this.computeOverallScore(command.kpis);
    const subScores = {
      sales: command.kpis.sales.score,
      inventory: command.kpis.inventory.score,
      financial: command.kpis.financial.score,
      employee: command.kpis.employee.score,
      customer: command.kpis.customer.score,
    };

    const prompt = `Store health scores:\n- Sales: ${subScores.sales}/100\n- Inventory: ${subScores.inventory}/100\n- Financial: ${subScores.financial}/100\n- Employee: ${subScores.employee}/100\n- Customer: ${subScores.customer}/100\n- Overall: ${overallScore}/100\n\nProvide a concise narrative interpretation of the store health and top 3 recommendations.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 256,
      temperature: 0.3,
    });

    const lines = result.text.split('\n').filter((l) => l.trim().length > 0);
    const recommendations = lines.slice(0, 3);

    return HealthScoreSnapshot.create({
      companyId: command.companyId,
      branchId: command.branchId,
      overallScore,
      subScores,
      narrativeSummary: result.text,
      topRecommendations: recommendations,
      generatedAt: new Date().toISOString(),
      source: result.source as 'local',
    });
  }

  private computeOverallScore(kpis: StoreHealthScoreCommand['kpis']): number {
    const weights = { sales: 0.3, inventory: 0.2, financial: 0.25, employee: 0.15, customer: 0.1 };
    const weighted = Object.entries(kpis).reduce((sum, [key, value]) => {
      return sum + (value.score * (weights[key as keyof typeof weights] ?? 0));
    }, 0);
    return Math.round(weighted);
  }
}
