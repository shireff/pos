import { NextRequest, NextResponse } from 'next/server';
import {
  CreateTaxRuleCommand,
} from '@packages/application-tax';
import {
  MongoTaxRuleRepository,
} from '@packages/infrastructure-mongodb';
import { assertTaxPermission } from '../../../../lib/tax-permissions';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { CreateTaxRuleSchema } from './tax-rules.schemas';

const repo = new MongoTaxRuleRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertTaxPermission(request, 'tax.rules.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';

    const rules = await repo.findByCompany(companyId, { isActive: true });

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertTaxPermission(request, 'tax.rules.edit');

    const body: unknown = await request.json();
    const parsed = CreateTaxRuleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }

    const command = new CreateTaxRuleCommand(repo);
    const taxRule = await command.execute({
      companyId: 'company-1',
      name: parsed.data.name,
      rateBasisPoints: parsed.data.rateBasisPoints,
      appliesTo: parsed.data.appliesTo,
      scopeIds: parsed.data.scopeIds,
      priority: parsed.data.priority,
    });

    return NextResponse.json({ success: true, data: taxRule }, { status: 201 });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
