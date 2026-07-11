export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'partially_received'
  | 'fully_received'
  | 'cancelled';

export type DiscrepancyType =
  | 'quantity_shortage'
  | 'quality_rejection'
  | 'wrong_item';

export type SupplierInvoiceStatus = 'pending' | 'matched' | 'disputed';

export const RECEIVED_STATUSES: ReadonlySet<PurchaseOrderStatus> = new Set([
  'partially_received',
  'fully_received',
]);

export const TERMINAL_STATUSES: ReadonlySet<PurchaseOrderStatus> = new Set([
  'fully_received',
  'cancelled',
]);

// ─── Discrepancy (value object) ───────────────────────────────────────────────

export interface DiscrepancyProps {
  type: DiscrepancyType;
  expectedQuantity: number;
  actualQuantity: number;
  notes: string;
}

export class Discrepancy {
  public readonly type: DiscrepancyType;
  public readonly expectedQuantity: number;
  public readonly actualQuantity: number;
  public readonly notes: string;

  private constructor(props: DiscrepancyProps) {
    if (props.expectedQuantity < 0) throw new Error('Expected quantity cannot be negative');
    if (props.actualQuantity < 0) throw new Error('Actual quantity cannot be negative');
    if (props.expectedQuantity < props.actualQuantity) {
      throw new Error('Discrepancy expected quantity must be >= actual quantity');
    }
    this.type = props.type;
    this.expectedQuantity = props.expectedQuantity;
    this.actualQuantity = props.actualQuantity;
    this.notes = props.notes;
  }

  public static create(props: DiscrepancyProps): Discrepancy {
    return new Discrepancy(props);
  }

  public get variance(): number {
    return this.expectedQuantity - this.actualQuantity;
  }
}

export { SupplierContact } from './supplier-contact.vo';
