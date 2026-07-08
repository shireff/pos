import { describe, expect, it } from 'vitest';
import { Product } from '@packages/domain-catalog';
import { GetProductQueryUseCase } from './index';
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

  async findAll(): Promise<Product[]> {
    return this.products;
  }

  async save(): Promise<void> {
    return;
  }

  async isBarcodeUnique(): Promise<boolean> {
    return true;
  }
}

describe('GetProductQueryUseCase', () => {
  it('returns a product with variants, units, and bundle components', async () => {
    const product = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Bundle Product',
      description: '',
      baseUnitId: null,
      productType: 'bundle',
      isBundle: true,
      isSerialized: false,
      requiresBatchTracking: false,
    });

    product.addVariant({
      sku: 'VAR-1',
      barcode: null,
      attributesJson: { color: 'red' },
      pricePiasters: 0,
      costPiasters: 0,
    });
    product.addUnit('Piece', 1);
    product.addBundleComponent('component-1', 2);

    const repository = new InMemoryProductRepository([product]);
    const useCase = new GetProductQueryUseCase(repository);

    const result = await useCase.execute({ companyId: 'company-1', productId: product.id });

    expect(result.id).toBe(product.id);
    expect(result.variants).toHaveLength(1);
    expect(result.units).toHaveLength(1);
    expect(result.bundleComponents).toHaveLength(1);
  });

  it('throws when the product does not exist', async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new GetProductQueryUseCase(repository);

    await expect(useCase.execute({ companyId: 'company-1', productId: 'missing' })).rejects.toThrow(
      'Product not found',
    );
  });
});
