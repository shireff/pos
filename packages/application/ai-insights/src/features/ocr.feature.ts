import type { OcrCommand } from './ai-features.types';
import { AIRecommendation } from '@packages/domain-ai-insights';
import { Identifier } from '@packages/shared-kernel';
import type { IAIProvider } from '@packages/application-ai';

export interface OcrResult {
  supplier: string;
  date: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
}

export class OcrFeature {
  public constructor(private readonly aiProvider: IAIProvider) {}

  public async execute(command: OcrCommand): Promise<{ recommendation: AIRecommendation; extracted: OcrResult }> {
    const prompt = `Extract structured invoice data from the image reference: ${command.imageReference}.\nReturn JSON with fields: supplier, date, lineItems (array of {description, quantity, unitPrice, total}), subtotal, tax, total.`;

    const result = await this.aiProvider.complete({
      prompt,
      maxTokens: 1024,
      temperature: 0.1,
    });

    let extracted: OcrResult;
    try {
      extracted = JSON.parse(result.text);
    } catch {
      extracted = {
        supplier: '',
        date: '',
        lineItems: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };
    }

    const recommendation = AIRecommendation.create({
      companyId: command.companyId,
      insightType: 'ocr_extraction',
      payload: JSON.stringify(extracted),
      narrativeText: `OCR extracted ${extracted.lineItems.length} line items from invoice.`,
      source: result.source as 'local',
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return { recommendation, extracted };
  }
}
