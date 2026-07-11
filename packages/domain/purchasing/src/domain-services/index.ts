import { PurchaseOrder } from '../aggregates';
import { DiscrepancyType } from '../value-objects';

/**
 * POAutoApproveService decides whether a purchase order can skip the approval
 * workflow based on the company-configured threshold.
 */
export class POAutoApproveService {
  /**
   * @returns true when the PO total is at or below the threshold and the PO
   *          has at least one line (so it can transition straight to approved).
   */
  public static shouldAutoApprove(
    po: PurchaseOrder,
    thresholdPiasters: number,
  ): boolean {
    if (po.lines.length === 0) return false;
    return po.totalAmountPiasters <= thresholdPiasters;
  }
}

/**
 * PODiscrepancyChecker reports whether a received PO has any quantity
 * discrepancies between ordered and received quantities.
 */
export class PODiscrepancyChecker {
  public static hasDiscrepancy(po: PurchaseOrder): boolean {
    return po.lines.some((line) => line.discrepancy !== 0);
  }
}

export interface OcrExtractedLineItem {
  productName: string;
  quantity: number;
  unitPricePiasters: number;
}

export interface OcrExtractedData {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  lineItems: OcrExtractedLineItem[];
  totalAmountPiasters: number;
  confidence: number;
}

/**
 * OcrStubService returns deterministic mock extracted data for an uploaded
 * invoice image. Real OCR (Phase 15 / AI services) replaces this later.
 *
 * The output is a pure function of the input reference so the same upload
 * always yields the same extracted fields — important for reproducible tests.
 */
export class OcrStubService {
  public static extract(fileReference: string): OcrExtractedData {
    const seed = OcrStubService.hashString(fileReference);
    const suppliers = [
      'Al-Faisal Trading Co.',
      'Nile Wholesale Ltd.',
      'Delta Supplies',
      'Cairo Foods Dist.',
    ];
    const products = [
      'Rice 5kg',
      'Sugar 1kg',
      'Cooking Oil 1L',
      'Tea 500g',
      'Flour 2kg',
    ];

    const supplierName = suppliers[seed % suppliers.length];
    const invoiceNumber = `INV-${(1000 + (seed % 9000)).toString()}`;
    const day = ((seed % 27) + 1).toString().padStart(2, '0');
    const month = ((seed % 12) + 1).toString().padStart(2, '0');
    const invoiceDate = `2026-${month}-${day}`;

    const lineCount = 2 + (seed % 3); // 2..4
    const lineItems: OcrExtractedLineItem[] = [];
    let total = 0;
    for (let i = 0; i < lineCount; i++) {
      const product = products[(seed + i) % products.length];
      const quantity = 10 + ((seed + i * 7) % 90);
      const unitPrice = 500 + ((seed + i * 13) % 4500);
      lineItems.push({ productName: product, quantity, unitPricePiasters: unitPrice });
      total += quantity * unitPrice;
    }

    return {
      supplierName,
      invoiceNumber,
      invoiceDate,
      lineItems,
      totalAmountPiasters: total,
      confidence: 0.82 + ((seed % 15) / 100),
    };
  }

  private static hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  }
}

export {
  SupplierLedgerBalanceProjection,
} from './supplier-ledger-balance.service';

export {
  SupplierPerformanceService,
} from './supplier-performance.service';
