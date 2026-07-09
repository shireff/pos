import { Product } from '@packages/domain-catalog';
import { Category, UnitOfMeasure } from '@packages/domain-catalog';

export interface ProductRepository {
  findById(id: string, companyId: string): Promise<Product | null>;
  findByBarcode(barcode: string, companyId: string): Promise<Product | null>;
  findAll(
    companyId: string,
    filter?: { categoryId?: string; isDeleted?: boolean },
  ): Promise<Product[]>;
  save(product: Product): Promise<void>;
  isBarcodeUnique(barcode: string, companyId: string, excludeVariantId?: string): Promise<boolean>;
  /** Optional — required only by purchasing integration (Phase 08). */
  hasOpenPurchaseOrderLines?(productId: string, companyId: string): Promise<boolean>;
}

export interface CategoryRepository {
  findById(id: string, companyId: string): Promise<Category | null>;
  findAll(companyId: string): Promise<Category[]>;
  findChildren(parentId: string | null, companyId: string): Promise<Category[]>;
  findByPath(pathPrefix: string, companyId: string): Promise<Category[]>;
  hasActiveProducts(categoryId: string, companyId: string): Promise<boolean>;
  save(category: Category): Promise<void>;
  saveAll(categories: Category[]): Promise<void>;
}

export interface CompanyUnitRepository {
  findById(id: string, companyId: string): Promise<UnitOfMeasure | null>;
  findAll(companyId: string): Promise<UnitOfMeasure[]>;
  existsByAbbreviation(
    abbreviation: string,
    companyId: string,
    excludeId?: string,
  ): Promise<boolean>;
  hasActiveProductReferences(unitId: string, companyId: string): Promise<boolean>;
  save(unit: UnitOfMeasure): Promise<void>;
}

export interface UnitOfMeasureRepository {
  findByProduct(productId: string): Promise<UnitOfMeasure[]>;
  save(unit: UnitOfMeasure): Promise<void>;
}
