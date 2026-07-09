import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../../../../lib/errors';
import { assertInventoryPermission } from '../../../../../../../lib/inventory-permissions';
import { CancelTransferCommand } from '@packages/application-inventory';
import { MongoStockTransferRepository } from '@packages/infrastructure-mongodb';

const transferRepo = new MongoStockTransferRepository();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertInventoryPermission(request, 'inventory.transfer.create');

    const { id } = await context.params;
    const body = await request.json();
    const command = new CancelTransferCommand(transferRepo);
    const result = await command.execute({ companyId: body.companyId ?? 'company-1', transferId: id });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
