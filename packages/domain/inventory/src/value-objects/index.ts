export type StockEventType =
  | 'SALE'
  | 'RETURN'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT'
  | 'PURCHASE_RECEIPT'
  | 'EXPIRY_WRITE_OFF'
  | 'DAMAGE_WRITE_OFF'
  | 'BUNDLE_DEDUCTION'
  | 'CORRECTION';

export type TransferStatus = 'draft' | 'pending_approval' | 'approved' | 'shipped' | 'received' | 'cancelled';

export interface WeightReading {
  grams: number;
  isStable: boolean;
}
