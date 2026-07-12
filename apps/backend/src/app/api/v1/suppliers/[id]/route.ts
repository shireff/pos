import { NextRequest, NextResponse } from 'next/server';
import {
  GetSupplierQuery,
  UpdateSupplierCommand,
  DeactivateSupplierCommand,
} from '@packages/application-purchasing';
import { assertSuppliersPermission } from '../../../../../lib/suppliers-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import {
  MongoSupplierRepository,
  MongoSupplierLedgerEntryRepository,
  MongoSupplierPriceHistoryRepository,
} from '@packages/infrastructure-mongodb';
import { UpdateSupplierSchema } from '../suppliers.schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSuppliersPermission(request, 'suppliers.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const repo = new MongoSupplierRepository();
    const ledgerRepo = new MongoSupplierLedgerEntryRepository();
    const priceHistoryRepo = new MongoSupplierPriceHistoryRepository();

    const query = new GetSupplierQuery(repo, ledgerRepo, priceHistoryRepo);
    const result = await query.execute({
      companyId,
      supplierId: id,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSuppliersPermission(request, 'suppliers.edit');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = UpdateSupplierSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const repo = new MongoSupplierRepository();
    const command = new UpdateSupplierCommand(repo);
    const supplier = await command.execute({
      supplierId: id,
      companyId,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSuppliersPermission(request, 'suppliers.edit');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const repo = new MongoSupplierRepository();
    const command = new DeactivateSupplierCommand(repo);
    const supplier = await command.execute({
      supplierId: id,
      companyId,
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
