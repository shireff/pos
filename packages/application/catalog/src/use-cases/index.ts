import { BarcodeGenerator, Product, type ProductType } from '@packages/domain-catalog';
import { Category, type LocalizedName } from '@packages/domain-catalog';
import { CategoryTreeService } from '@packages/domain-catalog';
import { Identifier } from '@packages/shared-kernel';
import type { CategoryRepository, CompanyUnitRepository, ProductRepository } from '../ports';

export type {
  ProductRepository,
  CategoryRepository,
  CompanyUnitRepository,
  UnitOfMeasureRepository,
} from '../ports';

export interface CreateProductInput {
  companyId: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  baseUnitId?: string | null;
  productType?: ProductType;
  isBundle?: boolean;
  isSerialized?: boolean;
  requiresBatchTracking?: boolean;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(input: CreateProductInput): Promise<Product> {
    if (input.categoryId) {
      const category = await this.categoryRepository.findById(input.categoryId, input.companyId);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    const product = Product.create({
      companyId: input.companyId,
      categoryId: input.categoryId ?? null,
      name: input.name,
      description: input.description ?? '',
      baseUnitId: input.baseUnitId ?? null,
      productType: input.productType ?? 'simple',
      isBundle: input.isBundle ?? false,
      isSerialized: input.isSerialized ?? false,
      requiresBatchTracking: input.requiresBatchTracking ?? false,
    });

    await this.productRepository.save(product);
    return product;
  }
}

export interface UpdateProductInput {
  companyId: string;
  productId: string;
  name?: string;
  description?: string;
  categoryId?: string | null;
}

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(input: UpdateProductInput): Promise<Product> {
    const product = await this.productRepository.findById(input.productId, input.companyId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (input.categoryId !== undefined && input.categoryId) {
      const category = await this.categoryRepository.findById(input.categoryId, input.companyId);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    product.update({
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
    });

    await this.productRepository.save(product);
    return product;
  }
}

export interface ArchiveProductInput {
  companyId: string;
  productId: string;
}

export class ArchiveProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  public async execute(input: ArchiveProductInput): Promise<Product> {
    const product = await this.productRepository.findById(input.productId, input.companyId);
    if (!product) {
      throw new Error('Product not found');
    }

    const hasOpenPurchaseOrderLines = await this.productRepository.hasOpenPurchaseOrderLines(
      input.productId,
      input.companyId,
    );
    if (hasOpenPurchaseOrderLines) {
      throw new Error('Cannot archive a product that has open purchase order lines');
    }

    product.archive();
    await this.productRepository.save(product);
    return product;
  }
}

export interface GenerateBarcodeInput {
  companyId: string;
  productId: string;
  variantId?: string;
}

export interface GenerateBarcodeResult {
  barcode: string;
  variantId: string;
}

export class GenerateBarcodeUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(input: GenerateBarcodeInput): Promise<GenerateBarcodeResult> {
    const product = await this.productRepository.findById(input.productId, input.companyId);
    if (!product) {
      throw new Error('Product not found');
    }

    const targetVariant = input.variantId
      ? product.variants.find((variant) => variant.id === input.variantId)
      : product.variants[0];

    if (!targetVariant) {
      throw new Error('Variant not found');
    }

    const seed = product.id
      .replace(/[^0-9]/g, '')
      .slice(-12)
      .padStart(12, '0');
    const barcodeValue = BarcodeGenerator.generateEan13(seed).value;
    targetVariant.assignBarcode(barcodeValue);

    await this.productRepository.save(product);
    return { barcode: barcodeValue, variantId: targetVariant.id };
  }
}

export interface ConfigureBundleInput {
  companyId: string;
  productId: string;
  components: Array<{
    componentProductId: string;
    quantity: number;
    deductionRatio: number;
  }>;
}

export class ConfigureBundleUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(input: ConfigureBundleInput): Promise<Product> {
    const product = await this.productRepository.findById(input.productId, input.companyId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isBundle) {
      throw new Error('Product is not a bundle');
    }

    const totalRatio = input.components.reduce(
      (sum, component) => sum + component.deductionRatio,
      0,
    );
    if (totalRatio > 1) {
      throw new Error('Bundle deduction ratios cannot exceed 1.0');
    }

    for (const component of input.components) {
      const componentProduct = await this.productRepository.findById(
        component.componentProductId,
        input.companyId,
      );
      if (!componentProduct) {
        throw new Error('Component product not found');
      }
    }

    for (const component of input.components) {
      product.addBundleComponent(component.componentProductId, component.quantity);
    }

    await this.productRepository.save(product);
    return product;
  }
}

