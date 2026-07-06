/**
 * StockEventType enumerates all possible stock movement types.
 * Each type maps to one appendable StockMovementEvent.
 */
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

/**
 * TransferStatus tracks the lifecycle of a stock transfer request.
 */
export type TransferStatus = 'requested' | 'approved' | 'shipped' | 'received' | 'cancelled';

/**
 * WeightReading from a connected scale peripheral.
 */
export interface WeightReading {
  grams: number;
  isStable: boolean;
}
