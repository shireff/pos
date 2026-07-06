export type PurchaseOrderStatus =
  'draft' | 'pending_approval' | 'approved' | 'received' | 'cancelled';

export type SupplierInvoiceOcrStatus =
  'uploaded' | 'extracting' | 'extracted' | 'reviewed' | 'confirmed' | 'discarded';
