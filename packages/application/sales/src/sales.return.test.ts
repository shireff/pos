import { describe, it, expect, vi } from 'vitest';
import { ProcessReturnCommand, ApproveReturnCommand, RejectReturnCommand } from './use-cases';
import { makeRepos, completedOrder } from './sales.test-support';

interface ReturnRepos {
  orderRepo: ReturnType<typeof makeRepos>['orderRepo'];
  returnRepo: ReturnType<typeof makeRepos>['returnRepo'];
  stockMovementRepo: ReturnType<typeof makeRepos>['stockMovementRepo'];
  stockItemRepo: ReturnType<typeof makeRepos>['stockItemRepo'];
  loyaltyPort: ReturnType<typeof makeRepos>['loyaltyPort'];
}

function returnRepos(order: ReturnType<typeof completedOrder>, overrides: Partial<ReturnRepos> = {}): ReturnRepos {
  const r = makeRepos({ findOrderById: order });
  return {
    orderRepo: overrides.orderRepo ?? r.orderRepo,
    returnRepo: overrides.returnRepo ?? r.returnRepo,
    stockMovementRepo: overrides.stockMovementRepo ?? r.stockMovementRepo,
    stockItemRepo: overrides.stockItemRepo ?? r.stockItemRepo,
    loyaltyPort: overrides.loyaltyPort ?? r.loyaltyPort,
  };
}

const ORDER_ID = 'o1';

describe('ProcessReturnCommand — sales/return.test.ts', () => {
  const order = completedOrder({ id: ORDER_ID, clientTxnId: 'txn-r' });

  const returnLines = [
    {
      orderLineId: order.lines[0].id,
      productVariantId: 'v1',
      productId: 'p1',
      returnQuantity: 1,
      refundAmountPiasters: 10000,
    },
  ];

  it('auto-approves and reverses inventory below threshold (BR-SAL-005)', async () => {
    const repos = returnRepos(order);
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
      reason: 'customer changed mind',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 10000,
      lines: returnLines,
    });
    expect(autoApproved).toBe(true);
    expect(returnEntity.status).toBe('approved');
    expect(repos.stockMovementRepo.append).toHaveBeenCalled();
    expect(repos.loyaltyPort.reverseOnReturn).toHaveBeenCalled();
  });

  it('requires approval above threshold; stock NOT affected until approved (BR-RET-002)', async () => {
    const repos = returnRepos(order);
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
      reason: 'customer changed mind',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 5000,
      lines: returnLines,
    });
    expect(autoApproved).toBe(false);
    expect(returnEntity.status).toBe('pending_approval');
    expect(repos.stockMovementRepo.append).not.toHaveBeenCalled();
    expect(repos.loyaltyPort.reverseOnReturn).not.toHaveBeenCalled();
  });

  it('approving a pending return restores stock and reverses loyalty (BR-SAL-007)', async () => {
    const repos = returnRepos(order);
    const created = await new ProcessReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({
      companyId: 'c1',
      orderId: ORDER_ID,
      returnedByUserId: 'k1',
      reason: 'customer changed mind',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 5000,
      lines: returnLines,
    });
    const returnId = created.returnEntity.id;
    const pending = vi.fn().mockResolvedValue(created.returnEntity);
    const approved = await new ApproveReturnCommand(
      repos.orderRepo,
      { ...repos.returnRepo, findById: pending },
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({ companyId: 'c1', orderId: ORDER_ID, returnId, approvedByUserId: 'owner', warehouseId: 'w1' });
    expect(approved.status).toBe('approved');
    expect(repos.stockMovementRepo.append).toHaveBeenCalled();
    expect(repos.loyaltyPort.reverseOnReturn).toHaveBeenCalled();
  });

  it('rejected return has zero stock or loyalty effect (BR-RET-003)', async () => {
    const repos = returnRepos(order);
    const created = await new ProcessReturnCommand(
      repos.orderRepo,
      repos.returnRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({
      companyId: 'c1',
      orderId: ORDER_ID,
      returnedByUserId: 'k1',
      reason: 'customer changed mind',
      warehouseId: 'w1',
      refundApprovalThresholdPiasters: 5000,
      lines: returnLines,
    });
    const rejected = await new RejectReturnCommand({
      ...repos.returnRepo,
      findById: vi.fn().mockResolvedValue(created.returnEntity),
    }).execute({ companyId: 'c1', orderId: ORDER_ID, returnId: created.returnEntity.id, rejectedByUserId: 'mgr' });
    expect(rejected.status).toBe('rejected');
    expect(repos.stockMovementRepo.append).not.toHaveBeenCalled();
    expect(repos.loyaltyPort.reverseOnReturn).not.toHaveBeenCalled();
  });

  it('blocks a return with no original order reference (BR-RET-001)', async () => {
    const repos = returnRepos(order, { orderRepo: makeRepos({ findOrderById: null }).orderRepo });
    await expect(
      new ProcessReturnCommand(
        repos.orderRepo,
        repos.returnRepo,
        repos.stockMovementRepo,
        repos.stockItemRepo,
        repos.loyaltyPort,
      ).execute({
        companyId: 'c1',
        orderId: 'missing',
        returnedByUserId: 'k1',
        reason: 'customer changed mind',
        warehouseId: 'w1',
        refundApprovalThresholdPiasters: 10000,
        lines: returnLines,
      }),
    ).rejects.toThrow(/not found/);
  });
});
