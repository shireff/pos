import {
  MongoOrderRepository,
  MongoReturnRepository,
  MongoShiftSessionRepository,
  MongoStockMovementEventRepository,
  MongoStockItemRepository,
  MongoBatchRepository,
  MongoWarehouseRepository,
  MongoPaymentTransactionRepository,
  MongoPaymentMethodRepository,
  MongoDiscountRepository,
  MongoCouponRepository,
  MongoTaxRuleRepository,
} from '@packages/infrastructure-mongodb';

export interface SalesRepos {
  orderRepo: MongoOrderRepository;
  returnRepo: MongoReturnRepository;
  shiftRepo: MongoShiftSessionRepository;
  stockMovementRepo: MongoStockMovementEventRepository;
  stockItemRepo: MongoStockItemRepository;
  batchRepo: MongoBatchRepository;
  warehouseRepo: MongoWarehouseRepository;
  paymentTransactionRepo: MongoPaymentTransactionRepository;
  paymentMethodRepo: MongoPaymentMethodRepository;
  discountRepo: MongoDiscountRepository;
  couponRepo: MongoCouponRepository;
  taxRuleRepo: MongoTaxRuleRepository;
}

export function getSalesRepos(): SalesRepos {
  return {
    orderRepo: new MongoOrderRepository(),
    returnRepo: new MongoReturnRepository(),
    shiftRepo: new MongoShiftSessionRepository(),
    stockMovementRepo: new MongoStockMovementEventRepository(),
    stockItemRepo: new MongoStockItemRepository(),
    batchRepo: new MongoBatchRepository(),
    warehouseRepo: new MongoWarehouseRepository(),
    paymentTransactionRepo: new MongoPaymentTransactionRepository(),
    paymentMethodRepo: new MongoPaymentMethodRepository(),
    discountRepo: new MongoDiscountRepository(),
    couponRepo: new MongoCouponRepository(),
    taxRuleRepo: new MongoTaxRuleRepository(),
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
