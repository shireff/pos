import type { IAIProvider, CompletionRequest, CompletionResult, ClassificationRequest, ClassificationResult, EmbeddingResult } from '@packages/application-ai';
import { LocalModelProvider } from './providers/local-model.provider';

export interface RoutingDecision {
  timestamp: string;
  requestType: 'complete' | 'embed' | 'classify';
  model: string;
  source: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface AIRoutingLog {
  log(decision: RoutingDecision): void;
  getLogs(): RoutingDecision[];
  clear(): void;
}

class InMemoryRoutingLog implements AIRoutingLog {
  private logs: RoutingDecision[] = [];
  private maxLogs = 1000;

  public log(decision: RoutingDecision): void {
    this.logs.push(decision);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  public getLogs(): RoutingDecision[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
  }
}

export interface AIGatewayDeps {
  localProvider?: IAIProvider;
  routingLog?: AIRoutingLog;
}

export class AIGateway implements IAIProvider {
  private readonly local: IAIProvider;
  private readonly log: AIRoutingLog;

  public constructor(deps: AIGatewayDeps = {}) {
    this.local = deps.localProvider ?? new LocalModelProvider();
    this.log = deps.routingLog ?? new InMemoryRoutingLog();
  }

  public async complete(request: CompletionRequest): Promise<CompletionResult> {
    const start = performance.now();
    try {
      const result = await this.local.complete(request);
      this.logDecision('complete', request.model ?? 'default', 'local', performance.now() - start, true);
      return result;
    } catch (error) {
      this.logDecision('complete', request.model ?? 'default', 'local', performance.now() - start, false, String(error));
      throw error;
    }
  }

  public async embed(text: string): Promise<EmbeddingResult> {
    const start = performance.now();
    try {
      const result = await this.local.embed(text);
      this.logDecision('embed', 'default', 'local', performance.now() - start, true);
      return result;
    } catch (error) {
      this.logDecision('embed', 'default', 'local', performance.now() - start, false, String(error));
      throw error;
    }
  }

  public async classify(request: ClassificationRequest): Promise<ClassificationResult> {
    const start = performance.now();
    try {
      const result = await this.local.classify(request);
      this.logDecision('classify', 'default', 'local', performance.now() - start, true);
      return result;
    } catch (error) {
      this.logDecision('classify', 'default', 'local', performance.now() - start, false, String(error));
      throw error;
    }
  }

  public async isAvailable(): Promise<boolean> {
    return this.local.isAvailable();
  }

  private logDecision(
    requestType: RoutingDecision['requestType'],
    model: string,
    source: string,
    latencyMs: number,
    success: boolean,
    error?: string,
  ): void {
    this.log.log({
      timestamp: new Date().toISOString(),
      requestType,
      model,
      source,
      latencyMs,
      success,
      error,
    });
  }
}
