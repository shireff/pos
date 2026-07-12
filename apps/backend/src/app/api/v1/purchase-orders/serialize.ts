export function serializePurchaseOrder(po: {
  id: string;
  referenceNumber: string;
  status: string;
  supplierId: string;
  branchId: string;
  companyId: string;
  expectedDeliveryDate: string;
  totalAmountPiasters: number;
  notes: string | null;
  requestedByUserId: string;
  approvedByUserId: string | null;
  rejectedReason: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  lines: ReadonlyArray<{
    id: string;
    productId: string;
    variantId: string | null;
    unitId: string;
    orderedQuantity: number;
    unitPricePiasters: number;
    receivedQuantity: number;
  }>;
}): Record<string, unknown> {
  return {
    id: po.id,
    referenceNumber: po.referenceNumber,
    status: po.status,
    supplierId: po.supplierId,
    branchId: po.branchId,
    companyId: po.companyId,
    expectedDeliveryDate: po.expectedDeliveryDate,
    totalAmountPiasters: po.totalAmountPiasters,
    notes: po.notes,
    requestedByUserId: po.requestedByUserId,
    approvedByUserId: po.approvedByUserId,
    rejectedReason: po.rejectedReason,
    cancelledReason: po.cancelledReason,
    createdAt: po.createdAt,
    updatedAt: po.updatedAt,
    lines: po.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      variantId: l.variantId,
      unitId: l.unitId,
      orderedQuantity: l.orderedQuantity,
      unitPricePiasters: l.unitPricePiasters,
      receivedQuantity: l.receivedQuantity,
    })),
  };
}
