import type { AssistantCommand } from './ai-features.types';
import { AIPrediction } from '@packages/domain-ai-insights';
import { Identifier } from '@packages/shared-kernel';
import type { IAIProvider } from '@packages/application-ai';

export class AssistantFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: AssistantCommand): Promise<AIPrediction> {
    const prompt = `You are a helpful store assistant. Answer the following question using only the provided context.\n\nQuestion: ${command.question}\n\nContext: Store KPIs and recent events.`;

    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 512,
      temperature: 0.3,
    });

    return AIPrediction.create({
      companyId: command.companyId,
      branchId: command.branchId ?? null,
      insightType: 'assistant_query',
      deterministicValue: 0,
      deterministicUnit: 'text',
      narrativeText: result.text,
      source: result.source as 'local',
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }
}
