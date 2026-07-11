import { Identifier } from '@packages/shared-kernel';

export interface SupplierLedgerEntryProps {
  id: string;
  supplierId: string;
  companyId: string;
  eventType: 'invoice' | 'payment' | 'credit_note' | 'return_debit' | 'adjustment';
  amountPiasters: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
}

export class SupplierLedgerEntry {
  public readonly id: string;
  public readonly supplierId: string;
  public readonly companyId: string;
  public readonly eventType: 'invoice' | 'payment' | 'credit_note' | 'return_debit' | 'adjustment';
  public readonly amountPiasters: number;
  public readonly referenceType: string | null;
  public readonly referenceId: string | null;
  public readonly notes: string | null;
  public readonly occurredAt: string;
  public readonly createdAt: string;

  private constructor(props: SupplierLedgerEntryProps) {
    this.id = props.id;
    this.supplierId = props.supplierId;
    this.companyId = props.companyId;
    this.eventType = props.eventType;
    this.amountPiasters = props.amountPiasters;
    this.referenceType = props.referenceType;
    this.referenceId = props.referenceId;
    this.notes = props.notes;
    this.occurredAt = props.occurredAt;
    this.createdAt = props.createdAt;
  }

  public static create(props: Omit<SupplierLedgerEntryProps, 'id' | 'createdAt'>): SupplierLedgerEntry {
    const now = new Date().toISOString();
    return new SupplierLedgerEntry({
      id: Identifier.generate(),
      ...props,
      createdAt: now,
    });
  }

  public static reconstitute(props: SupplierLedgerEntryProps): SupplierLedgerEntry {
    return new SupplierLedgerEntry(props);
  }
}
