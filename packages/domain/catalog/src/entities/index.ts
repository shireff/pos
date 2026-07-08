import { Identifier } from '@packages/shared-kernel';
import { AttributeMap } from '../value-objects';

// ─── Category ────────────────────────────────────────────────────────────────

export interface LocalizedName {
  ar: string;
  en?: string;
}

export interface CategoryProps {
  id: string;
  companyId: string;
  name: LocalizedName;
  parentId: string | null;
  sortOrder: number;
  level: number;
  path: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Category {
  public readonly id: string;
  public readonly companyId: string;
  private _name: LocalizedName;
  private _parentId: string | null;
  private _sortOrder: number;
  private _level: number;
  private _path: string;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: CategoryProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._parentId = props.parentId;
    this._sortOrder = props.sortOrder;
    this._level = props.level;
    this._path = props.path;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<
      CategoryProps,
      'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'path' | 'sortOrder' | 'level'
    > &
      Partial<Pick<CategoryProps, 'path' | 'sortOrder' | 'level'>>,
  ): Category {
    const now = new Date().toISOString();
    const id = Identifier.generate();
    const { path, sortOrder, level, ...rest } = props;
    return new Category({
      id,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      path: path ?? id,
      sortOrder: sortOrder ?? 0,
      level: level ?? 0,
      ...rest,
    });
  }

  public static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  public get name(): Readonly<LocalizedName> {
    return this._name;
  }
  public get parentId(): string | null {
    return this._parentId;
  }
  public get sortOrder(): number {
    return this._sortOrder;
  }
  public get level(): number {
    return this._level;
  }
  public get path(): string {
    return this._path;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public rename(name: LocalizedName): void {
    this._name = name;
    this._updatedAt = new Date().toISOString();
  }

  public updateSortOrder(sortOrder: number): void {
    this._sortOrder = sortOrder;
    this._updatedAt = new Date().toISOString();
  }

  public moveTo(parentId: string | null, level: number, path: string, sortOrder: number): void {
    this._parentId = parentId;
    this._level = level;
    this._path = path;
    this._sortOrder = sortOrder;
    this._updatedAt = new Date().toISOString();
  }

  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}

// ─── UnitOfMeasure ───────────────────────────────────────────────────────────

export interface UnitOfMeasureProps {
  id: string;
  productId: string;
  unitName: string;
  conversionFactorToBase: number;
  isBaseUnit?: boolean;
}

export class UnitOfMeasure {
  public readonly id: string;
  public readonly productId: string;
  public readonly unitName: string;
  public readonly conversionFactorToBase: number;
  public readonly isBaseUnit: boolean;

  private constructor(props: UnitOfMeasureProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.unitName = props.unitName;
    this.conversionFactorToBase = props.conversionFactorToBase;
    this.isBaseUnit = props.isBaseUnit ?? false;
  }

  public static create(props: Omit<UnitOfMeasureProps, 'id'>): UnitOfMeasure {
    if (props.conversionFactorToBase <= 0)
      throw new Error('UnitOfMeasure: conversionFactorToBase must be positive');
    if (props.isBaseUnit && props.conversionFactorToBase !== 1)
      throw new Error('Base units must use a conversion factor of 1');
    return new UnitOfMeasure({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: UnitOfMeasureProps): UnitOfMeasure {
    return new UnitOfMeasure(props);
  }

  public toBaseQty(qty: number): number {
    return Math.round(qty * this.conversionFactorToBase);
  }
  public fromBaseQty(baseQty: number): number {
    return baseQty / this.conversionFactorToBase;
  }
}

// ─── ProductVariant ──────────────────────────────────────────────────────────

export interface ProductVariantProps {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  attributesJson: AttributeMap;
  pricePiasters: number;
  costPiasters: number;
  isDeleted: boolean;
}

export class ProductVariant {
  public readonly id: string;
  public readonly productId: string;
  public readonly sku: string;
  private _barcode: string | null;
  private _attributesJson: AttributeMap;
  private _pricePiasters: number;
  private _costPiasters: number;
  private _isDeleted: boolean;

  private constructor(props: ProductVariantProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.sku = props.sku;
    this._barcode = props.barcode;
    this._attributesJson = { ...props.attributesJson };
    this._pricePiasters = props.pricePiasters;
    this._costPiasters = props.costPiasters;
    this._isDeleted = props.isDeleted;
  }

  public static create(props: Omit<ProductVariantProps, 'id' | 'isDeleted'>): ProductVariant {
    return new ProductVariant({ id: Identifier.generate(), isDeleted: false, ...props });
  }

  public static reconstitute(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  public get barcode(): string | null {
    return this._barcode;
  }
  public get attributesJson(): AttributeMap {
    return { ...this._attributesJson };
  }
  public get pricePiasters(): number {
    return this._pricePiasters;
  }
  public get costPiasters(): number {
    return this._costPiasters;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public updatePrice(pricePiasters: number): void {
    if (pricePiasters < 0) throw new Error('Price cannot be negative');
    this._pricePiasters = pricePiasters;
  }

  public updateCost(costPiasters: number): void {
    if (costPiasters < 0) throw new Error('Cost cannot be negative');
    this._costPiasters = costPiasters;
  }

  public assignBarcode(barcode: string): void {
    this._barcode = barcode;
  }
  public archive(): void {
    this._isDeleted = true;
  }
}

// ─── BundleComponent ─────────────────────────────────────────────────────────

export interface BundleComponentProps {
  bundleVariantId: string;
  componentVariantId: string;
  quantity: number;
}

export class BundleComponent {
  public readonly bundleVariantId: string;
  public readonly componentVariantId: string;
  public readonly quantity: number;

  private constructor(props: BundleComponentProps) {
    this.bundleVariantId = props.bundleVariantId;
    this.componentVariantId = props.componentVariantId;
    this.quantity = props.quantity;
  }

  public static create(props: BundleComponentProps): BundleComponent {
    if (props.quantity <= 0) throw new Error('BundleComponent quantity must be positive');
    return new BundleComponent(props);
  }

  public static reconstitute(props: BundleComponentProps): BundleComponent {
    return new BundleComponent(props);
  }
}
