import { describe, it, expect, vi } from 'vitest';
import { VoidSaleCommand } from './use-cases';
import { makeRepos, completedOrder } from './sales.test-support';

const ORDER_ID = 'o1';
const SHIFT = 'shift-1';

describe('VoidSaleCommand — sales/void.test.ts', () => {
  it('voids within the same session/shift and reverses stock + loyalty', async () => {
    const order = completedOrder({ id: ORDER_ID, clientTxnId: 'txn-v', shiftSessionId: SHIFT });
    const repos = makeRepos({ findOrderById: order });
    const voided = await new VoidSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({
      companyId: 'c1',
      orderId: ORDER_ID,
      voidedByUserId: 'k1',
      reason: 'mistake at register',
      currentShiftSessionId: SHIFT,
      warehouseId: 'w1',
    });
    expect(voided.status).toBe('voided');
    expect(repos.stockMovementRepo.append).toHaveBeenCalled();
    expect(repos.loyaltyPort.reverseOnReturn).toHaveBeenCalled();
  });

  it('blocks void outside the session/shift (BR-SAL-006)', async () => {
    const order = completedOrder({ id: ORDER_ID, clientTxnId: 'txn-v', shiftSessionId: SHIFT });
    const repos = makeRepos({ findOrderById: order });
    await expect(
      new VoidSaleCommand(
        repos.orderRepo,
        repos.stockMovementRepo,
        repos.stockItemRepo,
        repos.loyaltyPort,
      ).execute({
        companyId: 'c1',
        orderId: ORDER_ID,
        voidedByUserId: 'k1',
        reason: 'mistake at register',
        currentShiftSessionId: 'different-shift',
        warehouseId: 'w1',
      }),
    ).rejects.toThrow(/same shift session/);
  });

  it('a null current session matches a null-session order and voids', async () => {
    const order = completedOrder({ id: ORDER_ID, clientTxnId: 'txn-v', shiftSessionId: null });
    const repos = makeRepos({ findOrderById: order });
    const voided = await new VoidSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.loyaltyPort,
    ).execute({
      companyId: 'c1',
      orderId: ORDER_ID,
      voidedByUserId: 'k1',
      reason: 'mistake at register',
      currentShiftSessionId: null,
      warehouseId: 'w1',
    });
    expect(voided.status).toBe('voided');
  });
});
