import { NextRequest, NextResponse } from 'next/server';
import { CloseShiftCommand } from '@packages/application-sales';
import { assertSalesPermission, getActorId, getCompanyId } from '../../../../../../lib/sales-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';
import { getSalesRepos } from '../../../sales/sales.deps';
import { CloseShiftSchema } from '../../../sales/sales.schemas';
import { serializeShift } from '../../../sales/serialize';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'sales.shift.open_close');

    const body: unknown = await request.json();
    const parsed = CloseShiftSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = getCompanyId(request);
    const cashierId = getActorId(request);
    const { shiftRepo } = getSalesRepos();

    const command = new CloseShiftCommand(shiftRepo);
    const session = await command.execute({
      companyId,
      branchId: 'branch-1',
      cashierId,
      shiftSessionId: data.shiftSessionId,
      closingCashPiasters: data.closingCashPiasters,
    });

    return NextResponse.json({ success: true, data: serializeShift(session) });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
