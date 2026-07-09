import { NextRequest, NextResponse } from 'next/server';
import { RecordCreditPaymentCommand } from '@packages/application-crm';
import { assertCustomersPermission } from '../../../../../lib/customers-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import {
  MongoCreditLedgerBalanceRepository,
  MongoCreditLedgerEntryRepository,
} from '@packages/infrastructure-mongodb';
import { RecordCreditPaymentSchema } from '../../customers/customers.schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    await assertCustomersPermission(request, 'customers.credit.record');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const body: unknown = await request.json();
    const parsed = RecordCreditPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const balanceRepo = new MongoCreditLedgerBalanceRepository();
    const entryRepo = new MongoCreditLedgerEntryRepository();
    const command = new RecordCreditPaymentCommand(balanceRepo, entryRepo);
    const result = await command.execute({
      companyId,
      customerId: params.id,
      amountPiasters: parsed.data.amountPiasters,
      paymentMethod: parsed.data.paymentMethod,
      referenceNumber: parsed.data.referenceNumber,
      referenceType: parsed.data.referenceType,
      referenceId: parsed.data.referenceId,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
