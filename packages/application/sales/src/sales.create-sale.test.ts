import { describe, it, expect, vi } from 'vitest';
import { CreateSaleCommand, type CreateSaleInput } from './use-cases';
import { Batch } from '@packages/domain-inventory';
import { OrderCompleted } from '@packages/domain-sales';
import { makeRepos, completedOrder, makeStockItem } from './sales.test-support';

function baseInput(overrides: Partial<CreateSaleInput> = {}): CreateSaleInput {
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
    payments: [{ tenderType: 'cash', amountPiasters: 10000 }],
    ...overrides,
  };
}

function build(repos: ReturnType<typeof makeRepos>): CreateSaleCommand {
  return new CreateSaleCommand(
    repos.orderRepo,
    repos.stockMovementRepo,
    repos.stockItemRepo,
    repos.batchRepo,
    repos.bundlePort,
    repos.loyaltyPort,
  );
}

describe('CreateSaleCommand — sales/create-sale.test.ts', () => {
  it('completes with sufficient stock and emits one SALE event per line', async () => {
    const repos = makeRepos();
    const { order, events } = await build(repos).execute(baseInput());
    expect(order.status).toBe('completed');
    expect(repos.stockMovementRepo.append).toHaveBeenCalledTimes(1);
    const event = repos.appendedEvents[0] as { eventType: string };
    expect(event.eventType).toBe('SALE');
    expect(events.some((e) => e instanceof OrderCompleted)).toBe(true);
  });

  it('blocks with insufficient stock (never oversells silently)', async () => {
    const repos = makeRepos({ stockOnHand: 0 });
    await expect(build(repos).execute(baseInput())).rejects.toThrow(/stock/i);
    expect(repos.orderRepo.save).not.toHaveBeenCalled();
  });

  it('blocks split-tender sum != grand_total (BR-SAL-003)', async () => {
    const repos = makeRepos();
    await expect(
      build(repos).execute(
        baseInput({ payments: [{ tenderType: 'cash', amountPiasters: 9999 }] }),
      ),
    ).rejects.toThrow(/Tender sum/);
  });

  it('clientTxnId replay returns the existing order instead of duplicating', async () => {
    const existing = completedOrder({ clientTxnId: 'txn-1' });
    const repos = makeRepos({ findByClientTxnId: existing });
    const cmd = build(repos);
    await expect(cmd.execute(baseInput())).rejects.toThrow(/already exists/);
    expect(repos.stockMovementRepo.append).not.toHaveBeenCalled();
  });

  it('bundle sale with all components sufficient emits a deduction event per component', async () => {
    const repos = makeRepos();
    repos.bundlePort.resolveComponents = vi
      .fn()
      .mockResolvedValue([
        { productId: 'comp-a', variantId: null, quantity: 2, deductionRatio: 0.5 },
        { productId: 'comp-b', variantId: null, quantity: 2, deductionRatio: 0.5 },
      ]);
    const { order } = await build(repos).execute(
      baseInput({
        lines: [
          { productVariantId: 'bundle-1', productId: 'bundle-1', isBundle: true, quantity: 1, unitPricePiasters: 10000 },
        ],
      }),
    );
    expect(order.status).toBe('completed');
    expect(repos.stockMovementRepo.append).toHaveBeenCalledTimes(2);
  });

  it('bundle sale with one insufficient component is blocked and identifies the component', async () => {
    const repos = makeRepos();
    repos.bundlePort.resolveComponents = vi
      .fn()
      .mockResolvedValue([
        { productId: 'comp-a', variantId: null, quantity: 2, deductionRatio: 0.5 },
        { productId: 'comp-b', variantId: null, quantity: 2, deductionRatio: 0.5 },
      ]);
    repos.stockItemRepo.findByWarehouseAndProduct = vi.fn().mockImplementation((_w: string, p: string) =>
      Promise.resolve(p === 'comp-b' ? makeStockItem(0) : makeStockItem(10)),
    );
    await expect(
      build(repos).execute(
        baseInput({
          lines: [
            { productVariantId: 'bundle-1', productId: 'bundle-1', isBundle: true, quantity: 1, unitPricePiasters: 10000 },
          ],
        }),
      ),
    ).rejects.toThrow(/stock/i);
  });

  it('blocks a sale from an expired batch (BR-INV-008)', async () => {
    const repos = makeRepos();
    const expired = Batch.reconstitute({
      id: 'batch-x',
      companyId: 'c1',
      productId: 'p1',
      variantId: 'v1',
      warehouseId: 'w1',
      batchNumber: 'B1',
      expiryDate: '2000-01-01T00:00:00Z',
      manufacturingDate: null,
      costPrice: 0,
      quantityRemaining: 10,
      isDeleted: false,
    });
    repos.batchRepo.findById = vi.fn().mockResolvedValue(expired);
    await expect(
      build(repos).execute(
        baseInput({
          lines: [
            { productVariantId: 'v1', productId: 'p1', batchId: 'batch-x', quantity: 1, unitPricePiasters: 10000 },
          ],
        }),
      ),
    ).rejects.toThrow(/expired/i);
  });
});
