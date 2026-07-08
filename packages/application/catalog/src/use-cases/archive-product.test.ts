import { describe, expect, it } from 'vitest';
import { Product } from '@packages/domain-catalog';
import { ArchiveProductUseCase } from './index';
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

describe('ArchiveProductUseCase', () => {
  it('archives an existing product and persists the change', async () => {
    const product = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'To Archive',
      description: '',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const productRepository = new InMemoryProductRepository([product]);
    const useCase = new ArchiveProductUseCase(productRepository);

    const archived = await useCase.execute({ companyId: 'company-1', productId: product.id });

    expect(archived.isDeleted).toBe(true);
    expect(productRepository.products[0].isDeleted).toBe(true);
  });

  it('rejects archiving when the product is missing', async () => {
    const productRepository = new InMemoryProductRepository();
    const useCase = new ArchiveProductUseCase(productRepository);

    await expect(
      useCase.execute({ companyId: 'company-1', productId: 'missing-product' }),
    ).rejects.toThrow('Product not found');
  });
});