export interface AddVariantInput {
  companyId: string;
  productId: string;
  sku: string;
  barcode?: string | null;
  additionalPricePiasters?: number;
  attributes?: Record<string, string>;
}

export class AddVariantUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(input: AddVariantInput): Promise<Product['variants'][number]> {
    const product = await this.productRepository.findById(input.productId, input.companyId);
    if (!product) {
      throw new Error('Product not found');
    }

    const variant = product.addVariant({
      sku: input.sku,
      barcode: input.barcode ?? null,
      attributesJson: input.attributes ?? {},
      pricePiasters: 0,
      costPiasters: 0,
    });

    await this.productRepository.save(product);
    return variant;
  }
}

export interface GetProductQueryInput {
  companyId: string;
  productId: string;
}

export class GetProductQueryUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(input: GetProductQueryInput): Promise<Product> {
    const product = await this.productRepository.findById(input.productId, input.companyId);
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }
}

export interface ListProductsQueryInput {
  companyId: string;
  categoryId?: string;
  status?: 'active' | 'archived' | 'all';
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt';
  limit?: number;
  offset?: number;
}

export interface ListProductsQueryResult {
  items: Product[];
  total: number;
}

export class ListProductsQueryUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(input: ListProductsQueryInput): Promise<ListProductsQueryResult> {
    const products = await this.productRepository.findAll(input.companyId, {
      categoryId: input.categoryId,
      isDeleted: input.status === 'archived' ? true : input.status === 'active' ? false : undefined,
    });

    const filtered = products
      .filter((product) => {
        if (!input.search) return true;
        const term = input.search.toLowerCase();
        return (
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term)
        );
      })
      .sort((left, right) => {
        switch (input.sortBy) {
          case 'price':
            return left.name.localeCompare(right.name);
          case 'createdAt':
            return left.createdAt.localeCompare(right.createdAt);
          case 'name':
          default:
            return left.name.localeCompare(right.name);
        }
      });

    const total = filtered.length;
    const items = filtered.slice(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? total));

    return { items, total };
  }
}

// ─── Category Use Cases ───────────────────────────────────────────────────────

export interface CreateCategoryInput {
  companyId: string;
  name: LocalizedName;
  parentId?: string | null;
  sortOrder?: number;
}

export interface CreateCategoryOutput {
  category: Category;
}

export class CreateCategoryUseCase {
  public constructor(private readonly categories: CategoryRepository) {}

  public async execute(input: CreateCategoryInput): Promise<CreateCategoryOutput> {
    const parentId = input.parentId ?? null;
    let level = 0;
    let parentPath: string | null = null;

    if (parentId) {
      const parent = await this.categories.findById(parentId, input.companyId);
      if (!parent) throw new Error('Parent category not found');
      if (parent.isDeleted) throw new Error('Parent category is archived');
      level = parent.level + 1;
      parentPath = parent.path;

      const siblings = await this.categories.findChildren(parentId, input.companyId);
      const nameConflict = siblings.some((s) => !s.isDeleted && s.name.ar === input.name.ar);
      if (nameConflict)
        throw new Error('A category with this name already exists under the same parent');
    } else {
      const roots = await this.categories.findChildren(null, input.companyId);
      const nameConflict = roots.some((r) => !r.isDeleted && r.name.ar === input.name.ar);
      if (nameConflict) throw new Error('A root category with this name already exists');
    }

    const siblings = await this.categories.findChildren(parentId, input.companyId);
    const sortOrder = input.sortOrder ?? siblings.filter((s) => !s.isDeleted).length;

    const id = Identifier.generate();
    const path = parentPath ? `${parentPath}/${id}` : id;

    const category = Category.create({
      companyId: input.companyId,
      name: input.name,
      parentId,
      sortOrder,
      level,
      path,
    });

    await this.categories.save(category);
    return { category };
  }
}

export interface UpdateCategoryInput {
  companyId: string;
  categoryId: string;
  name?: LocalizedName;
  sortOrder?: number;
}

export interface UpdateCategoryOutput {
  category: Category;
}

export class UpdateCategoryUseCase {
  public constructor(private readonly categories: CategoryRepository) {}

  public async execute(input: UpdateCategoryInput): Promise<UpdateCategoryOutput> {
    const category = await this.categories.findById(input.categoryId, input.companyId);
    if (!category) throw new Error('Category not found');
    if (category.isDeleted) throw new Error('Category is archived');

    if (input.name !== undefined) {
      const siblings = await this.categories.findChildren(category.parentId, input.companyId);
      const nameConflict = siblings.some(
        (s) => !s.isDeleted && s.id !== category.id && s.name.ar === input.name!.ar,
      );
      if (nameConflict) throw new Error('A category with this name already exists at this level');
      category.rename(input.name);
    }

    if (input.sortOrder !== undefined) {
      category.updateSortOrder(input.sortOrder);
    }

    await this.categories.save(category);
    return { category };
  }
}

