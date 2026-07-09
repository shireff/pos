import { Identifier } from '@packages/shared-kernel';
import { CreditEventType } from '../value-objects';

export interface CreditLedgerEntryProps {
  id: string;
  companyId: string;
  customerId: string;
  eventType: CreditEventType;
  amountPiasters: number;
  referenceType: string | null;
  referenceId: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  occurredAt: string;
  createdAt: string;
}

export class CreditLedgerEntry {
  public readonly id: string;
  public readonly companyId: string;
  public readonly customerId: string;
  public readonly eventType: CreditEventType;
  public readonly amountPiasters: number;
  public readonly referenceType: string | null;
  public readonly referenceId: string | null;
  public readonly paymentMethod: string | null;
  public readonly referenceNumber: string | null;
  public readonly occurredAt: string;
  public readonly createdAt: string;

  private constructor(props: CreditLedgerEntryProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.customerId = props.customerId;
    this.eventType = props.eventType;
    this.amountPiasters = props.amountPiasters;
    this.referenceType = props.referenceType;
    this.referenceId = props.referenceId;
    this.paymentMethod = props.paymentMethod;
    this.referenceNumber = props.referenceNumber;
    this.occurredAt = props.occurredAt;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    companyId: string;
    customerId: string;
    eventType: CreditEventType;
    amountPiasters: number;
    referenceType?: string | null;
    referenceId?: string | null;
    paymentMethod?: string | null;
    referenceNumber?: string | null;
    occurredAt?: string;
  }): CreditLedgerEntry {
    return new CreditLedgerEntry({
      id: Identifier.generate(),
      companyId: props.companyId,
      customerId: props.customerId,
      eventType: props.eventType,
      amountPiasters: props.amountPiasters,
      referenceType: props.referenceType ?? null,
      referenceId: props.referenceId ?? null,
      paymentMethod: props.paymentMethod ?? null,
      referenceNumber: props.referenceNumber ?? null,
      occurredAt: props.occurredAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  public static reconstitute(props: CreditLedgerEntryProps): CreditLedgerEntry {
    return new CreditLedgerEntry(props);
  }
}
