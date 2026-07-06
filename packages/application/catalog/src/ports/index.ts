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
}

export interface CategoryRepository {
  findById(id: string, companyId: string): Promise<Category | null>;
  findAll(companyId: string): Promise<Category[]>;
  save(category: Category): Promise<void>;
}

export interface UnitOfMeasureRepository {
  findByProduct(productId: string): Promise<UnitOfMeasure[]>;
  save(unit: UnitOfMeasure): Promise<void>;
}
