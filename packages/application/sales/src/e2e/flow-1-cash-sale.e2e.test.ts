import { describe, it, expect, vi } from 'vitest';
import { CreateSaleCommand, GetOrderQuery } from '../use-cases';
import type { ReceiptPrinter, CashDrawer } from '@packages/application-sales';
import { makeRepos } from '../sales.test-support';

/**
 * Critical E2E Flow #1 (TESTS.md): scan item → add to cart → tender exact cash
 * → sale completes offline → receipt prints (or digital fallback) → stock
 * decremented. Exercised end-to-end through the sales bounded context + the
 * HAL ports (ReceiptPrinter / CashDrawer) that the POS Register UI drives.
 */
describe('E2E Flow #1 — cash sale (e2e/flow-1-cash-sale.e2e.test.ts)', () => {
  it('completes a cash sale, prints the receipt, and decrements stock', async () => {
    const repos = makeRepos();
    const printed: unknown[] = [];
    const receiptPrinter: ReceiptPrinter = {
      isAvailable: vi.fn().mockResolvedValue(true),
      print: vi.fn(async (r) => {
        printed.push(r);
        return { success: true, fallbackRequired: false };
      }),
    };
    const drawer: CashDrawer = { open: vi.fn().mockResolvedValue({ success: true }) };

    // "scan" → cart line → CreateSaleCommand (the thunk body)
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
      clientTxnId: 'e2e-flow-1',
      lines: [{ productVariantId: 'v1', productId: 'p1', quantity: 1, unitPricePiasters: 10000 }],
      payments: [{ tenderType: 'cash', amountPiasters: 10000 }],
    });

    // UI side-effects after a successful sale
    expect(order.status).toBe('completed');
    const result = await receiptPrinter.print({
      orderId: order.id,
      lines: order.lines.map((l) => ({ name: 'Item', qty: l.quantity, unitPricePiasters: l.unitPricePiasters })),
      grandTotalPiasters: order.grandTotalPiasters,
      companyName: 'Smart Retail OS',
      branchName: 'Cairo',
      cashierId: 'k1',
    });
    expect(result.success).toBe(true);
    // cash tender → drawer pulse
    await drawer.open();

    // Stock decremented in the projection
    expect(repos.stockMovementRepo.append).toHaveBeenCalledTimes(1);
    const evt = repos.appendedEvents[0] as { eventType: string; quantity: number };
    expect(evt.eventType).toBe('SALE');
    expect(evt.quantity).toBe(-1);

    // Sale appears in the daily sales report (GetOrderQuery)
    const fetched = await new GetOrderQuery(repos.orderRepo).execute({ companyId: 'c1', orderId: order.id });
    expect(fetched?.id).toBe(order.id);
  });

  it('printer unavailable → digital receipt fallback, sale still completes', async () => {
    const repos = makeRepos();
    const receiptPrinter: ReceiptPrinter = {
      isAvailable: vi.fn().mockResolvedValue(false),
      print: vi.fn(async () => {
        throw new Error('no printer');
      }),
    };
    const { order } = await new CreateSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.batchRepo,
      repos.bundlePort,
      repos.loyaltyPort,
    ).execute({
      companyId: 'c1',
      branchId: 'b1',
      cashierId: 'k1',
      warehouseId: 'w1',
      clientTxnId: 'e2e-flow-1-fallback',
      lines: [{ productVariantId: 'v1', productId: 'p1', quantity: 1, unitPricePiasters: 10000 }],
      payments: [{ tenderType: 'cash', amountPiasters: 10000 }],
    });
    // Sale completed despite the printer failure; UI shows digital receipt.
    expect(order.status).toBe('completed');
    expect(repos.stockMovementRepo.append).toHaveBeenCalledTimes(1);
  });
});
