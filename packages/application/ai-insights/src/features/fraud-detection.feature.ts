import type { FraudDetectionCommand } from './ai-features.types';
import { AIPrediction } from '@packages/domain-ai-insights';
import { FraudScorer, type FraudSignal } from '@packages/domain-ai-insights';
import type { IAIProvider } from '@packages/application-ai';

export class FraudDetectionFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: FraudDetectionCommand): Promise<AIPrediction> {
    const signals: FraudSignal[] = [
      {
        type: 'high_void_rate',
        weight: 0.25,
        observed: command.transaction.voidRate,
        threshold: 0.1,
      },
      {
        type: 'high_return_rate',
        weight: 0.25,
        observed: command.transaction.returnRate,
        threshold: 0.15,
      },
      {
        type: 'price_manipulation',
        weight: 0.3,
        observed: command.transaction.discount,
        threshold: 30,
      },
      {
        type: 'duplicate_transaction',
        weight: 0.2,
        observed: 0,
        threshold: 1,
      },
    ];

    const score = FraudScorer.score(signals);
    const prompt = `Transaction analysis:\n- Amount: ${command.transaction.amount}\n- Discount: ${command.transaction.discount}%\n- Hour: ${command.transaction.hour}:00\n- Cashier: ${command.transaction.cashierId}\n- Void rate: ${command.transaction.voidRate}\n- Return rate: ${command.transaction.returnRate}\n\nDeterministic fraud risk score: ${score}/100.\nProvide a brief explanation of why this transaction was flagged.`;
    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 256,
      temperature: 0.1,
    });

    return AIPrediction.create({
      companyId: command.companyId,
      branchId: command.branchId,
      insightType: 'fraud_alert',
      deterministicValue: score,
      deterministicUnit: 'score',
      narrativeText: result.text,
      source: result.source as 'local',
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }
}
