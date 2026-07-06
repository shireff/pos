import { StockMovementEvent, StockItem, StockTransfer } from '@packages/domain-inventory';
import { Batch, Warehouse } from '@packages/domain-inventory';

export interface StockMovementEventRepository {
  /** Append-only — no update or delete operations permitted. */
  append(event: StockMovementEvent): Promise<void>;
  findByWarehouseAndVariant(
    warehouseId: string,
    variantId: string,
    batchId?: string | null,
  ): Promise<StockMovementEvent[]>;
  findSince(deviceId: string, sequenceNo: number): Promise<StockMovementEvent[]>;
}

export interface StockItemRepository {
  findByWarehouseAndVariant(
    warehouseId: string,
    variantId: string,
    batchId?: string | null,
  ): Promise<StockItem | null>;
  findByWarehouse(warehouseId: string): Promise<StockItem[]>;
  findBelowReorderPoint(companyId: string): Promise<StockItem[]>;
  save(item: StockItem): Promise<void>;
}

export interface BatchRepository {
  findById(id: string): Promise<Batch | null>;
  findByVariantAndWarehouse(variantId: string, warehouseId: string): Promise<Batch[]>;
  findExpiring(warehouseId: string, withinDays: number): Promise<Batch[]>;
  save(batch: Batch): Promise<void>;
}

export interface WarehouseRepository {
  findById(id: string, companyId: string): Promise<Warehouse | null>;
  findByCompany(companyId: string): Promise<Warehouse[]>;
  findByBranch(branchId: string): Promise<Warehouse[]>;
  save(warehouse: Warehouse): Promise<void>;
}

export interface StockTransferRepository {
  findById(id: string): Promise<StockTransfer | null>;
  findByWarehouse(warehouseId: string): Promise<StockTransfer[]>;
  findPendingApproval(companyId: string): Promise<StockTransfer[]>;
  save(transfer: StockTransfer): Promise<void>;
}
