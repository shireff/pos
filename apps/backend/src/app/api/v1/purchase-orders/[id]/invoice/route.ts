import { NextRequest, NextResponse } from 'next/server';
import { RecordSupplierInvoiceCommand } from '@packages/application-purchasing';
import { assertPurchasingPermission } from '../../../../../../lib/purchasing-permissions';
import { handleApiError, ValidationError, NotFoundError } from '../../../../../../lib/errors';
import { MongoPurchaseOrderRepository, MongoSupplierInvoiceRepository } from '@packages/infrastructure-mongodb';
import { RecordSupplierInvoiceSchema } from '../../purchases.schemas';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.invoice.record');

    const { id } = await context.params;
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = RecordSupplierInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const poRepo = new MongoPurchaseOrderRepository();
    const po = await poRepo.findById(id, companyId);
    if (!po) throw new NotFoundError('PurchaseOrder', id);

    const repo = new MongoSupplierInvoiceRepository();
    const command = new RecordSupplierInvoiceCommand(repo);
    const invoice = await command.execute({
      poId: id,
      companyId,
      supplierId: parsed.data.supplierId,
      invoiceNumber: parsed.data.invoiceNumber,
      invoiceDate: parsed.data.invoiceDate,
      totalAmountPiasters: parsed.data.totalAmountPiasters,
      taxAmountPiasters: parsed.data.taxAmountPiasters,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        purchaseOrderId: invoice.purchaseOrderId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        totalAmountPiasters: invoice.totalAmountPiasters,
        taxAmountPiasters: invoice.taxAmountPiasters,
        status: invoice.status,
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
