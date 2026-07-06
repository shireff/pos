import { Identifier } from '@packages/shared-kernel';
import { ETASubmissionStatus, TaxAppliesTo } from '../value-objects';

// ─── TaxRule ──────────────────────────────────────────────────────────────────

export interface TaxRuleProps {
  id: string;
  companyId: string;
  name: string;
  ratePercent: number; // e.g. 14 for 14% VAT
  appliesTo: TaxAppliesTo;
  scopeIds: string[]; // categoryIds or productVariantIds depending on appliesTo
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class TaxRule {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _ratePercent: number;
  private _appliesTo: TaxAppliesTo;
  private _scopeIds: string[];
  private _isActive: boolean;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: TaxRuleProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._ratePercent = props.ratePercent;
    this._appliesTo = props.appliesTo;
    this._scopeIds = [...props.scopeIds];
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<TaxRuleProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): TaxRule {
    if (props.ratePercent < 0 || props.ratePercent > 100)
      throw new Error('Tax rate must be between 0 and 100');
    const now = new Date().toISOString();
    return new TaxRule({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: TaxRuleProps): TaxRule {
    return new TaxRule(props);
  }

  public get name(): string {
    return this._name;
  }
  public get ratePercent(): number {
    return this._ratePercent;
  }
  public get appliesTo(): TaxAppliesTo {
    return this._appliesTo;
  }
  public get scopeIds(): readonly string[] {
    return this._scopeIds;
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public calculateTax(subtotalPiasters: number): number {
    return Math.round(subtotalPiasters * (this._ratePercent / 100));
  }

  public update(fields: Partial<Pick<TaxRuleProps, 'name' | 'ratePercent' | 'scopeIds'>>): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.ratePercent !== undefined) {
      if (fields.ratePercent < 0 || fields.ratePercent > 100)
        throw new Error('Tax rate must be between 0 and 100');
      this._ratePercent = fields.ratePercent;
    }
    if (fields.scopeIds !== undefined) this._scopeIds = [...fields.scopeIds];
    this._updatedAt = new Date().toISOString();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date().toISOString();
  }
  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date().toISOString();
  }
  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}

// ─── ETAInvoice ───────────────────────────────────────────────────────────────

export interface ETAInvoiceProps {
  id: string;
  orderId: string;
  etaUuid: string | null;
  submissionStatus: ETASubmissionStatus;
  payloadJson: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ETAInvoice {
  public readonly id: string;
  public readonly orderId: string;
  private _etaUuid: string | null;
  private _submissionStatus: ETASubmissionStatus;
  private _payloadJson: string;
  private _submittedAt: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: ETAInvoiceProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this._etaUuid = props.etaUuid;
    this._submissionStatus = props.submissionStatus;
    this._payloadJson = props.payloadJson;
    this._submittedAt = props.submittedAt;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(orderId: string, payloadJson: string): ETAInvoice {
    const now = new Date().toISOString();
    return new ETAInvoice({
      id: Identifier.generate(),
      orderId,
      etaUuid: null,
      submissionStatus: 'pending',
      payloadJson,
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: ETAInvoiceProps): ETAInvoice {
    return new ETAInvoice(props);
  }

  public get etaUuid(): string | null {
    return this._etaUuid;
  }
  public get submissionStatus(): ETASubmissionStatus {
    return this._submissionStatus;
  }
  public get payloadJson(): string {
    return this._payloadJson;
  }
  public get submittedAt(): string | null {
    return this._submittedAt;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public markSubmitted(etaUuid: string): void {
    this._etaUuid = etaUuid;
    this._submissionStatus = 'submitted';
    this._submittedAt = new Date().toISOString();
    this._updatedAt = this._submittedAt;
  }

  public markFailed(): void {
    this._submissionStatus = 'failed';
    this._updatedAt = new Date().toISOString();
  }
}
