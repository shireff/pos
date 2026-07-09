import {
  Order,
  Return,
  ShiftSession,
} from '@packages/domain-sales';
import {
  StockMovementEventRepository,
  StockItemRepository,
  BatchRepository,
  WarehouseRepository,
} from '@packages/application-inventory';
import { TenderType } from '@packages/domain-sales';

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

export type { Order, Return, ShiftSession, TenderType };
