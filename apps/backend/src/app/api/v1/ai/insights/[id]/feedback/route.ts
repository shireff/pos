import { NextRequest, NextResponse } from 'next/server';
import { AiInsightFeedbackSchema } from '../../../ai.schemas';
import { assertAiViewPermission, getActorId } from '../../../../../../../lib/ai-permissions';
import { handleApiError, ValidationError } from '../../../../../../../lib/errors';
import { SubmitFeedbackHandler } from '@packages/application-ai-insights';

const submitFeedbackHandler = new SubmitFeedbackHandler();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    assertAiViewPermission(request);

    const body: unknown = await request.json();
    const parsed = AiInsightFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const userId = getActorId(request);
    const result = await submitFeedbackHandler.execute({
      insightId: params.id,
      userId,
      accepted: data.action === 'accept',
      modifiedValue: data.modifiedValue ?? undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
