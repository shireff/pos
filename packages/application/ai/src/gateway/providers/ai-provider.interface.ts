export interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
}

export interface CompletionResult {
  text: string;
  tokensUsed: number;
  model: string;
  source: string;
}

export interface ClassificationRequest {
  text: string;
  categories: string[];
}

export interface ClassificationResult {
  category: string;
  confidence: number;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  source: string;
}

export interface IAIProvider {
  complete(request: CompletionRequest): Promise<CompletionResult>;
  embed(text: string): Promise<EmbeddingResult>;
  classify(request: ClassificationRequest): Promise<ClassificationResult>;
  isAvailable(): Promise<boolean>;
}
