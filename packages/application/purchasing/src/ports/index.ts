import { PurchaseOrder } from '@packages/domain-purchasing';
import { Supplier } from '@packages/domain-purchasing';

export interface PurchaseOrderRepository {
  findById(id: string, companyId: string): Promise<PurchaseOrder | null>;
  findBySupplierId(supplierId: string, companyId: string): Promise<PurchaseOrder[]>;
  findPendingApproval(companyId: string): Promise<PurchaseOrder[]>;
  save(po: PurchaseOrder): Promise<void>;
}

export interface SupplierRepository {
  findById(id: string, companyId: string): Promise<Supplier | null>;
  findAll(companyId: string): Promise<Supplier[]>;
  save(supplier: Supplier): Promise<void>;
}
