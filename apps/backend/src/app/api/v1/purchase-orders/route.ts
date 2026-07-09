import { NextRequest, NextResponse } from 'next/server';
import {
  CreatePurchaseOrderCommand,
  UpdatePurchaseOrderCommand,
  SubmitForApprovalCommand,
} from '@packages/application-purchasing';
import { assertPurchasingPermission, getActorId } from '../../../../lib/purchasing-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import {
  MongoPurchaseOrderRepository,
} from '@packages/infrastructure-mongodb';
import {
  CreatePurchaseOrderSchema,
  UpdatePurchaseOrderSchema,
} from './purchases.schemas';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const filter = {
      status: url.searchParams.get('status') ?? undefined,
      supplierId: url.searchParams.get('supplierId') ?? undefined,
      dateFrom: url.searchParams.get('dateFrom') ?? undefined,
      dateTo: url.searchParams.get('dateTo') ?? undefined,
    };

    const repo = new MongoPurchaseOrderRepository();
    const pos = await repo.findByCompany(companyId, filter);

    return NextResponse.json({
      success: true,
      data: pos.map((po) => serializePurchaseOrder(po)),
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.create');

    const body: unknown = await request.json();
    const parsed = CreatePurchaseOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const data = parsed.data;
    const repo = new MongoPurchaseOrderRepository();
    const command = new CreatePurchaseOrderCommand(repo);
    let po = await command.execute({
      companyId: data.companyId,
      branchId: data.branchId,
      supplierId: data.supplierId,
      expectedDeliveryDate: data.expectedDeliveryDate,
      requestedByUserId: data.requestedByUserId ?? getActorId(request),
      notes: data.notes ?? null,
      lines: data.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId ?? null,
        unitId: l.unitId,
        orderedQuantity: l.orderedQuantity,
        unitPricePiasters: l.unitPricePiasters,
      })),
    });

    // Optional auto-submit / auto-approve based on company threshold.
    if (data.autoApproveThresholdPiasters !== undefined) {
      const submit = new SubmitForApprovalCommand(repo);
      const result = await submit.execute({
        poId: po.id,
        companyId: po.companyId,
        autoApproveThresholdPiasters: data.autoApproveThresholdPiasters,
      });
      po = result.purchaseOrder;
    }

    return NextResponse.json({ success: true, data: serializePurchaseOrder(po) }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

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

