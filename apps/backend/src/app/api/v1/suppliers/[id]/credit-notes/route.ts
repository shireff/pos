import { NextRequest, NextResponse } from 'next/server';
import { ApplySupplierCreditNoteCommand } from '@packages/application-purchasing';
import { assertSuppliersPermission } from '../../../../../../lib/suppliers-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';
import {
  MongoSupplierRepository,
  MongoSupplierLedgerEntryRepository,
} from '@packages/infrastructure-mongodb';
import { ApplySupplierCreditNoteSchema } from '../../suppliers.schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSuppliersPermission(request, 'suppliers.ledger.record');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = ApplySupplierCreditNoteSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const data = parsed.data;
    const supplierRepo = new MongoSupplierRepository();
    const ledgerRepo = new MongoSupplierLedgerEntryRepository();
    const command = new ApplySupplierCreditNoteCommand(ledgerRepo, supplierRepo);
    const result = await command.execute({
      supplierId: id,
      companyId,
      amountPiasters: data.amountPiasters,
      referenceNumber: data.referenceNumber,
      reason: data.reason,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
