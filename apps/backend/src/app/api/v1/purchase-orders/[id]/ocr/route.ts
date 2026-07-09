import { NextRequest, NextResponse } from 'next/server';
import { UploadInvoiceForOcrCommand } from '@packages/application-purchasing';
import { assertPurchasingPermission } from '../../../../../../lib/purchasing-permissions';
import { handleApiError, ValidationError } from '../../../../../../lib/errors';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await assertPurchasingPermission(request, 'purchasing.create');

    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = (body as { fileReference?: string }) ?? {};
    if (!parsed.fileReference || parsed.fileReference.trim().length === 0) {
      throw new ValidationError('fileReference is required');
    }

    const command = new UploadInvoiceForOcrCommand();
    const extracted = await command.execute({ fileReference: parsed.fileReference });

    // Stub: return deterministic mock extracted data for review — never auto-apply.
    return NextResponse.json({
      success: true,
      data: {
        purchaseOrderId: id,
        extracted,
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
