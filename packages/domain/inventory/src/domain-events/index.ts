import { DomainEventBase } from '@packages/shared-kernel';
import { StockEventType } from '../value-objects';

export class StockMovementRecorded extends DomainEventBase {
  public readonly warehouseId: string;
  public readonly productId: string;
  public readonly variantId: string | null;
  public readonly batchId: string | null;
  public readonly eventType: StockEventType;
  public readonly quantity: number;
  public readonly originatingDeviceId: string;
  public readonly sequenceNo: number;

  public constructor(props: {
    stockMovementEventId: string;
    warehouseId: string;
    productId: string;
    variantId: string | null;
    batchId: string | null;
    eventType: StockEventType;
    quantity: number;
    originatingDeviceId: string;
    sequenceNo: number;
  }) {
    super(props.stockMovementEventId, 'StockMovementEvent');
    this.warehouseId = props.warehouseId;
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.batchId = props.batchId;
    this.eventType = props.eventType;
    this.quantity = props.quantity;
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

export class AdjustmentRequiresApproval extends DomainEventBase {
  public readonly adjustmentId: string;
  public readonly threshold: number;
  public readonly requestedQuantity: number;

  public constructor(props: { adjustmentId: string; threshold: number; requestedQuantity: number }) {
    super(props.adjustmentId, 'StockAdjustment');
    this.adjustmentId = props.adjustmentId;
    this.threshold = props.threshold;
    this.requestedQuantity = props.requestedQuantity;
  }
}

export class AdjustmentApproved extends DomainEventBase {
  public readonly adjustmentId: string;
  public readonly approvedByUserId: string;

  public constructor(props: { adjustmentId: string; approvedByUserId: string }) {
    super(props.adjustmentId, 'StockAdjustment');
    this.adjustmentId = props.adjustmentId;
    this.approvedByUserId = props.approvedByUserId;
  }
}

export class ReorderPointReached extends DomainEventBase {
  public readonly productId: string;
  public readonly warehouseId: string;
  public readonly quantityOnHand: number;
  public readonly reorderPoint: number;

  public constructor(props: {
    stockItemId: string;
    productId: string;
    warehouseId: string;
    quantityOnHand: number;
    reorderPoint: number;
  }) {
    super(props.stockItemId, 'StockItem');
    this.productId = props.productId;
    this.warehouseId = props.warehouseId;
    this.quantityOnHand = props.quantityOnHand;
    this.reorderPoint = props.reorderPoint;
  }
}

export class BatchExpired extends DomainEventBase {
  public readonly batchId: string;
  public readonly productId: string;

  public constructor(props: { batchId: string; productId: string }) {
    super(props.batchId, 'Batch');
    this.batchId = props.batchId;
    this.productId = props.productId;
  }
}
