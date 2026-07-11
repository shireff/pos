import {
  StockMovementEvent,
  StockItem,
  StockTransfer,
  Batch,
  Warehouse,
} from '@packages/domain-inventory';
import { getMongoDb } from '../src/mongo-connection';

export class MongoStockMovementEventRepository {
  async append(event: StockMovementEvent): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    await db.collection<any>('stock_movement_events').insertOne({
      _id: event.id,
      company_id: event.companyId,
      warehouse_id: event.warehouseId,
      product_id: event.productId,
      variant_id: event.variantId,
      batch_id: event.batchId,
      event_type: event.eventType,
      quantity: event.quantity,
      reference_type: event.referenceType,
      reference_id: event.referenceId,
      originating_device_id: '',
      sequence_no: Date.now(),
      causality_vector: {},
      created_at: now,
    });
  }

  async findByWarehouseAndProduct(
    warehouseId: string,
    productId: string,
    variantId?: string | null,
    batchId?: string | null,
  ): Promise<StockMovementEvent[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = {
      warehouse_id: warehouseId,
      product_id: productId,
    };
    if (variantId) query.variant_id = variantId;
    if (batchId) query.batch_id = batchId;

    const docs = await db.collection<any>('stock_movement_events').find(query).toArray();
    return docs.map((doc) =>
      StockMovementEvent.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        warehouseId: doc.warehouse_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        batchId: doc.batch_id,
        eventType: doc.event_type,
        quantity: doc.quantity,
        referenceType: doc.reference_type,
        referenceId: doc.reference_id,
        occurredAt: doc.created_at?.toISOString() || new Date().toISOString(),
      }),
    );
  }

  async findByProduct(companyId: string, productId: string): Promise<StockMovementEvent[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_movement_events')
      .find({ company_id: companyId, product_id: productId })
      .toArray();
    return docs.map((doc) =>
      StockMovementEvent.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        warehouseId: doc.warehouse_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        batchId: doc.batch_id,
        eventType: doc.event_type,
        quantity: doc.quantity,
        referenceType: doc.reference_type,
        referenceId: doc.reference_id,
        occurredAt: doc.created_at?.toISOString() || new Date().toISOString(),
      }),
    );
  }

  async findSince(deviceId: string, sequenceNo: number): Promise<StockMovementEvent[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_movement_events')
      .find({ originating_device_id: deviceId, sequence_no: { $gt: sequenceNo } })
      .toArray();
    return docs.map((doc) =>
      StockMovementEvent.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        warehouseId: doc.warehouse_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        batchId: doc.batch_id,
        eventType: doc.event_type,
        quantity: doc.quantity,
        referenceType: doc.reference_type,
        referenceId: doc.reference_id,
        occurredAt: doc.created_at?.toISOString() || new Date().toISOString(),
      }),
    );
  }

  async findById(id: string): Promise<StockMovementEvent | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('stock_movement_events').findOne({ _id: id });
    if (!doc) return null;
    return StockMovementEvent.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      warehouseId: doc.warehouse_id.toString(),
      productId: doc.product_id.toString(),
      variantId: doc.variant_id,
      batchId: doc.batch_id,
      eventType: doc.event_type,
      quantity: doc.quantity,
      referenceType: doc.reference_type,
      referenceId: doc.reference_id,
      occurredAt: doc.created_at?.toISOString() || new Date().toISOString(),
    });
  }

  /**
   * Append-only enforcement: stock movement events must NEVER be modified or
   * removed once recorded. Any UPDATE or DELETE attempt is rejected at the
   * repository boundary so the event stream remains the single source of truth.
   */
  async update(_id: string, _patch: Record<string, unknown>): Promise<void> {
    throw new Error('stock_movement_events is append-only: UPDATE is not permitted');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('stock_movement_events is append-only: DELETE is not permitted');
  }
}

export class MongoStockItemRepository {
  async findByWarehouseAndProduct(
    warehouseId: string,
    productId: string,
    variantId?: string | null,
    batchId?: string | null,
  ): Promise<StockItem | null> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = {
      warehouse_id: warehouseId,
      product_id: productId,
    };
    if (variantId) query.variant_id = variantId;
    if (batchId) query.batch_id = batchId;

    const doc = await db.collection<any>('stock_items').findOne(query);
    if (!doc) return null;