export interface DeleteCategoryInput {
  companyId: string;
  categoryId: string;
}

export interface DeleteCategoryOutput {
  archivedCount: number;
}

export class DeleteCategoryUseCase {
  public constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
  ) {}

  public async execute(input: DeleteCategoryInput): Promise<DeleteCategoryOutput> {
    const category = await this.categories.findById(input.categoryId, input.companyId);
    if (!category) throw new Error('Category not found');
    if (category.isDeleted) throw new Error('Category is already archived');

    const hasActiveProducts = await this.categories.hasActiveProducts(
      input.categoryId,
      input.companyId,
    );
    if (hasActiveProducts) throw new Error('Cannot archive a category that has active products');

    const allCategories = await this.categories.findAll(input.companyId);
    CategoryTreeService.archiveSubtree(allCategories, input.categoryId);

    const modified = allCategories.filter((c) => c.isDeleted);
    await this.categories.saveAll(modified);

    return { archivedCount: modified.length };
  }
}

export interface ReorderCategoryInput {
  companyId: string;
  categoryId: string;
  newParentId: string | null;
  sortOrder?: number;
}

export interface ReorderCategoryOutput {
  category: Category;
  updatedCount: number;
}

export class ReorderCategoryUseCase {
  public constructor(private readonly categories: CategoryRepository) {}

  public async execute(input: ReorderCategoryInput): Promise<ReorderCategoryOutput> {
    const category = await this.categories.findById(input.categoryId, input.companyId);
    if (!category) throw new Error('Category not found');
    if (category.isDeleted) throw new Error('Category is archived');

    const allCategories = await this.categories.findAll(input.companyId);
    const oldPath = category.path;

    let newLevel = 0;
    let newPath = category.id;

    if (input.newParentId) {
      const newParent = await this.categories.findById(input.newParentId, input.companyId);
      if (!newParent) throw new Error('New parent category not found');
      if (newParent.isDeleted) throw new Error('New parent category is archived');

      CategoryTreeService.ensureNoCircularReference(
        input.newParentId,
        input.categoryId,
        allCategories,
      );

      newLevel = newParent.level + 1;
      newPath = `${newParent.path}/${category.id}`;
    }

    const siblings = await this.categories.findChildren(input.newParentId, input.companyId);
    const sortOrder =
      input.sortOrder ?? siblings.filter((s) => !s.isDeleted && s.id !== category.id).length;

    category.moveTo(input.newParentId, newLevel, newPath, sortOrder);

    // Recompute path/level for subtree
    const subtree = allCategories.filter(
      (c) => c.id !== category.id && c.path.startsWith(`${oldPath}/`),
    );
    const toSave: Category[] = [category];

    for (const child of subtree) {
      const updatedPath = child.path.replace(oldPath, newPath);
      const updatedLevel = updatedPath.split('/').length - 1;
      child.moveTo(child.parentId, updatedLevel, updatedPath, child.sortOrder);
      toSave.push(child);
    }

    await this.categories.saveAll(toSave);
    return { category, updatedCount: toSave.length };
  }
}

export interface CategoryNode {
  id: string;
  companyId: string;
  name: LocalizedName;
  parentId: string | null;
  sortOrder: number;
  level: number;
  path: string;
  isDeleted: boolean;
  children: CategoryNode[];
}

export interface GetCategoryTreeInput {
  companyId: string;
  includeDeleted?: boolean;
}

export interface GetCategoryTreeOutput {
  tree: CategoryNode[];
  flat: CategoryNode[];
}

export class GetCategoryTreeUseCase {
  public constructor(private readonly categories: CategoryRepository) {}

  public async execute(input: GetCategoryTreeInput): Promise<GetCategoryTreeOutput> {
    const all = await this.categories.findAll(input.companyId);
    const visible = input.includeDeleted ? all : all.filter((c) => !c.isDeleted);

    const flat: CategoryNode[] = visible
      .sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder)
      .map((c) => ({
        id: c.id,
        companyId: c.companyId,
        name: { ...c.name },
        parentId: c.parentId,
        sortOrder: c.sortOrder,
        level: c.level,
        path: c.path,
        isDeleted: c.isDeleted,
        children: [],
      }));

    const byId = new Map(flat.map((n) => [n.id, n]));
    const roots: CategoryNode[] = [];

    for (const node of flat) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return { tree: roots, flat };
  }
}

