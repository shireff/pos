import type { SubmitFeedbackCommand, SubmitFeedbackResult } from './submit-feedback.command';
import { AIInsightFeedback } from '@packages/domain-ai-insights';

export class SubmitFeedbackHandler {
  public async execute(command: SubmitFeedbackCommand): Promise<SubmitFeedbackResult> {
    const feedback = AIInsightFeedback.record({
      insightId: command.insightId,
      accepted: command.accepted,
      actingUserId: command.userId,
    });

    return {
      feedbackId: feedback.id,
    };
  }
}
