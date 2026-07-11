import { EventBus, eventBus } from './event-bus';
import {
  OrderCompleted,
  ReturnApproved,
  ShiftSessionClosed,
} from '@packages/domain-sales';
import { StockMovementRecorded } from '@packages/domain-inventory';
import { getReportsRepos } from './ports';
import { Identifier } from '@packages/shared-kernel';
import {
  MongoOrderRepository,
  MongoReturnRepository,
  MongoWarehouseRepository,
  MongoStockMovementEventRepository,
} from '@packages/infrastructure-mongodb';
import { getMongoDb } from '@packages/infrastructure-mongodb';

export class ProjectionWorker {
  private readonly repos = getReportsRepos();
  private readonly processedEventIds: Set<string> = new Set();
  private readonly orderRepo: MongoOrderRepository;
  private readonly returnRepo: MongoReturnRepository;
  private readonly warehouseRepo: MongoWarehouseRepository;
  private readonly movementRepo: MongoStockMovementEventRepository;
  private unsubscribe: (() => void)[] = [];

  constructor(
    eventBusInstance: EventBus = eventBus,
    orderRepo?: MongoOrderRepository,
    returnRepo?: MongoReturnRepository,
    warehouseRepo?: MongoWarehouseRepository,
    movementRepo?: MongoStockMovementEventRepository,
  ) {
    this.orderRepo = orderRepo ?? new MongoOrderRepository();
    this.returnRepo = returnRepo ?? new MongoReturnRepository();
    this.warehouseRepo = warehouseRepo ?? new MongoWarehouseRepository();
    this.movementRepo = movementRepo ?? new MongoStockMovementEventRepository();

    this.unsubscribe.push(
      eventBusInstance.subscribe<OrderCompleted>('OrderCompleted', (event) =>
        this.handleOrderCompleted(event),
      ),
    );
    this.unsubscribe.push(
      eventBusInstance.subscribe<ReturnApproved>('ReturnApproved', (event) =>
        this.handleReturnApproved(event),
      ),
    );
    this.unsubscribe.push(
      eventBusInstance.subscribe<StockMovementRecorded>('StockMovementRecorded', (event) =>
        this.handleStockMovementRecorded(event),
      ),
    );
    this.unsubscribe.push(
      eventBusInstance.subscribe<ShiftSessionClosed>('ShiftSessionClosed', (event) =>
        this.handleShiftSessionClosed(event),
      ),
    );
  }

  stop(): void {
    for (const unsub of this.unsubscribe) {
      unsub();
    }
    this.unsubscribe = [];
  }

  private async ensureIdempotent(eventId: string): Promise<boolean> {
    if (this.processedEventIds.has(eventId)) {
      return false;
    }
    this.processedEventIds.add(eventId);
    return true;
  }

