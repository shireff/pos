import { NextRequest, NextResponse } from 'next/server';
import { MergeCustomersCommand } from '@packages/application-crm';
import { assertCustomersPermission } from '../../../../../lib/customers-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { MongoCustomerRepository } from '@packages/infrastructure-mongodb';
import { MergeCustomersSchema } from '../customers.schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertCustomersPermission(request, 'customers.edit');

    const body: unknown = await request.json();
    const parsed = MergeCustomersSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e: { message: string }) => e.message).join('; '));
    }

    const repo = new MongoCustomerRepository();
    const command = new MergeCustomersCommand(repo);
    const result = await command.execute({
      companyId: 'company-1',
      sourceId: parsed.data.sourceId,
      targetId: parsed.data.targetId,
      performedByUserId: 'system',
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
