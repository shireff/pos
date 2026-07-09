import {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderLineProps,
} from '@packages/domain-purchasing';
import { getMongoDb } from '../src/mongo-connection';

export class MongoPurchaseOrderRepository {
  async findById(id: string, companyId: string): Promise<PurchaseOrder | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection<any>('purchase_orders')
      .findOne({ _id: id, company_id: companyId });
    if (!doc) return null;

    const lineDocs = await db
      .collection<any>('purchase_order_lines')
      .find({ purchase_order_id: id })
      .toArray();

    const lines: PurchaseOrderLineProps[] = lineDocs.map((l: any) => ({
      id: l._id.toString(),
      purchaseOrderId: l.purchase_order_id.toString(),
      productId: l.product_id.toString(),
      variantId: l.variant_id ? l.variant_id.toString() : null,
      unitId: l.unit_id.toString(),
      orderedQuantity: l.ordered_quantity,
      unitPricePiasters: l.unit_price_piasters,
      receivedQuantity: l.received_quantity ?? 0,
    }));

    return PurchaseOrder.reconstitute(
      {
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        branchId: doc.branch_id.toString(),
        supplierId: doc.supplier_id.toString(),
        referenceNumber: doc.reference_number,
        status: doc.status,
        expectedDeliveryDate: new Date(doc.expected_delivery_date).toISOString(),
        notes: doc.notes ?? null,
        requestedByUserId: doc.requested_by_user_id.toString(),
        approvedByUserId: doc.approved_by_user_id ? doc.approved_by_user_id.toString() : null,
        rejectedReason: doc.rejected_reason ?? null,
        cancelledReason: doc.cancelled_reason ?? null,
        totalAmountPiasters: doc.total_amount_piasters ?? 0,
        createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
      },
      lines,
    );
  }

  async findByCompany(
    companyId: string,
    filter?: {
      status?: string;
      supplierId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<PurchaseOrder[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { company_id: companyId };
    if (filter?.status) query.status = filter.status;
    if (filter?.supplierId) query.supplier_id = filter.supplierId;
    if (filter?.dateFrom || filter?.dateTo) {
      query.expected_delivery_date = {};
      if (filter.dateFrom) (query.expected_delivery_date as Record<string, unknown>).$gte = new Date(filter.dateFrom);
      if (filter.dateTo) (query.expected_delivery_date as Record<string, unknown>).$lte = new Date(filter.dateTo);
    }

    const docs = await db
      .collection<any>('purchase_orders')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    const ids = docs.map((d) => d._id.toString());
    const lineDocs = ids.length
      ? await db
          .collection<any>('purchase_order_lines')
          .find({ purchase_order_id: { $in: ids } })
          .toArray()
      : [];

    const linesByPo = new Map<string, PurchaseOrderLineProps[]>();
    for (const l of lineDocs) {
      const poId = l.purchase_order_id.toString();
      if (!linesByPo.has(poId)) linesByPo.set(poId, []);
      linesByPo.get(poId)!.push({
        id: l._id.toString(),
        purchaseOrderId: poId,
        productId: l.product_id.toString(),
        variantId: l.variant_id ? l.variant_id.toString() : null,
        unitId: l.unit_id.toString(),
        orderedQuantity: l.ordered_quantity,
        unitPricePiasters: l.unit_price_piasters,
        receivedQuantity: l.received_quantity ?? 0,
      });
    }

    return docs.map((doc) =>
      PurchaseOrder.reconstitute(
        {
          id: doc._id.toString(),
          companyId: doc.company_id.toString(),
          branchId: doc.branch_id.toString(),
          supplierId: doc.supplier_id.toString(),
          referenceNumber: doc.reference_number,
          status: doc.status,
          expectedDeliveryDate: new Date(doc.expected_delivery_date).toISOString(),
          notes: doc.notes ?? null,
          requestedByUserId: doc.requested_by_user_id.toString(),
          approvedByUserId: doc.approved_by_user_id ? doc.approved_by_user_id.toString() : null,
          rejectedReason: doc.rejected_reason ?? null,
          cancelledReason: doc.cancelled_reason ?? null,
          totalAmountPiasters: doc.total_amount_piasters ?? 0,
          createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
          updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
        },
        linesByPo.get(doc._id.toString()) ?? [],
      ),
    );
  }

  async save(po: PurchaseOrder): Promise<void> {
    const db = await getMongoDb();
    const snap = po as unknown as {
      id: string;
      companyId: string;
      branchId: string;
      supplierId: string;
      referenceNumber: string;
      status: string;
      expectedDeliveryDate: string;
      notes: string | null;
      requestedByUserId: string;
      approvedByUserId: string | null;
      rejectedReason: string | null;
      cancelledReason: string | null;
      totalAmountPiasters: number;
      updatedAt: string;
      lines: readonly PurchaseOrderLine[];
    };
    const now = new Date();

    await db.collection<any>('purchase_orders').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          branch_id: snap.branchId,
          supplier_id: snap.supplierId,
          reference_number: snap.referenceNumber,
          status: snap.status,
          expected_delivery_date: new Date(snap.expectedDeliveryDate),
          notes: snap.notes,
          requested_by_user_id: snap.requestedByUserId,
          approved_by_user_id: snap.approvedByUserId,
          rejected_reason: snap.rejectedReason,
          cancelled_reason: snap.cancelledReason,
          total_amount_piasters: snap.totalAmountPiasters,
          hlc_timestamp: new Date().toISOString(),
          sync_version: 1,
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true },
    );

    await db
      .collection<any>('purchase_order_lines')
      .deleteMany({ purchase_order_id: snap.id });

    if (snap.lines.length > 0) {
      await db.collection<any>('purchase_order_lines').insertMany(
        snap.lines.map((line: PurchaseOrderLine) => {
          const l = line as unknown as PurchaseOrderLineProps;
          return {
            _id: l.id,
            purchase_order_id: snap.id,
            product_id: l.productId,
            variant_id: l.variantId,
            unit_id: l.unitId,
            ordered_quantity: l.orderedQuantity,
            unit_price_piasters: l.unitPricePiasters,
            received_quantity: l.receivedQuantity,
            line_total_piasters: l.orderedQuantity * l.unitPricePiasters,
            created_at: now,
            updated_at: now,
          };
        }),
      );
    }
  }
}
