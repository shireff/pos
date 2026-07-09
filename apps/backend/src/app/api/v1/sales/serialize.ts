import { Order, Return } from '@packages/domain-sales';

export function serializeOrder(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    companyId: order.companyId,
    branchId: order.branchId,
    cashierId: order.cashierId,
    customerId: order.customerId,
    clientTxnId: order.clientTxnId,
    shiftSessionId: order.shiftSessionId,
    status: order.status,
    subtotalPiasters: order.subtotalPiasters,
    discountTotalPiasters: order.discountTotalPiasters,
    taxTotalPiasters: order.taxTotalPiasters,
    grandTotalPiasters: order.grandTotalPiasters,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    lines: order.lines.map((l) => ({
      id: l.id,
      productVariantId: l.productVariantId,
      batchId: l.batchId,
      quantity: l.quantity,
      unitPricePiasters: l.unitPricePiasters,
      discountAmountPiasters: l.discountAmountPiasters,
      taxAmountPiasters: l.taxAmountPiasters,
      costSnapshotPiasters: l.costSnapshotPiasters,
      lineTotalPiasters: l.lineTotalPiasters,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      tenderType: p.tenderType,
      amountPiasters: p.amountPiasters,
      providerReference: p.providerReference,
    })),
    returns: order.returns.map(serializeReturn),
  };
}

export function serializeReturn(ret: Return): Record<string, unknown> {
  return {
    id: ret.id,
    originalOrderId: ret.originalOrderId,
    returnedByUserId: ret.returnedByUserId,
    approvedByUserId: ret.approvedByUserId,
    reason: ret.reason,
    refundMethod: ret.refundMethod,
    status: ret.status,
    refundAmountPiasters: ret.refundAmountPiasters,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
    lines: ret.lines.map((l) => ({
      id: l.id,
      originalOrderLineId: l.originalOrderLineId,
      productVariantId: l.productVariantId,
      batchId: l.batchId,
      quantity: l.quantity,
      refundAmountPiasters: l.refundAmountPiasters,
    })),
  };
}

export function serializeShift(session: {
  id: string;
  companyId: string;
  branchId: string;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  openingCashPiasters: number;
  closingCashPiasters: number | null;
  status: string;
}): Record<string, unknown> {
  return {
    id: session.id,
    companyId: session.companyId,
    branchId: session.branchId,
    cashierId: session.cashierId,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    openingCashPiasters: session.openingCashPiasters,
    closingCashPiasters: session.closingCashPiasters,
    status: session.status,
  };
}
