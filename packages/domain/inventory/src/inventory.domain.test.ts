import { describe, it, expect } from 'vitest';
import { Batch, Warehouse, StockItem, StockTransfer, StockTransferLine, StockMovementEvent } from '@packages/domain-inventory';

describe('Batch', () => {
    it('creates and archives', () => {
        const batch = Batch.create({
            companyId: 'company-1',
            productId: 'product-1',
            variantId: 'variant-1',
            warehouseId: 'warehouse-1',
            batchNumber: 'B001',
            expiryDate: '2025-12-31',
            manufacturingDate: '2025-01-01',
            costPrice: 100,
            quantityRemaining: 50,
        });
        expect(batch.batchNumber).toBe('B001');
        batch.archive();
        expect(batch.isDeleted).toBe(true);
    });

    it('detects expiry', () => {
        const expired = Batch.create({
            companyId: 'company-1',
            productId: 'product-1',
            variantId: 'variant-1',
            warehouseId: 'warehouse-1',
            batchNumber: 'B001',
            expiryDate: '2020-01-01',
            manufacturingDate: null,
            costPrice: 100,
            quantityRemaining: 10,
        });
        expect(expired.isExpired(new Date('2021-01-01'))).toBe(true);
        expect(expired.isExpired(new Date('2019-12-31'))).toBe(false);
    });

    it('deducts quantity', () => {
        const batch = Batch.create({
            companyId: 'company-1',
            productId: 'product-1',
            variantId: 'variant-1',
            warehouseId: 'warehouse-1',
            batchNumber: 'B001',
            expiryDate: null,
            manufacturingDate: null,
            costPrice: 100,
            quantityRemaining: 50,
        });
        batch.deduct(20);
        expect(batch.quantityRemaining).toBe(30);
    });

    it('throws when deduction exceeds remaining', () => {
        const batch = Batch.create({
            companyId: 'company-1',
            productId: 'product-1',
            variantId: 'variant-1',
            warehouseId: 'warehouse-1',
            batchNumber: 'B001',
            expiryDate: null,
            manufacturingDate: null,
            costPrice: 100,
            quantityRemaining: 10,
        });
        expect(() => batch.deduct(20)).toThrow('Insufficient batch quantity');
    });
});

describe('Warehouse', () => {
    it('creates with defaults', () => {
        const warehouse = Warehouse.create({
            companyId: 'company-1',
            name: 'Main Warehouse',
            address: '123 St',
            isDefault: true,
            isActive: true,
            managerId: null,
        });
        expect(warehouse.name).toBe('Main Warehouse');
        expect(warehouse.isDefault).toBe(true);
        warehouse.rename('Updated Warehouse');
        expect(warehouse.name).toBe('Updated Warehouse');
    });
});

describe('StockItem', () => {
    it('applies events and computes projection', () => {
        const item = StockItem.create({
            companyId: 'company-1',
            productId: 'product-1',
            variantId: null,
            warehouseId: 'warehouse-1',
            batchId: null,
            reorderPoint: 10,
            reorderQuantity: 5,
        });

        const event1 = StockMovementEvent.record({
            companyId: 'company-1',
            warehouseId: 'warehouse-1',
            productId: 'product-1',
            variantId: null,
            batchId: null,
            eventType: 'PURCHASE_RECEIPT',
            quantity: 100,
            referenceType: 'PurchaseOrder',
            referenceId: 'po-1',
            occurredAt: new Date().toISOString(),
        });

        item.applyEvent(event1);
        expect(item.quantityOnHand).toBe(100);
    });

    it('detects below reorder point', () => {
        const item = StockItem.create({
            companyId: 'company-1',
            productId: 'product-1',
            variantId: null,
            warehouseId: 'warehouse-1',
            batchId: null,
            reorderPoint: 10,
            reorderQuantity: 5,
        });
        expect(item.isBelowReorderPoint()).toBe(true);
    });

    it('reserved and available quantities', () => {
        const item = StockItem.create({
            companyId: 'company-1',
            productId: 'product-1',
            variantId: null,
            warehouseId: 'warehouse-1',
            batchId: null,
            reorderPoint: 0,
            reorderQuantity: 0,
        });
        const event = StockMovementEvent.record({
            companyId: 'company-1',
            warehouseId: 'warehouse-1',
            productId: 'product-1',
            variantId: null,
            batchId: null,
            eventType: 'PURCHASE_RECEIPT',
            quantity: 50,
            referenceType: 'PurchaseOrder',
            referenceId: 'po-1',
            occurredAt: new Date().toISOString(),
        });
        item.applyEvent(event);
        item.reserve(20);
        expect(item.availableQuantity()).toBe(30);
    });
});

describe('StockTransfer', () => {
    function makeTransferWithLine(): { transfer: StockTransfer; lineId: string } {
        const transfer = StockTransfer.create({
            companyId: 'company-1',
            fromWarehouseId: 'w1',
            toWarehouseId: 'w2',
            requestedByUserId: 'user-1',
            notes: null,
        });
        const line = StockTransferLine.create({
            transferId: transfer.id,
            productId: 'product-1',
            variantId: null,
            batchId: null,
            quantityRequested: 10,
        });
        transfer.addLine(line);
        return { transfer, lineId: line.id };
    }

    it('lifecycle: draft → pending_approval → approved → shipped → received', () => {
        const { transfer, lineId } = makeTransferWithLine();
        expect(transfer.status).toBe('draft');

        transfer.submit();
        expect(transfer.status).toBe('pending_approval');

        transfer.approve('user-2');
        expect(transfer.status).toBe('approved');

        transfer.lines[0].ship(10);
        transfer.ship();
        expect(transfer.status).toBe('shipped');

        transfer.receive([{ lineId, quantityReceived: 8 }]);
        expect(transfer.status).toBe('received');
        expect(transfer.lines[0].quantityReceived).toBe(8);
        expect(transfer.lines[0].discrepancy).toBe(2);
    });

    it('blocks invalid transitions (shipped/received → cancel)', () => {
        const { transfer, lineId } = makeTransferWithLine();
        transfer.submit();
        transfer.approve('user-2');
        transfer.lines[0].ship(10);
        transfer.ship();
        expect(() => transfer.cancel()).toThrow();

        transfer.receive([{ lineId, quantityReceived: 10 }]);
        expect(transfer.status).toBe('received');
        expect(() => transfer.cancel()).toThrow();
        expect(() => transfer.submit()).toThrow();
    });
});

describe('StockTransferLine', () => {
    it('records received quantity and discrepancy', () => {
        const line = StockTransferLine.create({
            transferId: 'transfer-1',
            productId: 'product-1',
            variantId: null,
            batchId: null,
            quantityRequested: 10,
        });
        expect(line.quantityReceived).toBe(0);
        line.receive(8);
        expect(line.discrepancy).toBe(2);
    });
});
