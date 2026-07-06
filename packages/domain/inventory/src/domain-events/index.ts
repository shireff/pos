import { DomainEventBase } from '@packages/shared-kernel';
import { StockEventType } from '../value-objects';

export class StockMovementRecorded extends DomainEventBase {
  public readonly warehouseId: string;
  public readonly productVariantId: string;
  public readonly batchId: string | null;
  public readonly eventType: StockEventType;
  public readonly quantityDelta: number;
  public readonly originatingDeviceId: string;
  public readonly sequenceNo: number;

  public constructor(props: {
    stockMovementEventId: string;
    warehouseId: string;
    productVariantId: string;
    batchId: string | null;
    eventType: StockEventType;
    quantityDelta: number;
    originatingDeviceId: string;
    sequenceNo: number;
  }) {
    super(props.stockMovementEventId, 'StockMovementEvent');
    this.warehouseId = props.warehouseId;
    this.productVariantId = props.productVariantId;
    this.batchId = props.batchId;
    this.eventType = props.eventType;
    this.quantityDelta = props.quantityDelta;
    this.originatingDeviceId = props.originatingDeviceId;
    this.sequenceNo = props.sequenceNo;
  }
}

export class StockTransferRequested extends DomainEventBase {
  public readonly fromWarehouseId: string;
  public readonly toWarehouseId: string;

  public constructor(props: {
    transferId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
  }) {
    super(props.transferId, 'StockTransfer');
    this.fromWarehouseId = props.fromWarehouseId;
    this.toWarehouseId = props.toWarehouseId;
  }
}

export class StockTransferApproved extends DomainEventBase {
  public readonly approvedByUserId: string;

  public constructor(props: { transferId: string; approvedByUserId: string }) {
    super(props.transferId, 'StockTransfer');
    this.approvedByUserId = props.approvedByUserId;
  }
}

export class StockTransferShipped extends DomainEventBase {
  public constructor(props: { transferId: string }) {
    super(props.transferId, 'StockTransfer');
  }
}

export class StockTransferReceived extends DomainEventBase {
  public readonly hasDiscrepancy: boolean;

  public constructor(props: { transferId: string; hasDiscrepancy: boolean }) {
    super(props.transferId, 'StockTransfer');
    this.hasDiscrepancy = props.hasDiscrepancy;
  }
}

export class StockTransferCancelled extends DomainEventBase {
  public constructor(props: { transferId: string }) {
    super(props.transferId, 'StockTransfer');
  }
}
