import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { TaxEtaReport, TaxEtaInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view.financial');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const year = parseInt(url.searchParams.get('year') ?? new Date().getFullYear().toString(), 10);
    const month = parseInt(url.searchParams.get('month') ?? (new Date().getMonth() + 1).toString(), 10);

    const repos = getReportsRepos();
    const report = new TaxEtaReport(repos.paymentTransactionRepo);
    const result = await report.execute({ companyId, year, month } as TaxEtaInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
