import { Identifier } from '@packages/shared-kernel';
import { ETASubmissionStatus, PriceChangeStatus, TaxAppliesTo } from '../value-objects';

// ─── TaxRule ──────────────────────────────────────────────────────────────────

export interface TaxRuleProps {
  id: string;
  companyId: string;
  name: string;
  rateBasisPoints: number;
  appliesTo: TaxAppliesTo;
  scopeIds: string[];
  priority: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class TaxRule {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _rateBasisPoints: number;
  private _appliesTo: TaxAppliesTo;
  private _scopeIds: string[];
  private _priority: number;
  private _isActive: boolean;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: TaxRuleProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._rateBasisPoints = props.rateBasisPoints;
    this._appliesTo = props.appliesTo;
    this._scopeIds = [...props.scopeIds];
    this._priority = props.priority;
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<TaxRuleProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): TaxRule {
    if (props.rateBasisPoints < 0 || props.rateBasisPoints > 10000)
      throw new Error('Tax rate (basis points) must be between 0 and 10000');
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
  public get rateBasisPoints(): number {
    return this._rateBasisPoints;
  }
  public get ratePercent(): number {
    return this._rateBasisPoints / 100;
  }
  public get appliesTo(): TaxAppliesTo {
    return this._appliesTo;
  }
  public get scopeIds(): readonly string[] {
    return this._scopeIds;
  }
  public get priority(): number {
    return this._priority;
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
    return Math.round(subtotalPiasters * this._rateBasisPoints / 10000);
  }

  public update(fields: Partial<Pick<TaxRuleProps, 'name' | 'rateBasisPoints' | 'scopeIds' | 'priority'>>): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.rateBasisPoints !== undefined) {
      if (fields.rateBasisPoints < 0 || fields.rateBasisPoints > 10000)
        throw new Error('Tax rate (basis points) must be between 0 and 10000');
      this._rateBasisPoints = fields.rateBasisPoints;
    }
    if (fields.scopeIds !== undefined) this._scopeIds = [...fields.scopeIds];
    if (fields.priority !== undefined) this._priority = fields.priority;
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

// ─── PriceChange ──────────────────────────────────────────────────────────────

export interface PriceChangeProps {
  id: string;
  companyId: string;
  productId: string;
  variantId: string | null;
  oldPricePiasters: number;
  newPricePiasters: number;
  requestedByUserId: string;
  approvedByUserId: string | null;
  status: PriceChangeStatus;
  notes: string | null;
  requestedAt: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PriceChange {
  public readonly id: string;
  public readonly companyId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly oldPricePiasters: number;
  private _newPricePiasters: number;
  public readonly requestedByUserId: string;
  private _approvedByUserId: string | null;
  private _status: PriceChangeStatus;
  public readonly notes: string | null;
  public readonly requestedAt: string;
  private _approvedAt: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: PriceChangeProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.oldPricePiasters = props.oldPricePiasters;
    this._newPricePiasters = props.newPricePiasters;
    this.requestedByUserId = props.requestedByUserId;
    this._approvedByUserId = props.approvedByUserId;
    this._status = props.status;
    this.notes = props.notes;
    this.requestedAt = props.requestedAt;
    this._approvedAt = props.approvedAt;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<PriceChangeProps, 'id' | 'status' | 'approvedByUserId' | 'approvedAt' | 'createdAt' | 'updatedAt'>,
  ): PriceChange {
    if (props.newPricePiasters <= 0) throw new Error('New price must be positive');
    if (props.oldPricePiasters < 0) throw new Error('Old price must be non-negative');
    const now = new Date().toISOString();
    return new PriceChange({
      id: Identifier.generate(),
      status: 'pending_approval',
      approvedByUserId: null,
      approvedAt: null,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: PriceChangeProps): PriceChange {
    return new PriceChange(props);
  }

  public get newPricePiasters(): number {
    return this._newPricePiasters;
  }
  public get approvedByUserId(): string | null {
    return this._approvedByUserId;
  }
  public get status(): PriceChangeStatus {
    return this._status;
  }
  public get approvedAt(): string | null {
    return this._approvedAt;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public approve(approverId: string): void {
    if (this._status !== 'pending_approval') throw new Error('Price change is not pending approval');
    this._status = 'approved';
    this._approvedByUserId = approverId;
    this._approvedAt = new Date().toISOString();
    this._updatedAt = this._approvedAt;
  }

  public reject(): void {
    if (this._status !== 'pending_approval') throw new Error('Price change is not pending approval');
    this._status = 'rejected';
    this._approvedByUserId = null;
    this._approvedAt = new Date().toISOString();
    this._updatedAt = this._approvedAt;
  }
}
