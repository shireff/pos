import { Identifier } from '@packages/shared-kernel';
import { AIProviderSource, HealthSubScore } from '../value-objects';

// ─── AIInsightFeedback ────────────────────────────────────────────────────────

export interface AIInsightFeedbackProps {
  id: string;
  insightId: string;
  accepted: boolean;
  actingUserId: string;
  occurredAt: string;
}

/** Append-only feedback record — never updated after creation. */
export class AIInsightFeedback {
  public readonly id: string;
  public readonly insightId: string;
  public readonly accepted: boolean;
  public readonly actingUserId: string;
  public readonly occurredAt: string;

  private constructor(props: AIInsightFeedbackProps) {
    this.id = props.id;
    this.insightId = props.insightId;
    this.accepted = props.accepted;
    this.actingUserId = props.actingUserId;
    this.occurredAt = props.occurredAt;
  }

  public static record(
    props: Omit<AIInsightFeedbackProps, 'id' | 'occurredAt'>,
  ): AIInsightFeedback {
    return new AIInsightFeedback({
      id: Identifier.generate(),
      occurredAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: AIInsightFeedbackProps): AIInsightFeedback {
    return new AIInsightFeedback(props);
  }
}

// ─── HealthScoreSnapshot ─────────────────────────────────────────────────────

export interface HealthScoreSnapshotProps {
  id: string;
  companyId: string;
  branchId: string | null;
  overallScore: number; // 0–100 deterministic composite
  subScores: Record<HealthSubScore, number>;
  narrativeSummary: string; // LLM-generated text — advisory only
  topRecommendations: string[]; // LLM-generated — advisory only, max 3
  generatedAt: string;
  source: AIProviderSource;
}

export class HealthScoreSnapshot {
  public readonly id: string;
  public readonly companyId: string;
  public readonly branchId: string | null;
  public readonly overallScore: number;
  public readonly subScores: Readonly<Record<HealthSubScore, number>>;
  public readonly narrativeSummary: string;
  public readonly topRecommendations: readonly string[];
  public readonly generatedAt: string;
  public readonly source: AIProviderSource;

  private constructor(props: HealthScoreSnapshotProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.overallScore = props.overallScore;
    this.subScores = Object.freeze({ ...props.subScores });
    this.narrativeSummary = props.narrativeSummary;
    this.topRecommendations = Object.freeze([...props.topRecommendations]);
    this.generatedAt = props.generatedAt;
    this.source = props.source;
  }

  public static create(props: Omit<HealthScoreSnapshotProps, 'id'>): HealthScoreSnapshot {
    return new HealthScoreSnapshot({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: HealthScoreSnapshotProps): HealthScoreSnapshot {
    return new HealthScoreSnapshot(props);
  }
}