    return StockItem.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      productId: doc.product_id.toString(),
      variantId: doc.variant_id,
      warehouseId: doc.warehouse_id.toString(),
      batchId: doc.batch_id,
      quantityOnHand: doc.quantity_on_hand,
      reservedQuantity: doc.reserved_quantity ?? 0,
      reorderPoint: doc.reorder_point ?? 0,
      reorderQuantity: doc.reorder_quantity ?? 0,
      updatedFromSequence: doc.updated_from_sequence ?? 0,
    });
  }

  async findByWarehouse(warehouseId: string): Promise<StockItem[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_items')
      .find({ warehouse_id: warehouseId, is_deleted: { $ne: true } })
      .toArray();
    return docs.map((doc) =>
      StockItem.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        warehouseId: doc.warehouse_id.toString(),
        batchId: doc.batch_id,
        quantityOnHand: doc.quantity_on_hand,
        reservedQuantity: doc.reserved_quantity ?? 0,
        reorderPoint: doc.reorder_point ?? 0,
        reorderQuantity: doc.reorder_quantity ?? 0,
        updatedFromSequence: doc.updated_from_sequence ?? 0,
      }),
    );
  }

  async findByCompany(companyId: string): Promise<StockItem[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_items')
      .find({ company_id: companyId, is_deleted: { $ne: true } })
      .toArray();
    return docs.map((doc) =>
      StockItem.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        warehouseId: doc.warehouse_id.toString(),
        batchId: doc.batch_id,
        quantityOnHand: doc.quantity_on_hand,
        reservedQuantity: doc.reserved_quantity ?? 0,
        reorderPoint: doc.reorder_point ?? 0,
        reorderQuantity: doc.reorder_quantity ?? 0,
        updatedFromSequence: doc.updated_from_sequence ?? 0,
      }),
    );
  }

  async findBelowReorderPoint(companyId: string): Promise<StockItem[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_items')
      .find({ company_id: companyId, is_deleted: { $ne: true } })
      .toArray();
    return docs
      .map((doc) =>
        StockItem.reconstitute({
          id: doc._id.toString(),
          companyId: doc.company_id.toString(),
          productId: doc.product_id.toString(),
          variantId: doc.variant_id,
          warehouseId: doc.warehouse_id.toString(),
          batchId: doc.batch_id,
          quantityOnHand: doc.quantity_on_hand,
          reservedQuantity: doc.reserved_quantity ?? 0,
          reorderPoint: doc.reorder_point ?? 0,
          reorderQuantity: doc.reorder_quantity ?? 0,
          updatedFromSequence: doc.updated_from_sequence ?? 0,
        }),
      )
      .filter((item) => item.isBelowReorderPoint());
  }

  async save(item: StockItem): Promise<void> {
    const db = await getMongoDb();
    const snap = item as any;
    await db.collection<any>('stock_items').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          product_id: snap.productId,
          variant_id: snap.variantId,
          warehouse_id: snap.warehouseId,
          batch_id: snap.batchId,
          quantity_on_hand: snap.quantityOnHand,
          reserved_quantity: snap.reservedQuantity,
          reorder_point: snap.reorderPoint,
          reorder_quantity: snap.reorderQuantity,
          updated_from_sequence: snap.updatedFromSequence,
          is_deleted: false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  /**
   * Stock item quantity fields are a read-model projection cache and MUST only
   * be mutated by the projection worker via `save()`. This method previously
   * allowed a direct quantity write and has been removed to honour that
   * invariant. It is kept intentionally absent.
   */
}

