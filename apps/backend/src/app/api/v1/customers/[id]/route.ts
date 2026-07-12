import { NextRequest, NextResponse } from 'next/server';
import {
  GetCustomerQuery,
  UpdateCustomerCommand,
} from '@packages/application-crm';
import { assertCustomersPermission } from '../../../../../lib/customers-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import {
  MongoCustomerRepository,
  MongoLoyaltyAccountRepository,
  MongoLoyaltyEventRepository,
  MongoCreditLedgerBalanceRepository,
  MongoCreditLedgerEntryRepository,
} from '@packages/infrastructure-mongodb';
import { UpdateCustomerSchema } from '../customers.schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertCustomersPermission(request, 'customers.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const repo = new MongoCustomerRepository();
    const loyaltyAccountRepo = new MongoLoyaltyAccountRepository();
    const loyaltyEventRepo = new MongoLoyaltyEventRepository();
    const creditLedgerRepo = new MongoCreditLedgerBalanceRepository();
    const creditEntryRepo = new MongoCreditLedgerEntryRepository();

    const query = new GetCustomerQuery(
      repo,
      loyaltyAccountRepo,
      creditLedgerRepo,
      loyaltyEventRepo,
      creditEntryRepo,
    );
    const result = await query.execute({
      companyId,
      customerId: id,
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
    await assertCustomersPermission(request, 'customers.edit');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = UpdateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const repo = new MongoCustomerRepository();
    const command = new UpdateCustomerCommand(repo);
    const customer = await command.execute({
      customerId: id,
      companyId,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
