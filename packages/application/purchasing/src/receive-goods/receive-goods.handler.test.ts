import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiveGoodsCommand } from '@packages/application-purchasing';
import { PurchaseOrder, GoodsReceipt } from '@packages/domain-purchasing';
import { StockMovementEvent, StockItem } from '@packages/domain-inventory';

function buildApprovedPo(ordered: number): PurchaseOrder {
  const po = PurchaseOrder.create({
    companyId: 'company-1',
    branchId: 'branch-1',
    supplierId: 'supplier-1',
    expectedDeliveryDate: '2026-08-01T00:00:00.000Z',
    requestedByUserId: 'user-1',
  });
  po.addLine('product-1', null, 'unit-1', ordered, 10);
  po.submit(1); // total (>= 10) above threshold → pending_approval
  po.approve('manager-1');
  return po;
}

const mockPoRepo = {
  findById: vi.fn(),
  findByCompany: vi.fn(),
  save: vi.fn(),
};
const mockReceiptRepo = {
  findById: vi.fn(),
  findByPurchaseOrder: vi.fn(),
  save: vi.fn(),
};
const mockMovementRepo = {
  append: vi.fn(),
  findByWarehouseAndProduct: vi.fn(),
  findByProduct: vi.fn(),
  findSince: vi.fn(),
};
const mockStockItemRepo = {
  findByWarehouseAndProduct: vi.fn(),
  findByWarehouse: vi.fn(),
  findByCompany: vi.fn(),
  findBelowReorderPoint: vi.fn(),
  save: vi.fn(),
};

describe('ReceiveGoodsCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits a PURCHASE_RECEIPT stock movement event per received line', async () => {
    const po = buildApprovedPo(10);
    mockPoRepo.findById.mockResolvedValue(po);
    mockStockItemRepo.findByWarehouseAndProduct.mockResolvedValue(null);

    const command = new ReceiveGoodsCommand(
      mockPoRepo as any,
      mockReceiptRepo as any,
      mockMovementRepo as any,
      mockStockItemRepo as any,
    );

    const result = await command.execute({
      poId: po.id,
      companyId: 'company-1',
      receivedByUserId: 'receiver-1',
      lines: [{ lineId: po.lines[0].id, warehouseId: 'wh-1', receivedQuantity: 10 }],
    });

    expect(mockMovementRepo.append).toHaveBeenCalledTimes(1);
    const appended = mockMovementRepo.append.mock.calls[0][0] as StockMovementEvent;
    expect(appended.eventType).toBe('PURCHASE_RECEIPT');
    expect(appended.quantity).toBe(10);
    expect(appended.referenceType).toBe('PurchaseOrder');
    expect(appended.referenceId).toBe(po.id);

    // Stock item created + saved with increased on-hand quantity.
    expect(mockStockItemRepo.save).toHaveBeenCalledTimes(1);
    expect(result.purchaseOrder.status).toBe('fully_received');
    expect(result.goodsReceipt.discrepancies.length).toBe(0);
  });

  it('captures a discrepancy when received quantity < ordered quantity', async () => {
    const po = buildApprovedPo(100);
    mockPoRepo.findById.mockResolvedValue(po);
    mockStockItemRepo.findByWarehouseAndProduct.mockResolvedValue(null);

    const command = new ReceiveGoodsCommand(
      mockPoRepo as any,
      mockReceiptRepo as any,
      mockMovementRepo as any,
      mockStockItemRepo as any,
    );

    const result = await command.execute({
      poId: po.id,
      companyId: 'company-1',
      receivedByUserId: 'receiver-1',
      lines: [{ lineId: po.lines[0].id, warehouseId: 'wh-1', receivedQuantity: 90 }],
    });

    expect(result.purchaseOrder.status).toBe('partially_received');
    expect(result.goodsReceipt.discrepancies.length).toBe(1);
    const disc = result.goodsReceipt.discrepancies[0];
    expect(disc.type).toBe('quantity_shortage');
    expect(disc.expectedQuantity).toBe(100);
    expect(disc.actualQuantity).toBe(90);

    // Discrepancy receipt line is flagged.
    expect(result.goodsReceipt.lines[0].discrepancyType).toBe('quantity_shortage');
  });

  it('does not emit stock events when nothing is received (zero quantity)', async () => {
    const po = buildApprovedPo(10);
    mockPoRepo.findById.mockResolvedValue(po);
    mockStockItemRepo.findByWarehouseAndProduct.mockResolvedValue(null);

    const command = new ReceiveGoodsCommand(
      mockPoRepo as any,
      mockReceiptRepo as any,
      mockMovementRepo as any,
      mockStockItemRepo as any,
    );

    await command.execute({
      poId: po.id,
      companyId: 'company-1',
      receivedByUserId: 'receiver-1',
      lines: [{ lineId: po.lines[0].id, warehouseId: 'wh-1', receivedQuantity: 0 }],
    });

    expect(mockMovementRepo.append).not.toHaveBeenCalled();
    expect(mockStockItemRepo.save).not.toHaveBeenCalled();
  });
});
