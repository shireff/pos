import { NextRequest, NextResponse } from 'next/server';
import { AiInsightListQuerySchema } from '../ai.schemas';
import { assertAiViewPermission, getCompanyId } from '../../../../../lib/ai-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { getMongoDb } from '@packages/infrastructure-mongodb';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    assertAiViewPermission(request);

    const url = new URL(request.url);
    const parsed = AiInsightListQuerySchema.safeParse({
      type: url.searchParams.get('type') ?? undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
    });
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const { type, limit = 50, offset = 0 } = parsed.data;

    const db = await getMongoDb();
    const collection = db.collection('ai_predictions');
    const query: Record<string, unknown> = { companyId: getCompanyId(request) };
    if (type) query.insightType = type;

    const insights = await collection
      .find(query)
      .sort({ generatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return NextResponse.json({ success: true, data: insights });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
