import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { SupplierPerformanceReport, SupplierPerformanceInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view.purchasing');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const supplierId = url.searchParams.get('supplierId') ?? undefined;
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';

    const repos = getReportsRepos();
    const report = new SupplierPerformanceReport(repos.salesRepos.ledgerRepo, repos.salesRepos.priceHistoryRepo);
    const result = await report.execute({ companyId, supplierId, from, to } as SupplierPerformanceInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
