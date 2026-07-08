import { describe, expect, it } from 'vitest';
import { Product } from '@packages/domain-catalog';
import { GenerateBarcodeUseCase } from './index';
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

describe('GenerateBarcodeUseCase', () => {
  it('generates and persists a barcode for an existing product variant', async () => {
    const product = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Widget',
      description: '',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const variant = product.addVariant({
      sku: 'SKU-1',
      barcode: null,
      attributesJson: {},
      pricePiasters: 2500,
      costPiasters: 1800,
    });
    const productRepository = new InMemoryProductRepository([product]);
    const useCase = new GenerateBarcodeUseCase(productRepository);

    const result = await useCase.execute({
      companyId: 'company-1',
      productId: product.id,
      variantId: variant.id,
    });

    expect(result.barcode).toMatch(/^\d{13}$/);
    expect(productRepository.products[0].variants[0].barcode).toBe(result.barcode);
  });

  it('rejects generation when the product is missing', async () => {
    const productRepository = new InMemoryProductRepository();
    const useCase = new GenerateBarcodeUseCase(productRepository);

    await expect(
      useCase.execute({ companyId: 'company-1', productId: 'missing-product' }),
    ).rejects.toThrow('Product not found');
  });
});
