import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdjustStockCommand } from '@packages/application-inventory';

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

const mockBatchRepo = {
    findById: vi.fn(),
    findByVariantAndWarehouse: vi.fn(),
    findExpiring: vi.fn(),
    findExpired: vi.fn(),
    save: vi.fn(),
};

const mockWarehouseRepo = {
    findById: vi.fn(),
    findByCompany: vi.fn(),
    findDefault: vi.fn(),
    save: vi.fn(),
};

describe('AdjustStockCommand', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('commits adjustment below threshold', async () => {
        const warehouse = {
            id: 'warehouse-1',
            companyId: 'company-1',
            name: 'Main',
            address: null,
            isDefault: true,
            isActive: true,
            managerId: null,
            isDeleted: false,
        };
        mockWarehouseRepo.findById.mockResolvedValue(warehouse);
        mockStockItemRepo.findByWarehouseAndProduct.mockResolvedValue(null);

        const command = new AdjustStockCommand(
            mockMovementRepo as any,
            mockStockItemRepo as any,
            mockBatchRepo as any,
            mockWarehouseRepo as any,
        );

        const result = await command.execute({
            companyId: 'company-1',
            warehouseId: 'warehouse-1',
            productId: 'product-1',
            quantity: 5,
            reason: 'Found extra stock during cycle count',
            approvalThreshold: 20,
        });

        expect(result.status).toBe('committed');
        expect(result.requiresApproval).toBe(false);
        expect(mockMovementRepo.append).toHaveBeenCalledTimes(1);
        expect(mockStockItemRepo.save).toHaveBeenCalledTimes(1);
    });

    it('blocks adjustment above threshold', async () => {
        const warehouse = {
            id: 'warehouse-1',
            companyId: 'company-1',
            name: 'Main',
            address: null,
            isDefault: true,
            isActive: true,
            managerId: null,
            isDeleted: false,
        };
        mockWarehouseRepo.findById.mockResolvedValue(warehouse);

        const command = new AdjustStockCommand(
            mockMovementRepo as any,
            mockStockItemRepo as any,
            mockBatchRepo as any,
            mockWarehouseRepo as any,
        );

        const result = await command.execute({
            companyId: 'company-1',
            warehouseId: 'warehouse-1',
            productId: 'product-1',
            quantity: -25,
            reason: 'Damaged goods write-off',
            approvalThreshold: 20,
        });

        expect(result.status).toBe('pending_approval');
        expect(result.requiresApproval).toBe(true);
    });
});