  private async getOrderCompanyBranch(orderId: string): Promise<{ companyId: string; branchId: string } | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('orders').findOne({ _id: orderId });
    if (!doc) return null;
    return { companyId: doc.company_id.toString(), branchId: doc.branch_id.toString() };
  }

  private async handleOrderCompleted(event: OrderCompleted): Promise<void> {
    if (!(await this.ensureIdempotent(event.eventId))) return;
    const order = await this.orderRepo.findById(event.aggregateId, event.companyId);
    if (!order) return;
    const date = event.occurredAt.slice(0, 10);
    const existing = await this.repos.dailySalesRollupRepo.findByCompanyBranchDate(
      order.companyId,
      order.branchId,
      date,
    );
    if (existing) {
      await this.repos.dailySalesRollupRepo.upsert({
        id: existing.id,
        companyId: order.companyId,
        branchId: order.branchId,
        date,
        grossRevenuePiasters: existing.grossRevenuePiasters + order.grandTotalPiasters,
        taxAmountPiasters: existing.taxAmountPiasters + order.taxTotalPiasters,
        discountAmountPiasters: existing.discountAmountPiasters + order.discountTotalPiasters,
        transactionCount: existing.transactionCount + 1,
      });
    } else {
      await this.repos.dailySalesRollupRepo.upsert({
        id: Identifier.generate(),
        companyId: order.companyId,
        branchId: order.branchId,
        date,
        grossRevenuePiasters: order.grandTotalPiasters,
        taxAmountPiasters: order.taxTotalPiasters,
        discountAmountPiasters: order.discountTotalPiasters,
        transactionCount: 1,
      });
    }
  }

  private async handleReturnApproved(event: ReturnApproved): Promise<void> {
    if (!(await this.ensureIdempotent(event.eventId))) return;
    const orderContext = await this.getOrderCompanyBranch(event.originalOrderId);
    if (!orderContext) return;
    const date = event.occurredAt.slice(0, 10);
    const existing = await this.repos.dailySalesRollupRepo.findByCompanyBranchDate(
      orderContext.companyId,
      orderContext.branchId,
      date,
    );
    if (existing) {
      await this.repos.dailySalesRollupRepo.upsert({
        id: existing.id,
        companyId: orderContext.companyId,
        branchId: orderContext.branchId,
        date,
        grossRevenuePiasters: existing.grossRevenuePiasters - event.refundAmountPiasters,
        taxAmountPiasters: existing.taxAmountPiasters,
        discountAmountPiasters: existing.discountAmountPiasters,
        transactionCount: existing.transactionCount,
      });
    }
  }

  private async handleStockMovementRecorded(event: StockMovementRecorded): Promise<void> {
    if (!(await this.ensureIdempotent(event.eventId))) return;
    const warehouse = await this.warehouseRepo.findById(event.warehouseId);
    if (!warehouse) return;
    const companyId = warehouse.companyId;
    const snapshotDate = event.occurredAt.slice(0, 10);
    const existingArray = await this.repos.inventoryValuationRepo.findByCompanyWarehouseDate(
      companyId,
      event.warehouseId,
      snapshotDate,
    );
    const existing = existingArray[0] ?? null;
    if (existing) {
      await this.repos.inventoryValuationRepo.upsert({
        id: existing.id,
        companyId,
        warehouseId: event.warehouseId,
        productId: event.productId,
        variantId: event.variantId,
        batchId: event.batchId,
        quantityOnHand: existing.quantityOnHand + event.quantity,
        costPricePiasters: existing.costPricePiasters,
        totalValuePiasters: existing.totalValuePiasters,
        snapshotDate,
      });
    } else {
      await this.repos.inventoryValuationRepo.upsert({
        id: Identifier.generate(),
        companyId,
        warehouseId: event.warehouseId,
        productId: event.productId,
        variantId: event.variantId,
        batchId: event.batchId,
        quantityOnHand: event.quantity,
        costPricePiasters: 0,
        totalValuePiasters: 0,
        snapshotDate,
      });
    }
  }

  private async handleShiftSessionClosed(event: ShiftSessionClosed): Promise<void> {
    if (!(await this.ensureIdempotent(event.eventId))) return;
    const date = event.occurredAt.slice(0, 10);
    const existing = await this.repos.employeePerformanceRepo.findByCompanyBranchEmployeeDate(
      event.companyId,
      event.branchId,
      event.cashierId,
      date,
    );
    if (existing) {
      await this.repos.employeePerformanceRepo.upsert({
        id: existing.id,
        companyId: event.companyId,
        branchId: event.branchId,
        employeeId: event.cashierId,
        shiftSessionId: event.aggregateId,
        date,
        ordersHandled: existing.ordersHandled,
        totalSalesPiasters: existing.totalSalesPiasters,
        totalReturnsPiasters: existing.totalReturnsPiasters,
        returnRate: existing.returnRate,
      });
    } else {
      await this.repos.employeePerformanceRepo.upsert({
        id: Identifier.generate(),
        companyId: event.companyId,
        branchId: event.branchId,
        employeeId: event.cashierId,
        shiftSessionId: event.aggregateId,
        date,
        ordersHandled: 0,
        totalSalesPiasters: 0,
        totalReturnsPiasters: 0,
        returnRate: 0,
      });
    }
  }
}

let workerInstance: ProjectionWorker | null = null;

export function getProjectionWorker(): ProjectionWorker {
  if (!workerInstance) {
    workerInstance = new ProjectionWorker();
  }
  return workerInstance;
}
