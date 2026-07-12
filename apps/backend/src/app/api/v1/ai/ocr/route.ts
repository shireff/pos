import { NextRequest, NextResponse } from 'next/server';
import { AiOcrSchema } from '../ai.schemas';
import { assertAiAssistantPermission, getActorId, getCompanyId } from '../../../../../lib/ai-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { OcrFeature } from '@packages/application-ai-insights';
import { AIGateway } from '@packages/infrastructure-ai-clients';
import { LocalModelProvider } from '@packages/infrastructure-ai-clients';

const gateway = new AIGateway();
const ocrFeature = new OcrFeature(gateway);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertAiAssistantPermission(request);

    const body: unknown = await request.json();
    const parsed = AiOcrSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = getCompanyId(request);
    const userId = getActorId(request);

    const result = await ocrFeature.execute({
      companyId,
      userId,
      imageReference: data.fileReference,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
