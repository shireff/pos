import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { ProfitAndLossReport, ProfitAndLossInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view.financial');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const branchId = url.searchParams.get('branchId') ?? undefined;
    const year = parseInt(url.searchParams.get('year') ?? new Date().getFullYear().toString(), 10);
    const month = parseInt(url.searchParams.get('month') ?? (new Date().getMonth() + 1).toString(), 10);

    const repos = getReportsRepos();
    const report = new ProfitAndLossReport(repos.monthlySalesRollupRepo);
    const result = await report.execute({ companyId, branchId, year, month } as ProfitAndLossInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
