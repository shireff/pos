import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { DailySalesSummaryReport, DailySalesSummaryInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view.sales');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const branchId = url.searchParams.get('branchId') ?? '';
    const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

    const repos = getReportsRepos();
    const report = new DailySalesSummaryReport(repos.dailySalesRollupRepo, repos.orderRepo);
    const result = await report.execute({ companyId, branchId, date } as DailySalesSummaryInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
