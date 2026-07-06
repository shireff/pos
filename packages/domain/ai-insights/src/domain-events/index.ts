import { DomainEventBase } from '@packages/shared-kernel';
import { AIInsightType, AIProviderSource } from '../value-objects';

export class AIPredictionGenerated extends DomainEventBase {
  public readonly companyId: string;
  public readonly insightType: AIInsightType;
  public readonly source: AIProviderSource;

  public constructor(props: {
    predictionId: string;
    companyId: string;
    insightType: AIInsightType;
    source: AIProviderSource;
  }) {
    super(props.predictionId, 'AIPrediction');
    this.companyId = props.companyId;
    this.insightType = props.insightType;
    this.source = props.source;
  }
}

export class AIAnomalyDetected extends DomainEventBase {
  public readonly companyId: string;
  public readonly branchId: string | null;
  public readonly anomalyType: string;
  public readonly riskScore: number;

  public constructor(props: {
    anomalyId: string;
    companyId: string;
    branchId: string | null;
    anomalyType: string;
    riskScore: number;
  }) {
    super(props.anomalyId, 'AIAnomaly');
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.anomalyType = props.anomalyType;
    this.riskScore = props.riskScore;
  }
}

export class AIHealthScoreSnapshotCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly overallScore: number;

  public constructor(props: { snapshotId: string; companyId: string; overallScore: number }) {
    super(props.snapshotId, 'HealthScoreSnapshot');
    this.companyId = props.companyId;
    this.overallScore = props.overallScore;
  }
}

export class AIRecommendationGenerated extends DomainEventBase {
  public readonly companyId: string;
  public readonly insightType: AIInsightType;

  public constructor(props: {
    recommendationId: string;
    companyId: string;
    insightType: AIInsightType;
  }) {
    super(props.recommendationId, 'AIRecommendation');
    this.companyId = props.companyId;
    this.insightType = props.insightType;
  }
}

export class AIInsightFeedbackSubmitted extends DomainEventBase {
  public readonly insightId: string;
  public readonly accepted: boolean;
  public readonly actingUserId: string;

  public constructor(props: {
    feedbackId: string;
    insightId: string;
    accepted: boolean;
    actingUserId: string;
  }) {
    super(props.feedbackId, 'AIInsightFeedback');
    this.insightId = props.insightId;
    this.accepted = props.accepted;
    this.actingUserId = props.actingUserId;
  }
}
