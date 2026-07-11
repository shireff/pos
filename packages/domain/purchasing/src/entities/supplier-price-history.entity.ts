import { Identifier } from '@packages/shared-kernel';

export interface SupplierPriceHistoryProps {
  id: string;
  supplierId: string;
  companyId: string;
  productId: string;
  variantId: string | null;
  unitPricePiasters: number;
  effectiveDate: string;
  recordedAt: string;
  purchaseOrderId: string | null;
  createdAt: string;
}

export class SupplierPriceHistory {
  public readonly id: string;
  public readonly supplierId: string;
  public readonly companyId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly unitPricePiasters: number;
  public readonly effectiveDate: string;
  public readonly recordedAt: string;
  public readonly purchaseOrderId: string | null;
  public readonly createdAt: string;

  private constructor(props: SupplierPriceHistoryProps) {
    this.id = props.id;
    this.supplierId = props.supplierId;
    this.companyId = props.companyId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.unitPricePiasters = props.unitPricePiasters;
    this.effectiveDate = props.effectiveDate;
    this.recordedAt = props.recordedAt;
    this.purchaseOrderId = props.purchaseOrderId;
    this.createdAt = props.createdAt;
  }

  public static create(props: Omit<SupplierPriceHistoryProps, 'id' | 'createdAt' | 'recordedAt'>): SupplierPriceHistory {
    const now = new Date().toISOString();
    return new SupplierPriceHistory({
      id: Identifier.generate(),
      ...props,
      recordedAt: now,
      createdAt: now,
    });
  }

  public static reconstitute(props: SupplierPriceHistoryProps): SupplierPriceHistory {
    return new SupplierPriceHistory(props);
  }
}
