import { NextRequest, NextResponse } from 'next/server';
import {
  CreateCustomerCommand,
  SearchCustomersQuery,
} from '@packages/application-crm';
import { assertCustomersPermission, getActorId } from '../../../../lib/customers-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import {
  MongoCustomerRepository,
} from '@packages/infrastructure-mongodb';
import { CreateCustomerSchema, SearchCustomersSchema } from './customers.schemas';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCustomersPermission(request, 'customers.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const parsed = SearchCustomersSchema.safeParse({
      query: url.searchParams.get('query') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
    });

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const repo = new MongoCustomerRepository();
    const query = new SearchCustomersQuery(repo);
    const result = await query.execute({
      companyId,
      query: parsed.data.query ?? '',
      status: parsed.data.status,
      limit: parsed.data.limit ?? 50,
      offset: parsed.data.offset ?? 0,
    });

    return NextResponse.json({ success: true, data: result.customers, total: result.total });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCustomersPermission(request, 'customers.create');

    const body: unknown = await request.json();
    const parsed = CreateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const data = parsed.data;
    const repo = new MongoCustomerRepository();
    const command = new CreateCustomerCommand(repo);
    const customer = await command.execute({
      companyId: 'company-1',
      name: data.name,
      phone: data.phone,
      email: data.email,
      creditLimitPiasters: data.creditLimitPiasters,
      notes: data.notes,
      createdByUserId: getActorId(request),
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
