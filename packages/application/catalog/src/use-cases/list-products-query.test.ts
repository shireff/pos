import { describe, expect, it } from 'vitest';
import { Product } from '@packages/domain-catalog';
import { ListProductsQueryUseCase } from './index';
import type { ProductRepository } from '../ports';

class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly products: Product[] = []) {}

  async findById(id: string, companyId: string): Promise<Product | null> {
    return (
      this.products.find((product) => product.id === id && product.companyId === companyId) ?? null
    );
  }

  async findByBarcode(): Promise<Product | null> {
    return null;
  }

  async findAll(
    companyId: string,
    filter?: { categoryId?: string; isDeleted?: boolean },
  ): Promise<Product[]> {
    return this.products.filter((product) => {
      if (product.companyId !== companyId) return false;
      if (filter?.categoryId && product.categoryId !== filter.categoryId) return false;
      if (filter?.isDeleted !== undefined && product.isDeleted !== filter.isDeleted) return false;
      return true;
    });
  }

  async save(): Promise<void> {
    return;
  }

  async isBarcodeUnique(): Promise<boolean> {
    return true;
  }
}

describe('ListProductsQueryUseCase', () => {
  it('returns active products sorted and paginated', async () => {
    const alpha = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Alpha Product',
      description: 'Alpha description',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const beta = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Beta Product',
      description: 'Beta description',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const archived = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Archived Product',
      description: 'Archived description',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    archived.archive();

    const repository = new InMemoryProductRepository([alpha, beta, archived]);
    const useCase = new ListProductsQueryUseCase(repository);

    const result = await useCase.execute({
      companyId: 'company-1',
      status: 'active',
      search: 'product',
      sortBy: 'name',
      limit: 1,
      offset: 0,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Alpha Product');
    expect(result.total).toBe(2);
  });

  it('returns an empty list when no products match', async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new ListProductsQueryUseCase(repository);

    const result = await useCase.execute({ companyId: 'company-1', search: 'missing' });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
