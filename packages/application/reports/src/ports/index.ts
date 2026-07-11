import { getMongoDb } from '@packages/infrastructure-mongodb';

export interface DailySalesRollup {
  id: string;
  companyId: string;
  branchId: string;
  date: string;
  grossRevenuePiasters: number;
  taxAmountPiasters: number;
  discountAmountPiasters: number;
  transactionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlySalesRollup {
  id: string;
  companyId: string;
  branchId: string;
  year: number;
  month: number;
  grossRevenuePiasters: number;
  taxAmountPiasters: number;
  discountAmountPiasters: number;
  transactionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryValuationSnapshot {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  quantityOnHand: number;
  costPricePiasters: number;
  totalValuePiasters: number;
  snapshotDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeePerformanceSnapshot {
  id: string;
  companyId: string;
  branchId: string;
  employeeId: string;
  shiftSessionId: string | null;
  date: string;
  ordersHandled: number;
  totalSalesPiasters: number;
  totalReturnsPiasters: number;
  returnRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerLoyaltySnapshot {
  id: string;
  companyId: string;
  customerId: string;
  tier: string | null;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  snapshotDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportsRepos {
  dailySalesRollupRepo: MongoDailySalesRollupRepository;
  monthlySalesRollupRepo: MongoMonthlySalesRollupRepository;
  inventoryValuationRepo: MongoInventoryValuationSnapshotRepository;
  employeePerformanceRepo: EmployeePerformanceSnapshotRepository;
  customerLoyaltyRepo: MongoCustomerLoyaltySnapshotRepository;
}

export function getReportsRepos(): ReportsRepos {
  return {
    dailySalesRollupRepo: new MongoDailySalesRollupRepository(),
    monthlySalesRollupRepo: new MongoMonthlySalesRollupRepository(),
    inventoryValuationRepo: new MongoInventoryValuationSnapshotRepository(),
    employeePerformanceRepo: new EmployeePerformanceSnapshotRepository(),
    customerLoyaltyRepo: new MongoCustomerLoyaltySnapshotRepository(),
  };
}

export class MongoDailySalesRollupRepository {
  async upsert(rollup: Omit<DailySalesRollup, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>('daily_sales_rollup').updateOne(
      { company_id: rollup.companyId, branch_id: rollup.branchId, date: rollup.date },
      {
        $set: {
          gross_revenue_piasters: rollup.grossRevenuePiasters,
          tax_amount_piasters: rollup.taxAmountPiasters,
          discount_amount_piasters: rollup.discountAmountPiasters,
          transaction_count: rollup.transactionCount,
          updated_at: new Date(),
        },
        $setOnInsert: {
          _id: rollup.id,
          company_id: rollup.companyId,
          branch_id: rollup.branchId,
          date: rollup.date,
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async findByCompanyBranchDate(
    companyId: string,
    branchId: string,
    date: string,
  ): Promise<DailySalesRollup | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('daily_sales_rollup').findOne({
      company_id: companyId,
      branch_id: branchId,
      date,
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByCompanyBranchDateRange(
    companyId: string,
    branchId: string,
    fromDate: string,
    toDate: string,
  ): Promise<DailySalesRollup[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('daily_sales_rollup')
      .find({
        company_id: companyId,
        branch_id: branchId,
        date: { $gte: fromDate, $lte: toDate },
      })
      .sort({ date: 1 })
      .toArray();
    return docs.map((d) => this.toDomain(d));
  }

  private toDomain(doc: any): DailySalesRollup {
    return {
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      branchId: doc.branch_id.toString(),
      date: doc.date,
      grossRevenuePiasters: doc.gross_revenue_piasters ?? 0,
      taxAmountPiasters: doc.tax_amount_piasters ?? 0,
      discountAmountPiasters: doc.discount_amount_piasters ?? 0,
      transactionCount: doc.transaction_count ?? 0,
      createdAt: doc.created_at ?? new Date(),
      updatedAt: doc.updated_at ?? new Date(),
    };
  }
}

export class MongoMonthlySalesRollupRepository {
  async upsert(rollup: Omit<MonthlySalesRollup, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>('monthly_sales_rollup').updateOne(
      { company_id: rollup.companyId, branch_id: rollup.branchId, year: rollup.year, month: rollup.month },
      {
        $set: {
          gross_revenue_piasters: rollup.grossRevenuePiasters,
          tax_amount_piasters: rollup.taxAmountPiasters,
          discount_amount_piasters: rollup.discountAmountPiasters,
          transaction_count: rollup.transactionCount,
          updated_at: new Date(),
        },
        $setOnInsert: {
          _id: rollup.id,
          company_id: rollup.companyId,
          branch_id: rollup.branchId,
          year: rollup.year,
          month: rollup.month,
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async findByCompanyBranchYearMonth(
    companyId: string,
    branchId: string,
    year: number,
    month: number,
  ): Promise<MonthlySalesRollup | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('monthly_sales_rollup').findOne({
      company_id: companyId,
      branch_id: branchId,
      year,
      month,
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  private toDomain(doc: any): MonthlySalesRollup {
    return {
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      branchId: doc.branch_id.toString(),
      year: doc.year,
      month: doc.month,
      grossRevenuePiasters: doc.gross_revenue_piasters ?? 0,
      taxAmountPiasters: doc.tax_amount_piasters ?? 0,
      discountAmountPiasters: doc.discount_amount_piasters ?? 0,
      transactionCount: doc.transaction_count ?? 0,
      createdAt: doc.created_at ?? new Date(),
      updatedAt: doc.updated_at ?? new Date(),
    };
  }
}

export class MongoInventoryValuationSnapshotRepository {
  async upsert(snapshot: Omit<InventoryValuationSnapshot, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>('inventory_valuation_snapshot').updateOne(
      {
        company_id: snapshot.companyId,
        warehouse_id: snapshot.warehouseId,
        product_id: snapshot.productId,
        snapshot_date: snapshot.snapshotDate,
      },
      {
        $set: {
          variant_id: snapshot.variantId,
          batch_id: snapshot.batchId,
          quantity_on_hand: snapshot.quantityOnHand,
          cost_price_piasters: snapshot.costPricePiasters,
          total_value_piasters: snapshot.totalValuePiasters,
          updated_at: new Date(),
        },
        $setOnInsert: {
          _id: snapshot.id,
          company_id: snapshot.companyId,
          warehouse_id: snapshot.warehouseId,
          product_id: snapshot.productId,
          snapshot_date: snapshot.snapshotDate,
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async findByCompanyWarehouseDate(
    companyId: string,
    warehouseId: string,
    snapshotDate: string,
  ): Promise<InventoryValuationSnapshot[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('inventory_valuation_snapshot')
      .find({
        company_id: companyId,
        warehouse_id: warehouseId,
        snapshot_date: snapshotDate,
      })
      .toArray();
    return docs.map((d) => this.toDomain(d));
  }

  private toDomain(doc: any): InventoryValuationSnapshot {
    return {
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      warehouseId: doc.warehouse_id.toString(),
      productId: doc.product_id.toString(),
      variantId: doc.variant_id ?? null,
      batchId: doc.batch_id ?? null,
      quantityOnHand: doc.quantity_on_hand ?? 0,
      costPricePiasters: doc.cost_price_piasters ?? 0,
      totalValuePiasters: doc.total_value_piasters ?? 0,
      snapshotDate: doc.snapshot_date,
      createdAt: doc.created_at ?? new Date(),
      updatedAt: doc.updated_at ?? new Date(),
    };
  }
}

export class EmployeePerformanceSnapshotRepository {
  async upsert(snapshot: Omit<EmployeePerformanceSnapshot, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>('employee_performance_snapshot').updateOne(
      {
        company_id: snapshot.companyId,
        branch_id: snapshot.branchId,
        employee_id: snapshot.employeeId,
        date: snapshot.date,
      },
      {
        $set: {
          shift_session_id: snapshot.shiftSessionId,
          orders_handled: snapshot.ordersHandled,
          total_sales_piasters: snapshot.totalSalesPiasters,
          total_returns_piasters: snapshot.totalReturnsPiasters,
          return_rate: snapshot.returnRate,
          updated_at: new Date(),
        },
        $setOnInsert: {
          _id: snapshot.id,
          company_id: snapshot.companyId,
          branch_id: snapshot.branchId,
          employee_id: snapshot.employeeId,
          date: snapshot.date,
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async findByCompanyBranchEmployeeDate(
    companyId: string,
    branchId: string,
    employeeId: string,
    date: string,
  ): Promise<EmployeePerformanceSnapshot | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('employee_performance_snapshot').findOne({
      company_id: companyId,
      branch_id: branchId,
      employee_id: employeeId,
      date,
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  private toDomain(doc: any): EmployeePerformanceSnapshot {
    return {
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      branchId: doc.branch_id.toString(),
      employeeId: doc.employee_id.toString(),
      shiftSessionId: doc.shift_session_id ?? null,
      date: doc.date,
      ordersHandled: doc.orders_handled ?? 0,
      totalSalesPiasters: doc.total_sales_piasters ?? 0,
      totalReturnsPiasters: doc.total_returns_piasters ?? 0,
      returnRate: doc.return_rate ?? 0,
      createdAt: doc.created_at ?? new Date(),
      updatedAt: doc.updated_at ?? new Date(),
    };
  }

  async findByCompanyBranchDateRange(
    companyId: string,
    branchId: string,
    fromDate: string,
    toDate: string,
  ): Promise<EmployeePerformanceSnapshot[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('employee_performance_snapshot')
      .find({
        company_id: companyId,
        branch_id: branchId,
        date: { $gte: fromDate, $lte: toDate },
      })
      .toArray();
    return docs.map((d) => this.toDomain(d));
  }
}

export class MongoCustomerLoyaltySnapshotRepository {
  async upsert(snapshot: Omit<CustomerLoyaltySnapshot, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>('customer_loyalty_snapshot').updateOne(
      {
        company_id: snapshot.companyId,
        customer_id: snapshot.customerId,
        snapshot_date: snapshot.snapshotDate,
      },
      {
        $set: {
          tier: snapshot.tier,
          total_points_earned: snapshot.totalPointsEarned,
          total_points_redeemed: snapshot.totalPointsRedeemed,
          current_balance: snapshot.currentBalance,
          updated_at: new Date(),
        },
        $setOnInsert: {
          _id: snapshot.id,
          company_id: snapshot.companyId,
          customer_id: snapshot.customerId,
          snapshot_date: snapshot.snapshotDate,
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async findByCompanyCustomerSnapshotDate(
    companyId: string,
    customerId: string,
    snapshotDate: string,
  ): Promise<CustomerLoyaltySnapshot | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('customer_loyalty_snapshot').findOne({
      company_id: companyId,
      customer_id: customerId,
      snapshot_date: snapshotDate,
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByCompanyDateRange(
    companyId: string,
    fromDate: string,
    toDate: string,
  ): Promise<CustomerLoyaltySnapshot[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('customer_loyalty_snapshot')
      .find({
        company_id: companyId,
        snapshot_date: { $gte: fromDate, $lte: toDate },
      })
      .toArray();
    return docs.map((d) => this.toDomain(d));
  }

  private toDomain(doc: any): CustomerLoyaltySnapshot {
    return {
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      customerId: doc.customer_id.toString(),
      tier: doc.tier ?? null,
      totalPointsEarned: doc.total_points_earned ?? 0,
      totalPointsRedeemed: doc.total_points_redeemed ?? 0,
      currentBalance: doc.current_balance ?? 0,
      snapshotDate: doc.snapshot_date,
      createdAt: doc.created_at ?? new Date(),
      updatedAt: doc.updated_at ?? new Date(),
    };
  }
}

export class MongoReportPaymentTransactionRepository {
  async findByCompanyDateRange(companyId: string, from: string, to: string): Promise<any[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('payments')
      .find({
        company_id: companyId,
        created_at: { $gte: new Date(from), $lte: new Date(to) },
      })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      orderId: d.order_id.toString(),
      companyId: d.company_id.toString(),
      tenderType: d.tender_type,
      amountPiasters: d.amount_piasters,
      createdAt: d.created_at?.toISOString() || new Date().toISOString(),
    }));
  }
}

export class MongoReportStockMovementRepository {
  async findByCompanyWarehouseDateRange(
    companyId: string,
    warehouseId: string,
    from: string,
    to: string,
  ): Promise<any[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_movement_events')
      .find({
        company_id: companyId,
        warehouse_id: warehouseId,
        created_at: { $gte: new Date(from), $lte: new Date(to) },
      })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      companyId: d.company_id.toString(),
      warehouseId: d.warehouse_id.toString(),
      productId: d.product_id.toString(),
      variantId: d.variant_id,
      batchId: d.batch_id,
      eventType: d.event_type,
      quantity: d.quantity,
      createdAt: d.created_at?.toISOString() || new Date().toISOString(),
    }));
  }
}

export class MongoReportOrderRepository {
  async findByCompanyBranchDateRange(companyId: string, branchId: string, from: string, to: string): Promise<any[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('orders')
      .find({
        company_id: companyId,
        branch_id: branchId,
        status: 'completed',
        created_at: { $gte: new Date(from), $lte: new Date(to) },
      })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      companyId: d.company_id.toString(),
      branchId: d.branch_id.toString(),
      cashierId: d.cashier_id.toString(),
      customerId: d.customer_id?.toString() ?? null,
      grandTotalPiasters: d.grand_total,
      subtotalPiasters: d.subtotal,
      taxTotalPiasters: d.tax_total,
      discountTotalPiasters: d.discount_total,
      createdAt: d.created_at?.toISOString() || new Date().toISOString(),
    }));
  }
}

export class MongoReportShiftRepository {
  async findByCompanyBranchDateRange(companyId: string, branchId: string, from: string, to: string): Promise<any[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('shift_sessions')
      .find({
        company_id: companyId,
        branch_id: branchId,
        opened_at: { $gte: new Date(from), $lte: new Date(to) },
      })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      companyId: d.company_id.toString(),
      branchId: d.branch_id.toString(),
      cashierId: d.cashier_id.toString(),
      status: d.status,
      openingCashPiasters: d.opening_cash_piasters,
      closingCashPiasters: d.closing_cash_piasters,
      openedAt: d.opened_at?.toISOString() || new Date().toISOString(),
      closedAt: d.closed_at?.toISOString() || null,
    }));
  }
}

export { EmployeePerformanceSnapshotRepository as MongoEmployeePerformanceSnapshotRepository };
