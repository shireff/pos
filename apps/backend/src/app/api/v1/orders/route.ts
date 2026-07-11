import { NextRequest, NextResponse } from 'next/server';
import {
  CreateSaleCommand,
} from '@packages/application-sales';
import { assertSalesPermission, getActorId, getCompanyId } from '../../../../lib/sales-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { getSalesRepos, resolveWarehouseId } from '../sales/sales.deps';
import { CreateSaleSchema } from '../sales/sales.schemas';
import { serializeOrder } from '../sales/serialize';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'sales.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const filter = {
      branchId: url.searchParams.get('branchId') ?? undefined,
      cashierId: url.searchParams.get('cashierId') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      dateFrom: url.searchParams.get('dateFrom') ?? undefined,
      dateTo: url.searchParams.get('dateTo') ?? undefined,
    };

    const { orderRepo } = getSalesRepos();
    const orders = await orderRepo.findByCompany(companyId, filter);

    return NextResponse.json({
      success: true,
      data: orders.map((o) => serializeOrder(o)),
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'sales.create');

    const body: unknown = await request.json();
    const parsed = CreateSaleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = data.companyId ?? getCompanyId(request);
    const branchId = data.branchId;
    const cashierId = data.cashierId ?? getActorId(request);
    const repos = getSalesRepos();
    const warehouseId = data.warehouseId ?? (await resolveWarehouseId(repos, companyId, branchId));

    const command = new CreateSaleCommand(
      repos.orderRepo,
      repos.stockMovementRepo,
      repos.stockItemRepo,
      repos.batchRepo,
      null,
      null,
      repos.discountRepo,
      repos.couponRepo,
      repos.taxRuleRepo,
    );
    const { order } = await command.execute({
      companyId,
      branchId,
      cashierId,
      warehouseId,
      clientTxnId: data.clientTxnId,
      customerId: data.customerId ?? null,
      shiftSessionId: data.shiftSessionId ?? null,
      lines: data.lines.map((l) => ({
        productVariantId: l.productVariantId,
        productId: l.productId,
        batchId: l.batchId ?? null,
        isBundle: l.isBundle,
        quantity: l.quantity,
        unitPricePiasters: l.unitPricePiasters,
        discountAmountPiasters: l.discountAmountPiasters,
        taxAmountPiasters: l.taxAmountPiasters,
        costSnapshotPiasters: l.costSnapshotPiasters,
      })),
      payments: data.payments.map((p) => ({
        tenderType: p.tenderType,
        amountPiasters: p.amountPiasters,
        providerReference: p.providerReference ?? null,
      })),
      discountRuleIds: data.discountRuleIds,
      couponCode: data.couponCode ?? null,
    });

    return NextResponse.json({ success: true, data: serializeOrder(order) }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
