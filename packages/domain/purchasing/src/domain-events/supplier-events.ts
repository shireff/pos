import { DomainEventBase } from '@packages/shared-kernel';
import { Supplier } from '../aggregates/supplier.aggregate';

export class SupplierCreated extends DomainEventBase {
  public readonly supplier: Supplier;

  public constructor(supplier: Supplier) {
    super(supplier.id, 'Supplier');
    this.supplier = supplier;
  }
}

export class SupplierPaymentRecorded extends DomainEventBase {
  public readonly supplierId: string;
  public readonly amountPiasters: number;

  public constructor(props: { supplierId: string; amountPiasters: number }) {
    super(props.supplierId, 'Supplier');
    this.supplierId = props.supplierId;
    this.amountPiasters = props.amountPiasters;
  }
}
