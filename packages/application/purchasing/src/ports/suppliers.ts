import { Supplier, SupplierLedgerEntry, SupplierPriceHistory } from '@packages/domain-purchasing';

export interface SupplierFilter {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface SupplierRepository {
  findById(id: string, companyId: string): Promise<Supplier | null>;
  findByCompany(companyId: string, filter?: SupplierFilter): Promise<Supplier[]>;
  findByPhone(phone: string, companyId: string): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<void>;
}

export interface SupplierLedgerEntryRepository {
  findBySupplier(
    supplierId: string,
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<SupplierLedgerEntry[]>;
  append(entry: SupplierLedgerEntry): Promise<void>;
  countBySupplier(supplierId: string, companyId: string): Promise<number>;
}

export interface SupplierPriceHistoryRepository {
  findBySupplier(
    supplierId: string,
    companyId: string,
    productId?: string,
    limit?: number,
    offset?: number,
  ): Promise<SupplierPriceHistory[]>;
  save(entry: SupplierPriceHistory): Promise<void>;
}
