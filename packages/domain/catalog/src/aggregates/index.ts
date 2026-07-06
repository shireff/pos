import { Identifier } from '@packages/shared-kernel';
import {
  ProductVariant,
  ProductVariantProps,
  BundleComponent,
  BundleComponentProps,
  UnitOfMeasure,
} from '../entities';

export type ProductType = 'simple' | 'variant' | 'bundle';

export interface ProductProps {
  id: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  description: string;
  baseUnitId: string | null;
  productType: ProductType;
  isBundle: boolean;
  isSerialized: boolean;
  requiresBatchTracking: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Product {
  public readonly id: string;
  public readonly companyId: string;
  private _categoryId: string | null;
  private _name: string;
  private _description: string;
  private _baseUnitId: string | null;
  public readonly productType: ProductType;
  public readonly isBundle: boolean;
  public readonly isSerialized: boolean;
  public readonly requiresBatchTracking: boolean;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private _variants: ProductVariant[] = [];
  private _units: UnitOfMeasure[] = [];
  private _bundleComponents: BundleComponent[] = [];

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._categoryId = props.categoryId;
    this._name = props.name;
    this._description = props.description;
    this._baseUnitId = props.baseUnitId;
    this.productType = props.productType;
    this.isBundle = props.isBundle;
    this.isSerialized = props.isSerialized;
    this.requiresBatchTracking = props.requiresBatchTracking;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<ProductProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Product {
    const now = new Date().toISOString();
    return new Product({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(
    props: ProductProps,
    variants: ProductVariantProps[],
    unitProps: Array<{
      id: string;
      productId: string;
      unitName: string;
      conversionFactorToBase: number;
    }>,
    bundleProps: BundleComponentProps[],
  ): Product {
    const p = new Product(props);
    p._variants = variants.map((v) => ProductVariant.reconstitute(v));
    p._units = unitProps.map((u) => UnitOfMeasure.reconstitute(u));
    p._bundleComponents = bundleProps.map((b) => BundleComponent.reconstitute(b));
    return p;
  }

  public get name(): string {
    return this._name;
  }
  public get description(): string {
    return this._description;
  }
  public get categoryId(): string | null {
    return this._categoryId;
  }
  public get baseUnitId(): string | null {
    return this._baseUnitId;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }
  public get variants(): readonly ProductVariant[] {
    return this._variants;
  }
  public get units(): readonly UnitOfMeasure[] {
    return this._units;
  }
  public get bundleComponents(): readonly BundleComponent[] {
    return this._bundleComponents;
  }

  public update(fields: Partial<Pick<ProductProps, 'name' | 'description' | 'categoryId'>>): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.description !== undefined) this._description = fields.description;
    if (fields.categoryId !== undefined) this._categoryId = fields.categoryId;
    this._updatedAt = new Date().toISOString();
  }

  public addVariant(
    variantProps: Omit<ProductVariantProps, 'id' | 'isDeleted' | 'productId'>,
  ): ProductVariant {
    const variant = ProductVariant.create({ ...variantProps, productId: this.id });
    this._variants.push(variant);
    this._updatedAt = new Date().toISOString();
    return variant;
  }

  public addUnit(unitName: string, conversionFactorToBase: number): UnitOfMeasure {
    const unit = UnitOfMeasure.create({ productId: this.id, unitName, conversionFactorToBase });
    this._units.push(unit);
    return unit;
  }

  public addBundleComponent(componentVariantId: string, quantity: number): void {
    if (!this.isBundle) throw new Error('Cannot add bundle component to a non-bundle product');
    const component = BundleComponent.create({
      bundleVariantId: this.id,
      componentVariantId,
      quantity,
    });
    this._bundleComponents.push(component);
    this._updatedAt = new Date().toISOString();
  }

  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}
