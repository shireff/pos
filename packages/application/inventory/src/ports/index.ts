import {
  StockMovementEvent,
  StockItem,
  StockTransfer,
  Batch,
  Warehouse,
} from '@packages/domain-inventory';

export interface StockMovementEventRepository {
  append(event: StockMovementEvent): Promise<void>;
  findById(id: string): Promise<StockMovementEvent | null>;
  findByWarehouseAndProduct(
    warehouseId: string,
    productId: string,
    variantId?: string | null,
    batchId?: string | null,
  ): Promise<StockMovementEvent[]>;
  findByProduct(companyId: string, productId: string): Promise<StockMovementEvent[]>;
  findSince(deviceId: string, sequenceNo: number): Promise<StockMovementEvent[]>;
}

export interface StockItemRepository {
  findByWarehouseAndProduct(
    warehouseId: string,
    productId: string,
    variantId?: string | null,
    batchId?: string | null,
  ): Promise<StockItem | null>;
  findByWarehouse(warehouseId: string): Promise<StockItem[]>;
  findByCompany(companyId: string): Promise<StockItem[]>;
  findBelowReorderPoint(companyId: string): Promise<StockItem[]>;
  save(item: StockItem): Promise<void>;
}

export interface BatchRepository {
  findById(id: string): Promise<Batch | null>;
  findByVariantAndWarehouse(productId: string, variantId: string | null, warehouseId: string): Promise<Batch[]>;
  findExpiring(companyId: string, warehouseId: string, withinDays: number): Promise<Batch[]>;
  findExpired(companyId: string, warehouseId: string): Promise<Batch[]>;
  save(batch: Batch): Promise<void>;
}

export interface WarehouseRepository {
  findById(id: string): Promise<Warehouse | null>;
  findByCompany(companyId: string): Promise<Warehouse[]>;
  findDefault(companyId: string): Promise<Warehouse | null>;
  save(warehouse: Warehouse): Promise<void>;
}

export interface StockTransferRepository {
  findById(id: string): Promise<StockTransfer | null>;
  findByWarehouse(warehouseId: string): Promise<StockTransfer[]>;
  findPendingApproval(companyId: string): Promise<StockTransfer[]>;
  save(transfer: StockTransfer): Promise<void>;
}
