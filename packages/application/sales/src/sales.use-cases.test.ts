import { describe, it, expect, vi } from 'vitest';
import {
  CreateSaleCommand,
  ProcessReturnCommand,
  type CreateSaleInput,
} from './use-cases';
import {
  OrderRepository,
  ReturnRepository,
  StockMovementEventRepository,
  StockItemRepository,
  BatchRepository,
} from '../ports';
import { Order } from '@packages/domain-sales';
import { TenderType } from '@packages/domain-sales';
import { StockItem } from '@packages/domain-inventory';

function inStock() {
  return StockItem.reconstitute({
    id: 'si-1',
    companyId: 'c1',
    productId: 'p1',
    variantId: 'v1',
    warehouseId: 'w1',
    batchId: null,
    quantityOnHand: 100,
    reservedQuantity: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    updatedFromSequence: 0,
  });
}

function makeOrderInput(overrides: Partial<CreateSaleInput> = {}): CreateSaleInput {
  return {
    companyId: 'c1',
    branchId: 'b1',
    cashierId: 'k1',
    warehouseId: 'w1',
    clientTxnId: 'txn-1',
    lines: [
      {
        productVariantId: 'v1',
        productId: 'p1',
        quantity: 1,
        unitPricePiasters: 10000,
        discountAmountPiasters: 0,
        taxAmountPiasters: 0,
      },
    ],
    payments: [{ tenderType: 'cash' as TenderType, amountPiasters: 10000 }],
    ...overrides,
  };
}

function mockRepos(overrides: {
  findByClientTxnId?: any;
  findById?: any;
} = {}) {
  const orderRepo = {
    findById: overrides.findById ?? vi.fn().mockResolvedValue(null),
    findByClientTxnId: overrides.findByClientTxnId ?? vi.fn().mockResolvedValue(null),
    findByCompany: vi.fn().mockResolvedValue([]),
    findByShiftSession: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as OrderRepository;

  const returnRepo = {
    findById: vi.fn().mockResolvedValue(null),
    findByOrder: vi.fn().mockResolvedValue([]),
    findPendingApproval: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnRepository;

  const stockMovementRepo = {
    append: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByWarehouseAndProduct: vi.fn().mockResolvedValue([]),
    findByProduct: vi.fn().mockResolvedValue([]),
    findSince: vi.fn().mockResolvedValue([]),
  } as unknown as StockMovementEventRepository;

  const stockItemRepo = {
    findByWarehouseAndProduct: vi.fn().mockResolvedValue(inStock()),
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

  return { orderRepo, returnRepo, stockMovementRepo, stockItemRepo, batchRepo };
}

describe('CreateSaleCommand', () => {
  it('records a completed order and deducts stock', async () => {
    const repos = mockRepos();
    const cmd = new CreateSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.batchRepo,
      null,
      null,
    );
    const { order } = await cmd.execute(makeOrderInput());
    expect(order.status).toBe('completed');
    expect(order.grandTotalPiasters).toBe(10000);
    expect(repos.orderRepo.save).toHaveBeenCalledTimes(1);
    expect(repos.stockMovementRepo.append).toHaveBeenCalledTimes(1);
  });

  it('enforces clientTxnId idempotency (BR-SAL-001)', async () => {
    const existing = Order.complete({
      companyId: 'c1',
      branchId: 'b1',
      cashierId: 'k1',
      clientTxnId: 'txn-1',
      subtotalPiasters: 10000,
      discountTotalPiasters: 0,
      taxTotalPiasters: 0,
      grandTotalPiasters: 10000,
      lines: [
        { productVariantId: 'v1', batchId: null, quantity: 1, unitPricePiasters: 10000, discountAmountPiasters: 0, taxAmountPiasters: 0, costSnapshotPiasters: 0 },
      ],
      payments: [{ tenderType: 'cash', amountPiasters: 10000, providerReference: null }],
    });
    const repos = mockRepos({ findByClientTxnId: vi.fn().mockResolvedValue(existing) });
    const cmd = new CreateSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.batchRepo,
      null,
      null,
    );
    await expect(cmd.execute(makeOrderInput())).rejects.toThrow(/already exists/);
  });
});

describe('ProcessReturnCommand (BR-SAL-005)', () => {
  function completedOrder() {
    return Order.complete({
      companyId: 'c1',
      branchId: 'b1',
      cashierId: 'k1',
      clientTxnId: 'txn-r',
      customerId: 'cust-1',
      subtotalPiasters: 10000,
      discountTotalPiasters: 0,
      taxTotalPiasters: 0,
      grandTotalPiasters: 10000,
      lines: [
        { productVariantId: 'v1', batchId: null, quantity: 1, unitPricePiasters: 10000, discountAmountPiasters: 0, taxAmountPiasters: 0, costSnapshotPiasters: 0 },
      ],
      payments: [{ tenderType: 'cash', amountPiasters: 10000, providerReference: null }],
    });
  }

  it('auto-approves and reverses inventory below threshold', async () => {
    const repos = mockRepos({ findById: vi.fn().mockResolvedValue(completedOrder()) });
    const cmd = new ProcessReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      null,
    );
    const { returnEntity, autoApproved } = await cmd.execute({
      companyId: 'c1',
      orderId: 'o1',
      returnedByUserId: 'k1',
      reason: 'customer changed mind',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 10000,
      lines: [
        {
          orderLineId: completedOrder().lines[0].id,
          productVariantId: 'v1',
          productId: 'p1',
          returnQuantity: 1,
          refundAmountPiasters: 10000,
        },
      ],
    });
    expect(autoApproved).toBe(true);
    expect(returnEntity.status).toBe('approved');
    expect(repos.stockMovementRepo.append).toHaveBeenCalled();
  });

  it('requires approval above threshold', async () => {
    const repos = mockRepos({ findById: vi.fn().mockResolvedValue(completedOrder()) });
    const cmd = new ProcessReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      null,
    );
    const { returnEntity, autoApproved } = await cmd.execute({
      companyId: 'c1',
      orderId: 'o1',
      returnedByUserId: 'k1',
      reason: 'customer changed mind',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 5000,
      lines: [
        {
          orderLineId: completedOrder().lines[0].id,
          productVariantId: 'v1',
          productId: 'p1',
          returnQuantity: 1,
          refundAmountPiasters: 10000,
        },
      ],
    });
    expect(autoApproved).toBe(false);
    expect(returnEntity.status).toBe('pending_approval');
  });
});
