import { NextRequest, NextResponse } from 'next/server';
import { AiAssistantQuerySchema } from '../ai.schemas';
import { assertAiAssistantPermission, getActorId, getCompanyId } from '../../../../../lib/ai-permissions';
import { handleApiError, ValidationError } from '../../../../../lib/errors';
import { QueryAssistantHandler } from '@packages/application-ai-insights';
import { AssistantFeature } from '@packages/application-ai-insights';
import { QueryClassifier } from '@packages/application-ai';
import { ContextAssembler } from '@packages/application-ai';
import { AIGateway } from '@packages/infrastructure-ai-clients';
import { LocalModelProvider } from '@packages/infrastructure-ai-clients';

const classifier = new QueryClassifier();
const contextAssembler = new ContextAssembler();
const gateway = new AIGateway();
const assistantFeature = new AssistantFeature(gateway);
const queryAssistantHandler = new QueryAssistantHandler(assistantFeature, classifier, contextAssembler);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertAiAssistantPermission(request);

    const body: unknown = await request.json();
    const parsed = AiAssistantQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
      );
    }
    const data = parsed.data;

    const companyId = getCompanyId(request);
    const userId = getActorId(request);

    const result = await queryAssistantHandler.execute({
      question: data.question,
      companyId,
      branchId: data.branchId,
      userId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
