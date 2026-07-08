import { describe, expect, it } from 'vitest';
import { Category, Product } from '@packages/domain-catalog';
import { UpdateProductUseCase } from './index';
import type { CategoryRepository, ProductRepository } from '../ports';

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

class InMemoryCategoryRepository implements CategoryRepository {
  constructor(private readonly categories: Category[]) {}

  async findById(id: string, companyId: string): Promise<Category | null> {
    return (
      this.categories.find((category) => category.id === id && category.companyId === companyId) ??
      null
    );
  }
  async findAll(): Promise<Category[]> {
    return this.categories;
  }
  async findChildren(parentId: string | null, companyId: string): Promise<Category[]> {
    return this.categories.filter((c) => c.companyId === companyId && c.parentId === parentId);
  }
  async findByPath(pathPrefix: string, companyId: string): Promise<Category[]> {
    return this.categories.filter(
      (c) => c.companyId === companyId && c.path.startsWith(pathPrefix),
    );
  }
  async hasActiveProducts(): Promise<boolean> {
    return false;
  }
  async save(): Promise<void> {
    return;
  }
  async saveAll(): Promise<void> {
    return;
  }
}

describe('UpdateProductUseCase', () => {
  it('updates an existing product and persists the change', async () => {
    const product = Product.create({
      companyId: 'company-1',
      categoryId: null,
      name: 'Original',
      description: 'Old description',
      baseUnitId: null,
      productType: 'simple',
      isBundle: false,
      isSerialized: false,
      requiresBatchTracking: false,
    });
    const productRepository = new InMemoryProductRepository([product]);
    const categoryRepository = new InMemoryCategoryRepository([]);
    const useCase = new UpdateProductUseCase(productRepository, categoryRepository);

    const updated = await useCase.execute({
      companyId: 'company-1',
      productId: product.id,
      name: 'Updated',
      description: 'New description',
    });

    expect(updated.name).toBe('Updated');
    expect(updated.description).toBe('New description');
    expect(productRepository.products[0].name).toBe('Updated');
  });

  it('rejects updates when the product is missing', async () => {
    const productRepository = new InMemoryProductRepository();
    const categoryRepository = new InMemoryCategoryRepository([]);
    const useCase = new UpdateProductUseCase(productRepository, categoryRepository);

    await expect(
      useCase.execute({
        companyId: 'company-1',
        productId: 'missing-product',
        name: 'Nope',
      }),
    ).rejects.toThrow('Product not found');
  });
});