export class MongoBatchRepository {
  async findById(id: string): Promise<Batch | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('batches').findOne({ _id: id });
    if (!doc) return null;
    return Batch.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      productId: doc.product_id.toString(),
      variantId: doc.variant_id,
      warehouseId: doc.warehouse_id.toString(),
      batchNumber: doc.batch_number,
      expiryDate: doc.expiry_date?.toISOString() ?? null,
      manufacturingDate: doc.manufacturing_date?.toISOString() ?? null,
      costPrice: doc.cost_price_piasters ?? 0,
      quantityRemaining: doc.quantity_remaining ?? 0,
      isDeleted: doc.is_deleted ?? false,
    });
  }

  async findByVariantAndWarehouse(
    productId: string,
    variantId: string | null,
    warehouseId: string,
  ): Promise<Batch[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = {
      product_id: productId,
      warehouse_id: warehouseId,
    };
    if (variantId) query.variant_id = variantId;

    const docs = await db.collection<any>('batches').find(query).toArray();
    return docs.map((doc) =>
      Batch.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        warehouseId: doc.warehouse_id.toString(),
        batchNumber: doc.batch_number,
        expiryDate: doc.expiry_date?.toISOString() ?? null,
        manufacturingDate: doc.manufacturing_date?.toISOString() ?? null,
        costPrice: doc.cost_price_piasters ?? 0,
        quantityRemaining: doc.quantity_remaining ?? 0,
        isDeleted: doc.is_deleted ?? false,
      }),
    );
  }

  async findExpiring(companyId: string, warehouseId: string, withinDays: number): Promise<Batch[]> {
    const db = await getMongoDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);
    const docs = await db
      .collection<any>('batches')
      .find({
        company_id: companyId,
        warehouse_id: warehouseId,
        expiry_date: { $lte: cutoff },
        is_deleted: { $ne: true },
      })
      .toArray();
    return docs.map((doc) =>
      Batch.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        warehouseId: doc.warehouse_id.toString(),
        batchNumber: doc.batch_number,
        expiryDate: doc.expiry_date?.toISOString() ?? null,
        manufacturingDate: doc.manufacturing_date?.toISOString() ?? null,
        costPrice: doc.cost_price_piasters ?? 0,
        quantityRemaining: doc.quantity_remaining ?? 0,
        isDeleted: doc.is_deleted ?? false,
      }),
    );
  }

  async findExpired(companyId: string, warehouseId: string): Promise<Batch[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('batches')
      .find({
        company_id: companyId,
        warehouse_id: warehouseId,
        expiry_date: { $lt: new Date() },
        is_deleted: { $ne: true },
      })
      .toArray();
    return docs.map((doc) =>
      Batch.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        productId: doc.product_id.toString(),
        variantId: doc.variant_id,
        warehouseId: doc.warehouse_id.toString(),
        batchNumber: doc.batch_number,
        expiryDate: doc.expiry_date?.toISOString() ?? null,
        manufacturingDate: doc.manufacturing_date?.toISOString() ?? null,
        costPrice: doc.cost_price_piasters ?? 0,
        quantityRemaining: doc.quantity_remaining ?? 0,
        isDeleted: doc.is_deleted ?? false,
      }),
    );
  }

  async save(batch: Batch): Promise<void> {
    const db = await getMongoDb();
    const snap = batch as any;
    await db.collection<any>('batches').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          product_id: snap.productId,
          variant_id: snap.variantId,
          warehouse_id: snap.warehouseId,
          batch_number: snap.batchNumber,
          expiry_date: snap.expiryDate ? new Date(snap.expiryDate) : null,
          manufacturing_date: snap.manufacturingDate ? new Date(snap.manufacturingDate) : null,
          cost_price_piasters: snap.costPrice,
          quantity_remaining: snap.quantityRemaining,
          is_deleted: snap.isDeleted ?? false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }
}

export class MongoWarehouseRepository {
  async findById(id: string): Promise<Warehouse | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('warehouses').findOne({ _id: id });
    if (!doc) return null;
    return Warehouse.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      name: doc.name,
      address: doc.address ?? null,
      isDefault: doc.is_default ?? false,
      isActive: doc.is_active ?? true,
      managerId: doc.manager_id ?? null,
      isDeleted: doc.is_deleted ?? false,
    });
  }

  async findByCompany(companyId: string): Promise<Warehouse[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('warehouses')
      .find({ company_id: companyId, is_deleted: { $ne: true } })
      .toArray();
    return docs.map((doc) =>
      Warehouse.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        name: doc.name,
        address: doc.address ?? null,
        isDefault: doc.is_default ?? false,
        isActive: doc.is_active ?? true,
        managerId: doc.manager_id ?? null,
        isDeleted: doc.is_deleted ?? false,
      }),
    );
  }

  async findDefault(companyId: string): Promise<Warehouse | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('warehouses').findOne({
      company_id: companyId,
      is_default: true,
      is_deleted: { $ne: true },
      is_active: true,
    });
    if (!doc) return null;
    return Warehouse.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      name: doc.name,
      address: doc.address ?? null,
      isDefault: doc.is_default ?? false,
      isActive: doc.is_active ?? true,
      managerId: doc.manager_id ?? null,
      isDeleted: doc.is_deleted ?? false,
    });
  }

  async save(warehouse: Warehouse): Promise<void> {
    const db = await getMongoDb();
    const snap = warehouse as any;
    await db.collection<any>('warehouses').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          name: snap.name,
          address: snap.address,
          is_default: snap.isDefault,
          is_active: snap.isActive,
          manager_id: snap.managerId,
          is_deleted: snap.isDeleted ?? false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }
}

