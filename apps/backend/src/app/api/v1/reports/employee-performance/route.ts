import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { EmployeePerformanceReport, EmployeePerformanceInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view.employees');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const branchId = url.searchParams.get('branchId') ?? '';
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';

    const repos = getReportsRepos();
    const report = new EmployeePerformanceReport(repos.employeePerformanceRepo);
    const result = await report.execute({ companyId, branchId, from, to } as EmployeePerformanceInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
