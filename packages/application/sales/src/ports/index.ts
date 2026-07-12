import {
  Order,
  Return,
  ShiftSession,
  Payment,
  PaymentMethod,
  PaymentTransaction,
  TenderType,
  PaymentTransactionStatus,
} from '@packages/domain-sales';
import {
  StockMovementEventRepository,
  StockItemRepository,
  BatchRepository,
  WarehouseRepository,
} from '@packages/application-inventory';
import { DiscountRepository } from '@packages/application-promotions';
import { CouponRepository } from '@packages/application-promotions';
import { TaxRuleRepository } from '@packages/application-tax';

export type { StockMovementEventRepository, StockItemRepository, BatchRepository, WarehouseRepository };

export interface OrderFilter {
  branchId?: string;
  cashierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderRepository {
  findById(id: string, companyId: string): Promise<Order | null>;
  findByClientTxnId(clientTxnId: string, companyId: string): Promise<Order | null>;
  findByCompany(companyId: string, filter?: OrderFilter): Promise<Order[]>;
  findByShiftSession(shiftSessionId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
}

export interface ReturnRepository {
  findById(id: string): Promise<Return | null>;
  findByOrder(orderId: string): Promise<Return[]>;
  findPendingApproval(companyId: string): Promise<Return[]>;
  save(returnEntity: Return): Promise<void>;
}

export interface ShiftSessionRepository {
  findById(id: string): Promise<ShiftSession | null>;
  findOpenForCashier(companyId: string, branchId: string, cashierId: string): Promise<ShiftSession | null>;
  findByCashier(companyId: string, cashierId: string): Promise<ShiftSession[]>;
  save(session: ShiftSession): Promise<void>;
}

export interface PaymentTransactionRepository {
  findById(id: string): Promise<PaymentTransaction | null>;
  findByOrder(orderId: string): Promise<PaymentTransaction[]>;
  findByCompanyAndDateRange(companyId: string, from: string, to: string): Promise<PaymentTransaction[]>;
  save(transaction: PaymentTransaction): Promise<void>;
}

export interface PaymentMethodRepository {
  findByCompany(companyId: string): Promise<PaymentMethod[]>;
  findById(id: string): Promise<PaymentMethod | null>;
  save(method: PaymentMethod): Promise<void>;
}

/**
 * LoyaltyPort bridges to the CRM / loyalty bounded context (Phase 08).
 * Implementations accrue points on sale and reverse them on approved return.
 */
export interface LoyaltyPort {
  accrueOnSale(params: {
    orderId: string;
    customerId: string;
    grandTotalPiasters: number;
  }): Promise<void>;
  reverseOnReturn(params: {
    returnId: string;
    customerId: string;
    originalOrderId: string;
    pointsToReverse: number;
  }): Promise<void>;
}

/**
 * BundleResolutionPort resolves a bundle product into its component products so
 * that stock can be deducted for each component atomically (BR-SAL-008).
 */
export interface BundleResolutionPort {
  resolveComponents(productVariantId: string): Promise<
    Array<{ productId: string; variantId: string | null; quantity: number; deductionRatio: number }>
  >;
}

/** Result returned by every print attempt (Hardware.md §2). */
export interface PrintResult {
  /** True when the physical (or simulated) print succeeded. */
  success: boolean;
  /** True when the caller should show a digital receipt instead. */
  fallbackRequired: boolean;
}

/** Runtime status of a receipt printer (Hardware.md §2). */
export interface PrinterStatus {
  connected: boolean;
  isNoop: boolean;
  reason?: string;
}

/** Language-agnostic payload produced by the application/UI layer. */
export interface ReceiptPayload {
  orderId: string;
  lines: Array<{ name: string; qty: number; unitPricePiasters: number }>;
  grandTotalPiasters: number;
  companyName: string;
  branchName: string;
  cashierId: string;
  taxPiasters?: number;
  discountPiasters?: number;
  /** Egyptian tax registration number, printed on the receipt footer. */
  taxRegistrationNumber?: string;
  /** 'ar' switches the template to RTL + Arabic code page (Hardware.md §2). */
  language?: 'ar' | 'en';
  createdAt?: string;
}

/** Port: ReceiptPrinter — implemented in infrastructure/hardware */
export interface ReceiptPrinter {
  print(receipt: ReceiptPayload): Promise<PrintResult>;
  /** Prints a self-test slip; same result contract as print(). */
  testPrint(): Promise<PrintResult>;
  /** Reports connectivity so the UI can surface a status badge. */
  getStatus(): Promise<PrinterStatus>;
  isAvailable(): Promise<boolean>;
}

/** Result of a cash-drawer open pulse (Hardware.md §4). */
export interface DrawerResult {
  success: boolean;
}

/** Runtime status of a cash drawer (Hardware.md §4). */
export interface DrawerStatus {
  connected: boolean;
  isNoop: boolean;
  reason?: string;
}

/** Port: CashDrawer — implemented in infrastructure/hardware */
export interface CashDrawer {
  open(): Promise<DrawerResult>;
  getStatus(): Promise<DrawerStatus>;
}

/**
 * BarcodeScanner surfaces a decoded scan as a ScanResult. The scanner adapter's
 * only job is to surface the decoded value; checksum validation and duplicate
 * detection happen at the UI/application layer (Hardware.md §3).
 */
export type Unsubscribe = () => void;

export interface ScanResult {
  code: string;
  timestamp: number;
}

export interface ScanOptions {
  /** Keystroke prefixes that mark the start of a HID wedge scan. */
  prefixes?: string[];
  /** Keystroke suffixes that terminate a HID wedge scan (default: Enter). */
  suffixes?: string[];
  /** Auto-stop after this many ms of inactivity. */
  timeoutMs?: number;
}

export interface BarcodeScanner {
  startScan(options?: ScanOptions): void;
  stopScan(): void;
  onScanResult(callback: (result: ScanResult) => void): Unsubscribe;
}

/** A single weight reading from a scale (Hardware.md §5). */
export interface WeightReading {
  grams: number;
  unit: string;
  /** Stable readings are the only ones a sale should accept (BR-HW-004). */
  isStable: boolean;
}

/** Port: Scale — implemented in infrastructure/hardware */
export interface Scale {
  /** Returns the latest reading, or null when the scale is disconnected. */
  readWeight(): Promise<WeightReading | null>;
  tare(): Promise<void>;
  getStatus(): Promise<{ connected: boolean; isNoop: boolean }>;
}

export type {
  Order,
  Return,
  ShiftSession,
  Payment,
  PaymentMethod,
  PaymentTransaction,
  TenderType,
  PaymentTransactionStatus,
};

export type { DiscountRepository, CouponRepository, TaxRuleRepository };