export class MongoStockTransferRepository {
  async findById(id: string): Promise<StockTransfer | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('stock_transfers').findOne({ _id: id });
    if (!doc) return null;

    const lines = await db
      .collection<any>('stock_transfer_lines')
      .find({ transfer_id: id })
      .toArray();

    return StockTransfer.reconstitute(
      {
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        fromWarehouseId: doc.from_warehouse_id.toString(),
        toWarehouseId: doc.to_warehouse_id.toString(),
        status: doc.status,
        requestedByUserId: doc.requested_by_user_id.toString(),
        approvedByUserId: doc.approved_by_user_id?.toString() ?? null,
        shippedAt: doc.shipped_at?.toISOString() ?? null,
        receivedAt: doc.received_at?.toISOString() ?? null,
        cancelledAt: doc.cancelled_at?.toISOString() ?? null,
        notes: doc.notes ?? null,
        createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
        isDeleted: doc.is_deleted ?? false,
      },
      lines.map((l: any) => ({
        id: l._id.toString(),
        transferId: l.transfer_id.toString(),
        productId: l.product_id.toString(),
        variantId: l.variant_id,
        batchId: l.batch_id,
        quantityRequested: l.quantity_requested,
        quantityShipped: l.quantity_shipped ?? 0,
        quantityReceived: l.quantity_received ?? 0,
        notes: l.notes ?? null,
      })),
    );
  }

  async findByWarehouse(warehouseId: string): Promise<StockTransfer[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_transfers')
      .find({
        $or: [{ from_warehouse_id: warehouseId }, { to_warehouse_id: warehouseId }],
        is_deleted: { $ne: true },
      })
      .toArray();

    const result: StockTransfer[] = [];
    for (const doc of docs) {
      const lines = await db
        .collection<any>('stock_transfer_lines')
        .find({ transfer_id: doc._id.toString() })
        .toArray();
      result.push(
        StockTransfer.reconstitute(
          {
            id: doc._id.toString(),
            companyId: doc.company_id.toString(),
            fromWarehouseId: doc.from_warehouse_id.toString(),
            toWarehouseId: doc.to_warehouse_id.toString(),
            status: doc.status,
            requestedByUserId: doc.requested_by_user_id.toString(),
            approvedByUserId: doc.approved_by_user_id?.toString() ?? null,
            shippedAt: doc.shipped_at?.toISOString() ?? null,
            receivedAt: doc.received_at?.toISOString() ?? null,
            cancelledAt: doc.cancelled_at?.toISOString() ?? null,
            notes: doc.notes ?? null,
            createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
            isDeleted: doc.is_deleted ?? false,
          },
          lines.map((l: any) => ({
            id: l._id.toString(),
            transferId: l.transfer_id.toString(),
            productId: l.product_id.toString(),
            variantId: l.variant_id,
            batchId: l.batch_id,
            quantityRequested: l.quantity_requested,
            quantityShipped: l.quantity_shipped ?? 0,
            quantityReceived: l.quantity_received ?? 0,
            notes: l.notes ?? null,
          })),
        ),
      );
    }
    return result;
  }

  async findPendingApproval(companyId: string): Promise<StockTransfer[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('stock_transfers')
      .find({ company_id: companyId, status: 'pending_approval', is_deleted: { $ne: true } })
      .toArray();

    const result: StockTransfer[] = [];
    for (const doc of docs) {
      const lines = await db
        .collection<any>('stock_transfer_lines')
        .find({ transfer_id: doc._id.toString() })
        .toArray();
      result.push(
        StockTransfer.reconstitute(
          {
            id: doc._id.toString(),
            companyId: doc.company_id.toString(),
            fromWarehouseId: doc.from_warehouse_id.toString(),
            toWarehouseId: doc.to_warehouse_id.toString(),
            status: doc.status,
            requestedByUserId: doc.requested_by_user_id.toString(),
            approvedByUserId: doc.approved_by_user_id?.toString() ?? null,
            shippedAt: doc.shipped_at?.toISOString() ?? null,
            receivedAt: doc.received_at?.toISOString() ?? null,
            cancelledAt: doc.cancelled_at?.toISOString() ?? null,
            notes: doc.notes ?? null,
            createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
            isDeleted: doc.is_deleted ?? false,
          },
          lines.map((l: any) => ({
            id: l._id.toString(),
            transferId: l.transfer_id.toString(),
            productId: l.product_id.toString(),
            variantId: l.variant_id,
            batchId: l.batch_id,
            quantityRequested: l.quantity_requested,
            quantityShipped: l.quantity_shipped ?? 0,
            quantityReceived: l.quantity_received ?? 0,
            notes: l.notes ?? null,
          })),
        ),
      );
    }
    return result;
  }

  async save(transfer: StockTransfer): Promise<void> {
    const db = await getMongoDb();
    const snap = transfer as any;
    await db.collection<any>('stock_transfers').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          from_warehouse_id: snap.fromWarehouseId,
          to_warehouse_id: snap.toWarehouseId,
          status: snap.status,
          requested_by_user_id: snap.requestedByUserId,
          approved_by_user_id: snap.approvedByUserId,
          shipped_at: snap.shippedAt ? new Date(snap.shippedAt) : null,
          received_at: snap.receivedAt ? new Date(snap.receivedAt) : null,
          cancelled_at: snap.cancelledAt ? new Date(snap.cancelledAt) : null,
          notes: snap.notes,
          is_deleted: snap.isDeleted ?? false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );

    const existingLines = await db
      .collection<any>('stock_transfer_lines')
      .find({ transfer_id: snap.id })
      .toArray();
    const existingIds = new Set(existingLines.map((l: any) => l._id.toString()));
    const savedIds = new Set<string>();

    for (const line of snap.lines) {
      savedIds.add(line.id);
      await db.collection<any>('stock_transfer_lines').updateOne(
        { _id: line.id },
        {
          $set: {
            transfer_id: line.transferId,
            product_id: line.productId,
            variant_id: line.variantId,
            batch_id: line.batchId,
            quantity_requested: line.quantityRequested,
            quantity_shipped: line.quantityShipped,
            quantity_received: line.quantityReceived,
            notes: line.notes,
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true },
      );
    }

    for (const oldId of existingIds) {
      if (!savedIds.has(oldId)) {
        await db.collection<any>('stock_transfer_lines').deleteOne({ _id: oldId });
      }
    }
  }
}

