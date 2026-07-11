/** A single line rendered on the receipt. */
export interface ReceiptLine {
  name: string;
  qty: number;
  unitPricePiasters: number;
}

/** Language-agnostic payload produced by the application/UI layer. */
export interface ReceiptPayload {
  orderId: string;
  lines: ReceiptLine[];
  grandTotalPiasters: number;
  taxPiasters?: number;
  discountPiasters?: number;
  companyName: string;
  branchName: string;
  cashierId: string;
  createdAt?: string;
}

/** Result of a print attempt. */
export interface PrintResult {
  /** True when the physical (or simulated) print succeeded. */
  success: boolean;
  /** True when the caller should show a digital receipt instead. */
  fallbackRequired: boolean;
}
