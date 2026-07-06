import { Identifier } from '@packages/shared-kernel';
import { AIInsightType, AIProviderSource, AIRecommendationState } from '../value-objects';

/**
 * AIPrediction holds a deterministic numeric forecast plus an LLM-generated narrative.
 * The numeric value is NEVER produced by an LLM — only the narrative text is (BR-AI-002).
 */
export interface AIPredictionProps {
  id: string;
  companyId: string;
  branchId: string | null;
  insightType: AIInsightType;
  deterministicValue: number; // The actual predicted number (stats baseline, not LLM)
  deterministicUnit: string; // e.g. 'EGP', 'units', '%'
  narrativeText: string; // LLM-generated explanation only
  source: AIProviderSource;
  generatedAt: string;
  validUntil: string;
}

export class AIPrediction {
  public readonly id: string;
  public readonly companyId: string;
  public readonly branchId: string | null;
  public readonly insightType: AIInsightType;
  public readonly deterministicValue: number;
  public readonly deterministicUnit: string;
  public readonly narrativeText: string;
  public readonly source: AIProviderSource;
  public readonly generatedAt: string;
  public readonly validUntil: string;

  private constructor(props: AIPredictionProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.insightType = props.insightType;
    this.deterministicValue = props.deterministicValue;
    this.deterministicUnit = props.deterministicUnit;
    this.narrativeText = props.narrativeText;
    this.source = props.source;
    this.generatedAt = props.generatedAt;
    this.validUntil = props.validUntil;
  }

  public static create(props: Omit<AIPredictionProps, 'id'>): AIPrediction {
    return new AIPrediction({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: AIPredictionProps): AIPrediction {
    return new AIPrediction(props);
  }

  public isExpired(asOf: Date = new Date()): boolean {
    return new Date(this.validUntil) < asOf;
  }
}

/**
 * AIRecommendation tracks the full advisory lifecycle for an AI-generated suggestion.
 * State machine: generated → presented → accepted | rejected | expired (State_Machines.md §16).
 * A recommendation MUST be presented to a human before it can ever be accepted.
 * There is NO code path from generated → accepted directly (BR-AI-001).
 */
export interface AIRecommendationProps {
  id: string;
  companyId: string;
  insightType: AIInsightType;
  state: AIRecommendationState;
  payload: string; // JSON string describing the recommended action
  narrativeText: string;
  source: AIProviderSource;
  generatedAt: string;
  presentedAt: string | null;
  resolvedAt: string | null;
  expiresAt: string;
}

export class AIRecommendation {
  public readonly id: string;
  public readonly companyId: string;
  public readonly insightType: AIInsightType;
  private _state: AIRecommendationState;
  public readonly payload: string;
  public readonly narrativeText: string;
  public readonly source: AIProviderSource;
  public readonly generatedAt: string;
  private _presentedAt: string | null;
  private _resolvedAt: string | null;
  public readonly expiresAt: string;

  private constructor(props: AIRecommendationProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.insightType = props.insightType;
    this._state = props.state;
    this.payload = props.payload;
    this.narrativeText = props.narrativeText;
    this.source = props.source;
    this.generatedAt = props.generatedAt;
    this._presentedAt = props.presentedAt;
    this._resolvedAt = props.resolvedAt;
    this.expiresAt = props.expiresAt;
  }

  public static create(
    props: Omit<AIRecommendationProps, 'id' | 'state' | 'presentedAt' | 'resolvedAt'>,
  ): AIRecommendation {
    return new AIRecommendation({
      id: Identifier.generate(),
      state: 'generated',
      presentedAt: null,
      resolvedAt: null,
      ...props,
    });
  }

  public static reconstitute(props: AIRecommendationProps): AIRecommendation {
    return new AIRecommendation(props);
  }

  public get state(): AIRecommendationState {
    return this._state;
  }
  public get presentedAt(): string | null {
    return this._presentedAt;
  }
  public get resolvedAt(): string | null {
    return this._resolvedAt;
  }

  /** Mark as shown to a human — required before accept/reject is allowed. */
  public markPresented(): void {
    if (this._state !== 'generated')
      throw new Error('Recommendation must be in generated state to mark as presented');
    this._state = 'presented';
    this._presentedAt = new Date().toISOString();
  }

  /**
   * Accept — only valid after markPresented() has been called.
   * This triggers the corresponding domain command (e.g. UpdatePriceCommand)
   * in the application layer — it does NOT apply the change itself (BR-AI-001).
   */
  public accept(): void {
    if (this._state !== 'presented')
      throw new Error('Recommendation must be presented before it can be accepted');
    this._state = 'accepted';
    this._resolvedAt = new Date().toISOString();
  }

  public reject(): void {
    if (this._state !== 'presented')
      throw new Error('Recommendation must be presented before it can be rejected');
    this._state = 'rejected';
    this._resolvedAt = new Date().toISOString();
  }

  public expire(): void {
    if (this._state === 'presented') {
      this._state = 'expired';
      this._resolvedAt = new Date().toISOString();
    }
  }

  public isExpired(asOf: Date = new Date()): boolean {
    return new Date(this.expiresAt) < asOf;
  }
}
