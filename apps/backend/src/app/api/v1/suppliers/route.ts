import { NextRequest, NextResponse } from 'next/server';
import {
  CreateSupplierCommand,
  SearchSuppliersQuery,
} from '@packages/application-purchasing';
import { assertSuppliersPermission, getActorId } from '../../../../lib/suppliers-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import {
  MongoSupplierRepository,
  MongoSupplierLedgerEntryRepository,
  MongoSupplierPriceHistoryRepository,
} from '@packages/infrastructure-mongodb';
import { CreateSupplierSchema, SearchSuppliersSchema } from './suppliers.schemas';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSuppliersPermission(request, 'suppliers.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const parsed = SearchSuppliersSchema.safeParse({
      query: url.searchParams.get('query') ?? undefined,
      isActive: url.searchParams.get('isActive') ? url.searchParams.get('isActive') === 'true' : undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
    });

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const repo = new MongoSupplierRepository();
    const query = new SearchSuppliersQuery(repo);
    const result = await query.execute({
      companyId,
      search: parsed.data.query,
      isActive: parsed.data.isActive,
      limit: parsed.data.limit ?? 50,
      offset: parsed.data.offset ?? 0,
    });

    return NextResponse.json({ success: true, data: result.suppliers, total: result.total });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSuppliersPermission(request, 'suppliers.create');

    const body: unknown = await request.json();
    const parsed = CreateSupplierSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const data = parsed.data;
    const repo = new MongoSupplierRepository();
    const command = new CreateSupplierCommand(repo);
    const supplier = await command.execute({
      companyId: 'company-1',
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      taxId: data.taxId,
      paymentTermsDays: data.paymentTermsDays,
      currency: data.currency,
      contacts: data.contacts,
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
