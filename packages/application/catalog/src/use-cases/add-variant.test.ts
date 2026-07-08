import { describe, expect, it } from 'vitest';
import { Product } from '@packages/domain-catalog';
import { AddVariantUseCase } from './index';
import type { ProductRepository } from '../ports';

class InMemoryProductRepository implements ProductRepository {
  public readonly products: Product[] = [];

  constructor(initialProducts: Product[] = []) {
    this.products.push(...initialProducts);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async findByBarcode(): Promise<Product | null> {
    return null;
  }

  async findAll(): Promise<Product[]> {
    return this.products;
  }

  async save(product: Product): Promise<void> {
    const index = this.products.findIndex((candidate) => candidate.id === product.id);
    if (index >= 0) {
      this.products[index] = product;
      return;
    }

    this.products.push(product);
  }

  async isBarcodeUnique(): Promise<boolean> {
    return true;
  }
}

describe('AddVariantUseCase', () => {
  it('adds a variant for an existing product and persists it', async () => {
    const product = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Base Product',
      description: '',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const repository = new InMemoryProductRepository([product]);
    const useCase = new AddVariantUseCase(repository);

    const result = await useCase.execute({
      companyId: 'company-1',
      productId: product.id,
      sku: 'VAR-1',
      barcode: '1234567890128',
      additionalPricePiasters: 500,
      attributes: { color: 'red' },
    });

    expect(result.sku).toBe('VAR-1');
    expect(repository.products[0].variants).toHaveLength(1);
  });

  it('rejects adding a variant to a missing product', async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new AddVariantUseCase(repository);

    await expect(
      useCase.execute({
        companyId: 'company-1',
        productId: 'missing-product',
        sku: 'VAR-2',
        barcode: '1234567890128',
        additionalPricePiasters: 500,
        attributes: { color: 'blue' },
      }),
    ).rejects.toThrow('Product not found');
  });
});
