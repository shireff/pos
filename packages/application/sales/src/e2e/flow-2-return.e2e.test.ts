import { describe, it, expect, vi } from 'vitest';
import { CreateSaleCommand, ProcessReturnCommand, ApproveReturnCommand } from '../use-cases';
import { makeRepos, completedOrder } from '../sales.test-support';

/**
 * Critical E2E Flow #2 (TESTS.md): complete sale → initiate return → return
 * above threshold enters pending_approval → approve on a second device → stock
 * restored → loyalty points reversed. Return below threshold auto-approves.
 */
describe('E2E Flow #2 — return (e2e/flow-2-return.e2e.test.ts)', () => {
  const ORDER_ID = 'e2e-o2';

  it('return above threshold → pending_approval → approve restores stock + reverses loyalty', async () => {
    const order = completedOrder({ id: ORDER_ID, clientTxnId: 'e2e-txn-2', customerId: 'cust-1' });
    const repos = makeRepos({ findOrderById: order });

    const { returnEntity, autoApproved } = await new ProcessReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({
      companyId: 'c1',
      orderId: ORDER_ID,
      returnedByUserId: 'k1',
      reason: 'customer changed mind about purchase',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 5000,
      lines: [
        { orderLineId: order.lines[0].id, productVariantId: 'v1', productId: 'p1', returnQuantity: 1, refundAmountPiasters: 10000 },
      ],
    });
    // Above threshold → requires manager approval (BR-SAL-005)
    expect(autoApproved).toBe(false);
    expect(returnEntity.status).toBe('pending_approval');
    expect(repos.stockMovementRepo.append).not.toHaveBeenCalled();

    // Owner approves on their device
    const approved = await new ApproveReturnCommand(
      repos.orderRepo,
      { ...repos.returnRepo, findById: vi.fn().mockResolvedValue(returnEntity) },
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({ companyId: 'c1', orderId: ORDER_ID, returnId: returnEntity.id, approvedByUserId: 'owner', warehouseId: 'w1' });

    expect(approved.status).toBe('approved');
    expect(repos.stockMovementRepo.append).toHaveBeenCalledTimes(1);
    const evt = repos.appendedEvents[0] as { eventType: string; quantity: number };
    expect(evt.eventType).toBe('RETURN');
    expect(evt.quantity).toBe(1);
    expect(repos.loyaltyPort.reverseOnReturn).toHaveBeenCalled();
  });

  it('return below threshold → auto-approved immediately', async () => {
    const order = completedOrder({ id: ORDER_ID, clientTxnId: 'e2e-txn-2b', customerId: 'cust-1' });
    const repos = makeRepos({ findOrderById: order });
    const { autoApproved, returnEntity } = await new ProcessReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({
      companyId: 'c1',
      orderId: ORDER_ID,
      returnedByUserId: 'k1',
      reason: 'minor defect',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 10000,
      lines: [
        { orderLineId: order.lines[0].id, productVariantId: 'v1', productId: 'p1', returnQuantity: 1, refundAmountPiasters: 10000 },
      ],
    });
    expect(autoApproved).toBe(true);
    expect(returnEntity.status).toBe('approved');
    expect(repos.stockMovementRepo.append).toHaveBeenCalledTimes(1);
  });
});
