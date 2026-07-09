import { NextRequest, NextResponse } from 'next/server';
import { OpenShiftCommand } from '@packages/application-sales';
import { assertSalesPermission, getActorId, getCompanyId } from '../../../../lib/sales-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { getSalesRepos } from '../sales/sales.deps';
import { OpenShiftSchema } from '../sales/sales.schemas';
import { serializeShift } from '../sales/serialize';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertSalesPermission(request, 'sales.shift.open_close');

    const body: unknown = await request.json();
    const parsed = OpenShiftSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = data.companyId ?? getCompanyId(request);
    const cashierId = data.cashierId ?? getActorId(request);
    const { shiftRepo } = getSalesRepos();

    const command = new OpenShiftCommand(shiftRepo);
    const session = await command.execute({
      companyId,
      branchId: data.branchId,
      cashierId,
      openingCashPiasters: data.openingCashPiasters,
    });

    return NextResponse.json({ success: true, data: serializeShift(session) }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
