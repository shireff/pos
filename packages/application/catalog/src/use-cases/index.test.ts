import { describe, expect, it } from 'vitest';
import { Category, Product } from '@packages/domain-catalog';
import { CreateProductUseCase } from './index';
import type { CategoryRepository, ProductRepository } from '../ports';

class InMemoryProductRepository implements ProductRepository {
  public readonly products: Product[] = [];

  async findById(): Promise<Product | null> {
    return null;
  }

  async findByBarcode(): Promise<Product | null> {
    return null;
  }

  async findAll(): Promise<Product[]> {
    return [];
  }

  async save(product: Product): Promise<void> {
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

describe('CreateProductUseCase', () => {
  it('creates and persists a product when the category exists', async () => {
    const category = Category.create({
      companyId: 'company-1',
      name: { ar: 'Beverages' },
      parentId: null,
    });
    const productRepository = new InMemoryProductRepository();
    const categoryRepository = new InMemoryCategoryRepository([category]);
    const useCase = new CreateProductUseCase(productRepository, categoryRepository);

    const created = await useCase.execute({
      companyId: 'company-1',
      name: 'Coffee',
      categoryId: category.id,
    });

    expect(created.name).toBe('Coffee');
    expect(productRepository.products).toHaveLength(1);
    expect(productRepository.products[0].id).toBe(created.id);
  });

  it('rejects creation when the category does not exist', async () => {
    const productRepository = new InMemoryProductRepository();
    const categoryRepository = new InMemoryCategoryRepository([]);
    const useCase = new CreateProductUseCase(productRepository, categoryRepository);

    await expect(
      useCase.execute({
        companyId: 'company-1',
        name: 'Tea',
        categoryId: 'missing-category',
      }),
    ).rejects.toThrow('Category not found');
  });
});
