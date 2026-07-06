import { Result } from '@packages/shared-kernel';
import { AIRecommendation } from '../aggregates';

/**
 * AdvisoryOnlyGuard enforces the single most important AI rule:
 * no recommendation can apply a change without explicit human approval (BR-AI-001).
 *
 * This service is called in EVERY application-layer command handler that
 * processes an AI recommendation acceptance. It is tested by
 * Testing.md §9 advisory-only enforcement test (release-blocking).
 */
export class AdvisoryOnlyGuard {
  /**
   * Validates that a recommendation is in the correct state to be accepted.
   * Called BEFORE the downstream domain command (e.g. UpdatePriceCommand) is executed.
   * Returns Err if the acceptance is invalid — the command MUST NOT proceed on Err.
   */
  public static validateAcceptance(recommendation: AIRecommendation): Result<void, string> {
    if (recommendation.state !== 'presented') {
      return Result.fail(
        `AI recommendation "${recommendation.id}" must be in "presented" state before acceptance. ` +
          `Current state: "${recommendation.state}". ` +
          `This is a non-negotiable guard (BR-AI-001). No code path exists for auto-approval.`,
      );
    }
    return Result.ok(undefined);
  }
}

/**
 * AcceptanceRateTracker computes acceptance rates for AI features from feedback records.
 * A declining acceptance rate is an early-warning signal (AI.md §10).
 */
export class AcceptanceRateTracker {
  public static calculate(feedbacks: Array<{ accepted: boolean }>): {
    acceptanceRate: number;
    total: number;
    accepted: number;
    rejected: number;
  } {
    const total = feedbacks.length;
    if (total === 0) return { acceptanceRate: 0, total: 0, accepted: 0, rejected: 0 };
    const accepted = feedbacks.filter((f) => f.accepted).length;
    const rejected = total - accepted;
    return { acceptanceRate: accepted / total, total, accepted, rejected };
  }

  /**
   * Returns true if the acceptance rate has declined by more than `threshold` (default 20%)
   * compared to the baseline rate.
   */
  public static isSignificantDecline(
    currentRate: number,
    baselineRate: number,
    threshold: number = 0.2,
  ): boolean {
    if (baselineRate === 0) return false;
    return (baselineRate - currentRate) / baselineRate > threshold;
  }
}

/**
 * FraudScorer computes a deterministic rule-based fraud risk score.
 * The LLM generates only the narrative explanation — never the score itself (BR-AI-003).
 */
export interface FraudSignal {
  type:
    | 'high_void_rate'
    | 'high_return_rate'
    | 'drawer_without_sale'
    | 'price_manipulation'
    | 'duplicate_transaction'
    | 'inventory_shrinkage';
  weight: number; // 0–1 contribution to total score
  observed: number; // actual observed value
  threshold: number; // threshold above which this signal fires
}

export class FraudScorer {
  /**
   * Computes a 0–100 deterministic fraud risk score from rule-based signals.
   * Each signal fires if observed > threshold; its weight contributes to the score.
   */
  public static score(signals: FraudSignal[]): number {
    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return 0;

    const firedWeight = signals
      .filter((s) => s.observed > s.threshold)
      .reduce((sum, s) => sum + s.weight, 0);

    return Math.round((firedWeight / totalWeight) * 100);
  }
}
