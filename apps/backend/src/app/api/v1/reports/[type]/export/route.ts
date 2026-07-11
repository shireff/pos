import { NextRequest, NextResponse } from 'next/server';
import { assertReportsPermission } from '../../../../../../lib/reports-permissions';
import { handleApiError } from '../../../../../../lib/errors';
import { renderPdf, streamCsv, exportJson } from '@packages/infrastructure-reports';

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
): Promise<NextResponse> {
  try {
    await assertReportsPermission(request, 'reports.export');

    const { type } = await params;
    const format = request.nextUrl.searchParams.get('format') ?? 'json';
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') ?? 'company-1';
    const baseUrl = getBaseUrl(request);
    const reportUrl = `${baseUrl}/api/v1/reports/${type}?companyId=${encodeURIComponent(companyId)}`;
    const reportResponse = await fetch(reportUrl);
    const reportData = await reportResponse.json();

    if (format === 'csv') {
      const rows = Array.isArray(reportData.data) ? reportData.data : [reportData.data];
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      let csvBody = '';
      const write = (chunk: string) => { csvBody += chunk; };
      await streamCsv(rows, headers, write);
      return new NextResponse(csvBody, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      const html = `<html><body><h1>${type} Report</h1><pre>${JSON.stringify(reportData.data, null, 2)}</pre></body></html>`;
      const pdfBuffer = await renderPdf(html);
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${type}.pdf"`,
        },
      });
    }

    const json = exportJson(reportData.data);
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${type}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
