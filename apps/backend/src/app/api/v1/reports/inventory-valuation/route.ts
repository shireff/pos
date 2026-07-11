import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission, getCompanyId } from '../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../lib/errors';
import { getReportsRepos } from '../reports.deps';
import { InventoryValuationReport, InventoryValuationInput } from '@packages/application-reports';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.view.inventory');

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? getCompanyId(request);
    const warehouseId = url.searchParams.get('warehouseId') ?? undefined;
    const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

    const repos = getReportsRepos();
    const report = new InventoryValuationReport(repos.inventoryValuationRepo);
    const result = await report.execute({ companyId, warehouseId, date } as InventoryValuationInput);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
