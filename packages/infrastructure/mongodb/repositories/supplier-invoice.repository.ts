import { SupplierInvoice, SupplierInvoiceProps } from '@packages/domain-purchasing';
import { getMongoDb } from '../src/mongo-connection';

export class MongoSupplierInvoiceRepository {
  async findById(id: string): Promise<SupplierInvoice | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('supplier_invoices').findOne({ _id: id });
    if (!doc) return null;
    return this.reconstitute(doc);
  }

  async findByPurchaseOrder(purchaseOrderId: string): Promise<SupplierInvoice[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('supplier_invoices')
      .find({ purchase_order_id: purchaseOrderId })
      .sort({ invoice_date: -1 })
      .toArray();
    return docs.map((d: any) => this.reconstitute(d));
  }

  async save(invoice: SupplierInvoice): Promise<void> {
    const db = await getMongoDb();
    const snap = invoice as unknown as SupplierInvoiceProps;
    const now = new Date();

    await db.collection<any>('supplier_invoices').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          purchase_order_id: snap.purchaseOrderId,
          supplier_id: snap.supplierId,
          invoice_number: snap.invoiceNumber,
          invoice_date: new Date(snap.invoiceDate),
          total_amount_piasters: snap.totalAmountPiasters,
          tax_amount_piasters: snap.taxAmountPiasters,
          attachment_url: snap.attachmentUrl,
          status: snap.status,
          hlc_timestamp: new Date().toISOString(),
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true },
    );
  }

  private reconstitute(doc: any): SupplierInvoice {
    return SupplierInvoice.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      purchaseOrderId: doc.purchase_order_id.toString(),
      supplierId: doc.supplier_id.toString(),
      invoiceNumber: doc.invoice_number,
      invoiceDate: new Date(doc.invoice_date).toISOString(),
      totalAmountPiasters: doc.total_amount_piasters,
      taxAmountPiasters: doc.tax_amount_piasters,
      attachmentUrl: doc.attachment_url ?? null,
      status: doc.status,
      createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
    });
  }
}