// ─── Company Unit Use Cases ───────────────────────────────────────────────────

export interface CreateUnitInput {
  companyId: string;
  name: LocalizedName;
  abbreviation: string;
  isBaseUnit: boolean;
  conversionFactorToBase: number;
}

export interface CreateUnitOutput {
  unit: {
    id: string;
    companyId: string;
    name: LocalizedName;
    abbreviation: string;
    isBaseUnit: boolean;
    conversionFactorToBase: number;
  };
}

export class CreateUnitUseCase {
  public constructor(private readonly units: CompanyUnitRepository) {}

  public async execute(input: CreateUnitInput): Promise<CreateUnitOutput> {
    if (input.isBaseUnit && input.conversionFactorToBase !== 1.0) {
      throw new Error('Base units must have conversionFactorToBase = 1.0');
    }
    if (input.conversionFactorToBase <= 0) {
      throw new Error('conversionFactorToBase must be positive');
    }

    const exists = await this.units.existsByAbbreviation(input.abbreviation, input.companyId);
    if (exists) throw new Error('A unit with this abbreviation already exists for this company');

    const id = Identifier.generate();
    const { UnitOfMeasure } = await import('@packages/domain-catalog');
    await this.units.save(
      UnitOfMeasure.reconstitute({
        id,
        productId: input.companyId,
        unitName: input.abbreviation,
        conversionFactorToBase: input.conversionFactorToBase,
        isBaseUnit: input.isBaseUnit,
      }),
    );

    return {
      unit: {
        id,
        companyId: input.companyId,
        name: input.name,
        abbreviation: input.abbreviation,
        isBaseUnit: input.isBaseUnit,
        conversionFactorToBase: input.conversionFactorToBase,
      },
    };
  }
}

export interface UpdateUnitInput {
  companyId: string;
  unitId: string;
  name?: LocalizedName;
  abbreviation?: string;
  conversionFactorToBase?: number;
}

export interface UpdateUnitOutput {
  unit: {
    id: string;
    companyId: string;
    abbreviation: string;
    isBaseUnit: boolean;
    conversionFactorToBase: number;
  };
}

export class UpdateUnitUseCase {
  public constructor(private readonly units: CompanyUnitRepository) {}

  public async execute(input: UpdateUnitInput): Promise<UpdateUnitOutput> {
    const existing = await this.units.findById(input.unitId, input.companyId);
    if (!existing) throw new Error('Unit not found');

    if (
      input.conversionFactorToBase !== undefined &&
      input.conversionFactorToBase !== existing.conversionFactorToBase
    ) {
      const hasRefs = await this.units.hasActiveProductReferences(input.unitId, input.companyId);
      if (hasRefs) {
        throw new Error(
          'Cannot change conversionFactorToBase: active products reference this unit',
        );
      }
      if (input.conversionFactorToBase <= 0) {
        throw new Error('conversionFactorToBase must be positive');
      }
    }

    if (input.abbreviation !== undefined && input.abbreviation !== existing.unitName) {
      const abbrevExists = await this.units.existsByAbbreviation(
        input.abbreviation,
        input.companyId,
        input.unitId,
      );
      if (abbrevExists)
        throw new Error('A unit with this abbreviation already exists for this company');
    }

    const newAbbreviation = input.abbreviation ?? existing.unitName;
    const newFactor = input.conversionFactorToBase ?? existing.conversionFactorToBase;

    const { UnitOfMeasure } = await import('@packages/domain-catalog');
    await this.units.save(
      UnitOfMeasure.reconstitute({
        id: existing.id,
        productId: input.companyId,
        unitName: newAbbreviation,
        conversionFactorToBase: newFactor,
        isBaseUnit: existing.isBaseUnit,
      }),
    );

    return {
      unit: {
        id: existing.id,
        companyId: input.companyId,
        abbreviation: newAbbreviation,
        isBaseUnit: existing.isBaseUnit,
        conversionFactorToBase: newFactor,
      },
    };
  }
}

export interface ListUnitsInput {
  companyId: string;
}

export interface ListUnitsOutput {
  units: Array<{
    id: string;
    unitName: string;
    conversionFactorToBase: number;
    isBaseUnit: boolean;
  }>;
}

export class ListUnitsUseCase {
  public constructor(private readonly units: CompanyUnitRepository) {}

  public async execute(input: ListUnitsInput): Promise<ListUnitsOutput> {
    const all = await this.units.findAll(input.companyId);
    return {
      units: all.map((u) => ({
        id: u.id,
        unitName: u.unitName,
        conversionFactorToBase: u.conversionFactorToBase,
        isBaseUnit: u.isBaseUnit,
      })),
    };
  }
}
