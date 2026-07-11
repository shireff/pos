import { NextRequest, NextResponse } from 'next/server';
import {
  ProcessPaymentCommand,
  GetPaymentMethodsQuery,
} from '@packages/application-sales';
import { assertSalesPermission, getCompanyId } from '../../../../lib/sales-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { getSalesRepos } from '../sales/sales.deps';
import { ProcessPaymentSchema } from './payments.schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'payments.tender.record');

    const body: unknown = await request.json();
    const parsed = ProcessPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = getCompanyId(request);
    const repos = getSalesRepos();

    const command = new ProcessPaymentCommand(
      repos.paymentTransactionRepo,
      repos.paymentMethodRepo,
    );
    const result = await command.execute({
      companyId,
      orderId: data.orderId,
      tenders: data.tenders,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'payments.provider.configure');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);

    const repos = getSalesRepos();
    const query = new GetPaymentMethodsQuery(repos.paymentMethodRepo);
    const methods = await query.execute({ companyId });

    return NextResponse.json({ success: true, data: methods });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
