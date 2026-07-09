import { Db } from 'mongodb';
import { Order, OrderLine, Payment, Return } from '@packages/domain-sales';
import { getMongoDb } from '../src/mongo-connection';
import { OrderRepository, OrderFilter } from '@packages/application-sales';

export class MongoOrderRepository implements OrderRepository {
  private collection() {
    return getMongoDb().then((db) => db.collection<any>('orders'));
  }

  async findById(id: string, companyId: string): Promise<Order | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('orders').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return this.reconstituteWithRelations(db, doc);
  }

  async findByClientTxnId(clientTxnId: string, companyId: string): Promise<Order | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection<any>('orders')
      .findOne({ client_txn_id: clientTxnId, company_id: companyId });
    if (!doc) return null;
    return this.reconstituteWithRelations(db, doc);
  }

  async findByCompany(companyId: string, filter?: OrderFilter): Promise<Order[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { company_id: companyId };
    if (filter?.branchId) query.branch_id = filter.branchId;
    if (filter?.cashierId) query.cashier_id = filter.cashierId;
    if (filter?.status) query.status = filter.status;
    if (filter?.dateFrom || filter?.dateTo) {
      query.created_at = {};
      if (filter.dateFrom) (query.created_at as any).$gte = new Date(filter.dateFrom);
      if (filter.dateTo) (query.created_at as any).$lte = new Date(filter.dateTo);
    }
    const docs = await db.collection<any>('orders').find(query).sort({ created_at: -1 }).toArray();
    const orders: Order[] = [];
    for (const doc of docs) {
      orders.push(await this.reconstituteWithRelations(db, doc));
    }
    return orders;
  }

  async findByShiftSession(shiftSessionId: string): Promise<Order[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('orders')
      .find({ shift_session_id: shiftSessionId })
      .sort({ created_at: -1 })
      .toArray();
    const orders: Order[] = [];
    for (const doc of docs) {
      orders.push(await this.reconstituteWithRelations(db, doc));
    }
    return orders;
  }

  private async reconstituteWithRelations(db: Db, doc: any): Promise<Order> {
    const lineDocs = await db.collection<any>('order_lines').find({ order_id: doc._id }).toArray();
    const paymentDocs = await db.collection<any>('payments').find({ order_id: doc._id }).toArray();
    const returnDocs = await db
      .collection<any>('returns')
      .find({ original_order_id: doc._id })
      .toArray();

    const lines = lineDocs.map((l) =>
      OrderLine.reconstitute({
        id: l._id.toString(),
        orderId: l.order_id.toString(),
        productVariantId: l.product_variant_id,
        batchId: l.batch_id ?? null,
        quantity: l.quantity,
        unitPricePiasters: l.unit_price_piasters,
        discountAmountPiasters: l.discount_amount_piasters ?? 0,
        taxAmountPiasters: l.tax_amount_piasters ?? 0,
        costSnapshotPiasters: l.cost_snapshot_piasters ?? 0,
      }),
    );
    const payments = paymentDocs.map((p) =>
      Payment.reconstitute({
        id: p._id.toString(),
        orderId: p.order_id.toString(),
        tenderType: p.tender_type,
        amountPiasters: p.amount_piasters,
        providerReference: p.provider_reference ?? null,
      }),
    );
    const returns = returnDocs.map((r) => this.mapReturn(db, r));

    return Order.reconstitute(
      {
        id: doc._id.toString(),
        companyId: doc.company_id,
        branchId: doc.branch_id,
        cashierId: doc.cashier_id,
        customerId: doc.customer_id ?? null,
        clientTxnId: doc.client_txn_id,
        shiftSessionId: doc.shift_session_id ?? null,
        status: doc.status,
        subtotalPiasters: doc.subtotal ?? 0,
        discountTotalPiasters: doc.discount_total ?? 0,
        taxTotalPiasters: doc.tax_total ?? 0,
        grandTotalPiasters: doc.grand_total ?? 0,
        createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
      },
      lines.map((l) => ({
        id: l.id,
        orderId: l.orderId,
        productVariantId: l.productVariantId,
        batchId: l.batchId,
        quantity: l.quantity,
        unitPricePiasters: l.unitPricePiasters,
        discountAmountPiasters: l.discountAmountPiasters,
        taxAmountPiasters: l.taxAmountPiasters,
        costSnapshotPiasters: l.costSnapshotPiasters,
      })),
      payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        tenderType: p.tenderType,
        amountPiasters: p.amountPiasters,
        providerReference: p.providerReference,
      })),
      returns.map((r) => ({
        id: r.id,
        originalOrderId: r.originalOrderId,
        returnedByUserId: r.returnedByUserId,
        approvedByUserId: r.approvedByUserId,
        reason: r.reason,
        refundMethod: r.refundMethod,
        status: r.status,
        refundAmountPiasters: r.refundAmountPiasters,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        lines: r.lines.map((rl) => ({
          id: rl.id,
          returnId: rl.returnId,
          originalOrderLineId: rl.originalOrderLineId,
          productVariantId: rl.productVariantId,
          batchId: rl.batchId,
          quantity: rl.quantity,
          refundAmountPiasters: rl.refundAmountPiasters,
        })),
      })),
    );
  }

  private mapReturn(_db: Db, r: any): Return {
    return Return.reconstitute({
      id: r._id.toString(),
      originalOrderId: r.original_order_id,
      returnedByUserId: r.returned_by_user_id,
      approvedByUserId: r.approved_by_user_id ?? null,
      reason: r.reason,
      refundMethod: r.refund_method,
      status: r.status,
      refundAmountPiasters: r.refund_amount_piasters,
      createdAt: r.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: r.updated_at?.toISOString() || new Date().toISOString(),
      lines: [],
    });
  }

  async save(order: Order): Promise<void> {
    const db = await getMongoDb();
    const now = new Date();
    const snap = order as any;
    await db.collection<any>('orders').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          branch_id: snap.branchId,
          cashier_id: snap.cashierId,
          customer_id: snap.customerId,
          client_txn_id: snap.clientTxnId,
          shift_session_id: snap.shiftSessionId,
          status: snap.status,
          subtotal: snap.subtotalPiasters,
          discount_total: snap.discountTotalPiasters,
          tax_total: snap.taxTotalPiasters,
          grand_total: snap.grandTotalPiasters,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );

    for (const line of snap.lines as OrderLine[]) {
      await db.collection<any>('order_lines').updateOne(
        { _id: line.id },
        {
          $set: {
            order_id: line.orderId,
            product_variant_id: line.productVariantId,
            batch_id: line.batchId,
            quantity: line.quantity,
            unit_price_piasters: line.unitPricePiasters,
            discount_amount_piasters: line.discountAmountPiasters,
            tax_amount_piasters: line.taxAmountPiasters,
            cost_snapshot_piasters: line.costSnapshotPiasters,
            updated_at: now,
          },
          $setOnInsert: { created_at: now },
        },
        { upsert: true },
      );
    }

    for (const payment of snap.payments as Payment[]) {
      await db.collection<any>('payments').updateOne(
        { _id: payment.id },
        {
          $set: {
            order_id: payment.orderId,
            company_id: snap.companyId,
            tender_type: payment.tenderType,
            amount_piasters: payment.amountPiasters,
            provider_reference: payment.providerReference,
            created_at: now,
          },
        },
        { upsert: true },
      );
    }
  }
}
