import { PurchaseOrder, GoodsReceipt, SupplierInvoice } from '@packages/domain-purchasing';
import {
  StockMovementEventRepository,
  StockItemRepository,
} from '@packages/application-inventory';

export type { StockMovementEventRepository, StockItemRepository };

export interface PurchaseOrderFilter {
  status?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PurchaseOrderRepository {
  findById(id: string, companyId: string): Promise<PurchaseOrder | null>;
  findByCompany(
    companyId: string,
    filter?: PurchaseOrderFilter,
  ): Promise<PurchaseOrder[]>;
  save(po: PurchaseOrder): Promise<void>;
}

export interface GoodsReceiptRepository {
  findById(id: string): Promise<GoodsReceipt | null>;
  findByPurchaseOrder(purchaseOrderId: string): Promise<GoodsReceipt[]>;
  save(gr: GoodsReceipt): Promise<void>;
}

export interface SupplierInvoiceRepository {
  findById(id: string): Promise<SupplierInvoice | null>;
  findByPurchaseOrder(purchaseOrderId: string): Promise<SupplierInvoice[]>;
  save(invoice: SupplierInvoice): Promise<void>;
}
