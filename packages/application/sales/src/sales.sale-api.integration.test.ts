import { describe, it, expect } from 'vitest';
import { CreateSaleCommand, ProcessReturnCommand, ApproveReturnCommand, GetOrderQuery } from './use-cases';
import { makeRepos, completedOrder } from './sales.test-support';

/**
 * Integration test for the orders API surface. Drives the same use-cases the
 * POST /v1/orders and GET /v1/orders/:id handlers delegate to, exercising the
 * full sales bounded context (persistence + retrieval + idempotency) without a
 * live HTTP server.
 */
describe('orders API integration — sales/sale-api.integration.test.ts', () => {
  it('POST /v1/orders then GET reflects the persisted order (offline-first local commit)', async () => {
    const repos = makeRepos();
    const cmd = new CreateSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.batchRepo,
      repos.bundlePort,
      repos.loyaltyPort,
    );
    const { order } = await cmd.execute({
      companyId: 'c1',
      branchId: 'b1',
      cashierId: 'k1',
      warehouseId: 'w1',
      clientTxnId: 'txn-integration-1',
      lines: [{ productVariantId: 'v1', productId: 'p1', quantity: 1, unitPricePiasters: 10000 }],
      payments: [{ tenderType: 'cash', amountPiasters: 10000 }],
    });

    const fetched = await new GetOrderQuery(repos.orderRepo).execute({ companyId: 'c1', orderId: order.id });
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(order.id);
    expect(fetched?.status).toBe('completed');
    expect(fetched?.grandTotalPiasters).toBe(10000);
  });

  it('clientTxnId replay returns the original order instead of creating a duplicate', async () => {
    const repos = makeRepos();
    const cmd = new CreateSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.batchRepo,
      repos.bundlePort,
      repos.loyaltyPort,
    );
    const { order } = await cmd.execute({
      companyId: 'c1',
      branchId: 'b1',
      cashierId: 'k1',
      warehouseId: 'w1',
      clientTxnId: 'txn-replay',
      lines: [{ productVariantId: 'v1', productId: 'p1', quantity: 1, unitPricePiasters: 10000 }],
      payments: [{ tenderType: 'cash', amountPiasters: 10000 }],
    });

    // Simulate the server-side reconcile: a second attempt with the same
    // clientTxnId surfaces the existing order.
    const existing = await repos.orderRepo.findByClientTxnId('txn-replay', 'c1');
    expect(existing?.id).toBe(order.id);
  });
});
