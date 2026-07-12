import { NextRequest, NextResponse } from 'next/server';
import { RefundPaymentCommand } from '@packages/application-sales';
import { assertSalesPermission, getCompanyId } from '../../../../../../lib/sales-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';
import { getSalesRepos } from '../../../sales/sales.deps';
import { RefundPaymentSchema } from '../../payments.schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await assertSalesPermission(request, 'payments.tender.record');

    const body: unknown = await request.json();
    const parsed = RefundPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = getCompanyId(request);
    const repos = getSalesRepos();

    const command = new RefundPaymentCommand(repos.paymentTransactionRepo);
    const result = await command.execute({
      companyId,
      orderId: id,
      transactionId: data.transactionId,
      amountPiasters: data.amountPiasters,
      reason: data.reason ?? undefined,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
