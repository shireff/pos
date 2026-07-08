import { describe, expect, it } from 'vitest';
import { Product } from '@packages/domain-catalog';
import { ConfigureBundleUseCase } from './index';
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

describe('ConfigureBundleUseCase', () => {
  it('configures a bundle when all component products exist and the ratio sums to one', async () => {
    const parent = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Bundle Parent',
      description: '',
      baseUnitId: null,
      productType: 'bundle',
      isBundle: true,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const componentA = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Component A',
      description: '',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const componentB = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Component B',
      description: '',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const productRepository = new InMemoryProductRepository([parent, componentA, componentB]);
    const useCase = new ConfigureBundleUseCase(productRepository);

    const configured = await useCase.execute({
      companyId: 'company-1',
      productId: parent.id,
      components: [
        { componentProductId: componentA.id, quantity: 1, deductionRatio: 0.5 },
        { componentProductId: componentB.id, quantity: 1, deductionRatio: 0.5 },
      ],
    });

    expect(configured.bundleComponents).toHaveLength(2);
    expect(configured.bundleComponents[0].componentVariantId).toBe(componentA.id);
  });

  it('rejects invalid bundle ratios that exceed one', async () => {
    const parent = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Bundle Parent',
      description: '',
      baseUnitId: null,
      productType: 'bundle',
      isBundle: true,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const component = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Component',
      description: '',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const productRepository = new InMemoryProductRepository([parent, component]);
    const useCase = new ConfigureBundleUseCase(productRepository);

    await expect(
      useCase.execute({
        companyId: 'company-1',
        productId: parent.id,
        components: [{ componentProductId: component.id, quantity: 1, deductionRatio: 1.5 }],
      }),
    ).rejects.toThrow('Bundle deduction ratios cannot exceed 1.0');
  });
});
