import { vi } from 'vitest';
import { StockItem } from '@packages/domain-inventory';
import { Order, Return, ShiftSession } from '@packages/domain-sales';
import type {
  OrderRepository,
  ReturnRepository,
  ShiftSessionRepository,
  LoyaltyPort,
  BundleResolutionPort,
  StockMovementEventRepository,
  StockItemRepository,
  BatchRepository,
} from './ports';

const SALE_EVENT = 'SALE';
const RETURN_EVENT = 'RETURN';

export function makeStockItem(quantityOnHand = 100): StockItem {
  return StockItem.reconstitute({
    id: 'si-1',
    companyId: 'c1',
    productId: 'p1',
    variantId: 'v1',
    warehouseId: 'w1',
    batchId: null,
    quantityOnHand,
    reservedQuantity: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    updatedFromSequence: 0,
  });
}

interface RepoOverrides {
  findByClientTxnId?: unknown;
  findOrderById?: unknown;
  findReturnById?: unknown;
  stockOnHand?: number;
}

export interface MockRepos {
  orderRepo: OrderRepository;
  returnRepo: ReturnRepository;
  shiftRepo: ShiftSessionRepository;
  stockMovementRepo: StockMovementEventRepository;
  stockItemRepo: StockItemRepository;
  batchRepo: BatchRepository;
  loyaltyPort: LoyaltyPort;
  bundlePort: BundleResolutionPort;
  appendedEvents: unknown[];
}

export function makeRepos(overrides: RepoOverrides = {}): MockRepos {
  const appendedEvents: unknown[] = [];
  const orderStore = new Map<string, unknown>();
  const clientTxnIndex = new Map<string, string>();
  const orderRepo = {
    save: vi.fn((o: { id: string; clientTxnId: string }) => {
      orderStore.set(o.id, o);
      clientTxnIndex.set(o.clientTxnId, o.id);
      return Promise.resolve(undefined);
    }),
    findById:
      overrides.findOrderById !== undefined
        ? vi.fn().mockResolvedValue(overrides.findOrderById)
        : vi.fn((id: string) => Promise.resolve(orderStore.get(id) ?? null)),
    findByClientTxnId:
      overrides.findByClientTxnId !== undefined
        ? vi.fn().mockResolvedValue(overrides.findByClientTxnId)
        : vi.fn((txn: string) => Promise.resolve(orderStore.get(clientTxnIndex.get(txn) ?? '') ?? null)),
    findByCompany: vi.fn().mockResolvedValue([]),
    findByShiftSession: vi.fn().mockResolvedValue([]),
  } as unknown as OrderRepository;

  const returnRepo = {
    findById: vi.fn().mockResolvedValue(overrides.findReturnById ?? null),
    findByOrder: vi.fn().mockResolvedValue([]),
    findPendingApproval: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnRepository;

  const shiftRepo = {
    findById: vi.fn().mockResolvedValue(null),
    findOpenForCashier: vi.fn().mockResolvedValue(null),
    findByCashier: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as ShiftSessionRepository;

  const stockMovementRepo = {
    append: vi.fn((e: unknown) => {
      appendedEvents.push(e);
      return Promise.resolve(undefined);
    }),
    findById: vi.fn().mockResolvedValue(null),
    findByWarehouseAndProduct: vi.fn().mockResolvedValue([]),
    findByProduct: vi.fn().mockResolvedValue([]),
    findSince: vi.fn().mockResolvedValue([]),
  } as unknown as StockMovementEventRepository;

  const stockItemRepo = {
    findByWarehouseAndProduct: vi.fn().mockResolvedValue(makeStockItem(overrides.stockOnHand ?? 100)),
    findByWarehouse: vi.fn().mockResolvedValue([]),
    findByCompany: vi.fn().mockResolvedValue([]),
    findBelowReorderPoint: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as StockItemRepository;

  const batchRepo = {
    findById: vi.fn().mockResolvedValue(null),
    findByVariantAndWarehouse: vi.fn().mockResolvedValue([]),
    findExpiring: vi.fn().mockResolvedValue([]),
    findExpired: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as BatchRepository;

  const loyaltyPort: LoyaltyPort = {
    accrueOnSale: vi.fn().mockResolvedValue(undefined),
    reverseOnReturn: vi.fn().mockResolvedValue(undefined),
  };

  const bundlePort: BundleResolutionPort = {
    resolveComponents: vi.fn().mockResolvedValue([]),
  };

  return {
    orderRepo,
    returnRepo,
    shiftRepo,
    stockMovementRepo,
    stockItemRepo,
    batchRepo,
    loyaltyPort,
    bundlePort,
    appendedEvents,
  };
}

export function completedOrder(overrides: Partial<{
  id: string;
  clientTxnId: string;
  shiftSessionId: string | null;
  lines: Array<{ productVariantId: string; batchId: string | null; quantity: number; unitPricePiasters: number; discountAmountPiasters: number; taxAmountPiasters: number; costSnapshotPiasters: number }>;
  payments: Array<{ tenderType: 'cash' | 'card'; amountPiasters: number; providerReference: string | null }>;
  customerId: string | null;
}> = {}): Order {
  return Order.complete({
    companyId: 'c1',
    branchId: 'b1',
    cashierId: 'k1',
    clientTxnId: overrides.clientTxnId ?? 'txn-r',
    customerId: overrides.customerId ?? 'cust-1',
    shiftSessionId: overrides.shiftSessionId ?? null,
    subtotalPiasters: 10000,
    discountTotalPiasters: 0,
    taxTotalPiasters: 0,
    grandTotalPiasters: 10000,
    lines: overrides.lines ?? [
      { productVariantId: 'v1', batchId: null, quantity: 1, unitPricePiasters: 10000, discountAmountPiasters: 0, taxAmountPiasters: 0, costSnapshotPiasters: 0 },
    ],
    payments: overrides.payments ?? [{ tenderType: 'cash', amountPiasters: 10000, providerReference: null }],
  });
}

export const EVENT_TYPES = { SALE_EVENT, RETURN_EVENT };
