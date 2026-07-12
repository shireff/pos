import type { QueryAssistantCommand, QueryAssistantResult } from './query-assistant.command';
import { AIPrediction } from '@packages/domain-ai-insights';
import { AssistantFeature } from '../features/assistant.feature';
import { QueryClassifier } from '@packages/application-ai';
import { ContextAssembler } from '@packages/application-ai';
import { Identifier } from '@packages/shared-kernel';

export class QueryAssistantHandler {
  public constructor(
    private readonly assistantFeature: AssistantFeature,
    private readonly classifier: QueryClassifier,
    private readonly contextAssembler: ContextAssembler,
  ) {}

  public async execute(command: QueryAssistantCommand): Promise<QueryAssistantResult> {
    const classification = this.classifier.classify(command.question);

    const prediction = await this.assistantFeature.execute({
      question: command.question,
      companyId: command.companyId,
      branchId: command.branchId,
      userId: command.userId,
    });

    return {
      id: prediction.id,
      answer: prediction.narrativeText,
      source: prediction.source,
      timestamp: prediction.generatedAt,
    };
  }
}
