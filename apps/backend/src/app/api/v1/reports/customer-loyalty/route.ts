import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { CustomerLoyaltyReport, CustomerLoyaltyInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view.customers');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';

    const repos = getReportsRepos();
    const report = new CustomerLoyaltyReport(repos.customerLoyaltyRepo);
    const result = await report.execute({ companyId, from, to } as CustomerLoyaltyInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
