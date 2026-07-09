import {
  MongoOrderRepository,
  MongoReturnRepository,
  MongoShiftSessionRepository,
  MongoStockMovementEventRepository,
  MongoStockItemRepository,
  MongoBatchRepository,
  MongoWarehouseRepository,
} from '@packages/infrastructure-mongodb';

export interface SalesRepos {
  orderRepo: MongoOrderRepository;
  returnRepo: MongoReturnRepository;
  shiftRepo: MongoShiftSessionRepository;
  stockMovementRepo: MongoStockMovementEventRepository;
  stockItemRepo: MongoStockItemRepository;
  batchRepo: MongoBatchRepository;
  warehouseRepo: MongoWarehouseRepository;
}

/**
 * Constructs the MongoDB-backed repositories used by the sales API.
 * Loyalty and bundle-resolution ports are intentionally left null here; they
 * are supplied by the CRM (Phase 08) and Catalog (Phase 05) bounded contexts
 * when those integrations are wired up.
 */
export function getSalesRepos(): SalesRepos {
  return {
    orderRepo: new MongoOrderRepository(),
    returnRepo: new MongoReturnRepository(),
    shiftRepo: new MongoShiftSessionRepository(),
    stockMovementRepo: new MongoStockMovementEventRepository(),
    stockItemRepo: new MongoStockItemRepository(),
    batchRepo: new MongoBatchRepository(),
    warehouseRepo: new MongoWarehouseRepository(),
  };
}

/**
 * Resolves the warehouse that stock movements for a sale/return are posted
 * against. Prefers the company's default warehouse, falling back to branchId.
 */
export async function resolveWarehouseId(
  repos: SalesRepos,
  companyId: string,
  fallbackId: string,
): Promise<string> {
  const def = await repos.warehouseRepo.findDefault(companyId);
  return def?.id ?? fallbackId;
}
