import { DomainEventBase } from '@packages/shared-kernel';

export class ProductCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly name: string;
  public readonly productType: string;

  public constructor(props: {
    productId: string;
    companyId: string;
    name: string;
    productType: string;
  }) {
    super(props.productId, 'Product');
    this.companyId = props.companyId;
    this.name = props.name;
    this.productType = props.productType;
  }
}

export class ProductUpdated extends DomainEventBase {
  public readonly companyId: string;
  public readonly changedFields: string[];

  public constructor(props: { productId: string; companyId: string; changedFields: string[] }) {
    super(props.productId, 'Product');
    this.companyId = props.companyId;
    this.changedFields = props.changedFields;
  }
}

export class ProductArchived extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { productId: string; companyId: string }) {
    super(props.productId, 'Product');
    this.companyId = props.companyId;
  }
}

export class ProductVariantPriceChanged extends DomainEventBase {
  public readonly companyId: string;
  public readonly variantId: string;
  public readonly oldPricePiasters: number;
  public readonly newPricePiasters: number;

  public constructor(props: {
    productId: string;
    companyId: string;
    variantId: string;
    oldPricePiasters: number;
    newPricePiasters: number;
  }) {
    super(props.productId, 'Product');
    this.companyId = props.companyId;
    this.variantId = props.variantId;
    this.oldPricePiasters = props.oldPricePiasters;
    this.newPricePiasters = props.newPricePiasters;
  }
}

export class BarcodeGenerated extends DomainEventBase {
  public readonly variantId: string;
  public readonly barcode: string;

  public constructor(props: { productId: string; variantId: string; barcode: string }) {
    super(props.productId, 'Product');
    this.variantId = props.variantId;
    this.barcode = props.barcode;
  }
}
