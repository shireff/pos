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

/** Port: ReceiptPrinter — implemented in infrastructure/hardware */
export interface ReceiptPrinter {
  print(receipt: {
    orderId: string;
    lines: Array<{ name: string; qty: number; unitPricePiasters: number }>;
    grandTotalPiasters: number;
    companyName: string;
    branchName: string;
    cashierId: string;
  }): Promise<{ success: boolean; fallbackRequired: boolean }>;
  isAvailable(): Promise<boolean>;
}

/** Port: CashDrawer — implemented in infrastructure/hardware */
export interface CashDrawer {
  open(): Promise<{ success: boolean }>;
}

/**
 * BarcodeScanner emits a raw decoded string when a barcode is read. The scanner
 * adapter's only job is to surface the decoded string; checksum validation and
 * duplicate detection happen at the UI/application layer (Hardware.md §3).
 */
export type Unsubscribe = () => void;

export interface BarcodeScanner {
  /** Begin listening; returns an unsubscribe function. */
  onScan(handler: (code: string) => void): Unsubscribe;
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