export { MongoPurchaseOrderRepository } from './purchase-order.repository';
export { MongoGoodsReceiptRepository } from './goods-receipt.repository';
export { MongoSupplierInvoiceRepository } from './supplier-invoice.repository';
export { MongoOrderRepository } from './sales-order.repository';
export { MongoReturnRepository } from './sales-return.repository';
export { MongoShiftSessionRepository } from './sales-shift-session.repository';
export { MongoCustomerRepository } from './customer.repository';
export { MongoLoyaltyAccountRepository } from './loyalty-account.repository';
export { MongoLoyaltyEventRepository } from './loyalty-event.repository';
export { MongoCreditLedgerEntryRepository } from './credit-ledger-entry.repository';
export { MongoCreditLedgerBalanceRepository } from './credit-ledger.repository';
export { MongoPaymentTransactionRepository } from './payment-transaction.repository';
export { MongoPaymentMethodRepository } from './payment-method.repository';
export { MongoSupplierRepository } from './supplier.repository';
export { MongoSupplierLedgerEntryRepository } from './supplier-ledger-entry.repository';
export { MongoSupplierPriceHistoryRepository } from './supplier-price-history.repository';
export { MongoDiscountRepository } from './discount.repository';
export { MongoCouponRepository } from './coupon.repository';
export { MongoTaxRuleRepository } from './tax-rule.repository';
export { MongoPriceChangeRepository } from './price-change.repository';
