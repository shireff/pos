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
  MongoSupplierLedgerEntryRepository,
  MongoSupplierPriceHistoryRepository,
} from '@packages/infrastructure-mongodb';
import {
  MongoDailySalesRollupRepository,
  MongoMonthlySalesRollupRepository,
  MongoInventoryValuationSnapshotRepository,
  MongoEmployeePerformanceSnapshotRepository,
  MongoCustomerLoyaltySnapshotRepository,
  MongoReportPaymentTransactionRepository,
  MongoReportStockMovementRepository,
  MongoReportOrderRepository,
  MongoReportShiftRepository,
} from '@packages/application-reports';

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
  ledgerRepo: MongoSupplierLedgerEntryRepository;
  priceHistoryRepo: MongoSupplierPriceHistoryRepository;
}

export interface ReportsRepos {
  dailySalesRollupRepo: MongoDailySalesRollupRepository;
  monthlySalesRollupRepo: MongoMonthlySalesRollupRepository;
  inventoryValuationRepo: MongoInventoryValuationSnapshotRepository;
  employeePerformanceRepo: MongoEmployeePerformanceSnapshotRepository;
  customerLoyaltyRepo: MongoCustomerLoyaltySnapshotRepository;
  paymentTransactionRepo: MongoReportPaymentTransactionRepository;
  stockMovementRepo: MongoReportStockMovementRepository;
  orderRepo: MongoReportOrderRepository;
  shiftRepo: MongoReportShiftRepository;
  salesRepos: SalesRepos;
}

export function getReportsRepos(): ReportsRepos {
  const salesRepos = {
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
    ledgerRepo: new MongoSupplierLedgerEntryRepository(),
    priceHistoryRepo: new MongoSupplierPriceHistoryRepository(),
  };

  return {
    dailySalesRollupRepo: new MongoDailySalesRollupRepository(),
    monthlySalesRollupRepo: new MongoMonthlySalesRollupRepository(),
    inventoryValuationRepo: new MongoInventoryValuationSnapshotRepository(),
    employeePerformanceRepo: new MongoEmployeePerformanceSnapshotRepository(),
    customerLoyaltyRepo: new MongoCustomerLoyaltySnapshotRepository(),
    paymentTransactionRepo: new MongoReportPaymentTransactionRepository(),
    stockMovementRepo: new MongoReportStockMovementRepository(),
    orderRepo: new MongoReportOrderRepository(),
    shiftRepo: new MongoReportShiftRepository(),
    salesRepos,
  };
}
