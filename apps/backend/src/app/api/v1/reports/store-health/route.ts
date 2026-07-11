import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { StoreHealthDashboardStub, StoreHealthInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);

    const repos = getReportsRepos();
    const report = new StoreHealthDashboardStub(repos);
    const result = await report.execute({ companyId } as StoreHealthInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
