import type { IAIProvider, CompletionRequest, CompletionResult, ClassificationRequest, ClassificationResult, EmbeddingResult } from '@packages/application-ai';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in (window as unknown as Record<string, unknown>);
}

async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error(`[local-model] Not running inside Tauri. Command "${command}" cannot be invoked.`);
  }
  const { invoke } = await import('@tauri-apps/api/tauri');
  return invoke<T>(command, args);
}

function isCapacitor(): boolean {
  return typeof window !== 'undefined' && 'Capacitor' in (window as unknown as Record<string, unknown>);
}

async function getCapacitorLocalModel(): Promise<{
  complete(prompt: string, maxTokens?: number, temperature?: number): Promise<{ text: string; tokensUsed: number }>;
  embed(text: string): Promise<number[]>;
  classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }>;
  isAvailable(): Promise<boolean>;
} | null> {
  if (!isCapacitor()) return null;
  try {
    const specifier = '@capacitor-community/local-llm';
    const mod = (await import(/* @vite-ignore */ specifier)) as unknown as {
      LocalLLM: {
        complete(prompt: string, maxTokens?: number, temperature?: number): Promise<{ text: string; tokensUsed: number }>;
        embed(text: string): Promise<number[]>;
        classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }>;
        isAvailable(): Promise<boolean>;
      };
    };
    return mod.LocalLLM;
  } catch {
    return null;
  }
}

/**
 * LocalModelProvider — calls llama.cpp via Tauri sidecar (Desktop) or
 * embedded model file (Android). Always available offline; lowest latency
 * for short prompts.
 */
export class LocalModelProvider implements IAIProvider {
  public async complete(request: CompletionRequest): Promise<CompletionResult> {
    if (isTauri()) {
      const result = await tauriInvoke<{ text: string; tokensUsed: number }>('llama_complete', {
        prompt: request.prompt,
        max_tokens: request.maxTokens ?? 256,
        temperature: request.temperature ?? 0.7,
        model: request.model ?? 'default',
        system_prompt: request.systemPrompt ?? null,
      });
      return {
        text: result.text,
        tokensUsed: result.tokensUsed,
        model: request.model ?? 'default',
        source: 'local',
      };
    }

    const plugin = await getCapacitorLocalModel();
    if (plugin) {
      const result = await plugin.complete(request.prompt, request.maxTokens ?? 256, request.temperature ?? 0.7);
      return {
        text: result.text,
        tokensUsed: result.tokensUsed,
        model: request.model ?? 'default',
        source: 'local',
      };
    }

    throw new Error('Local model is not available on this platform');
  }

  public async embed(text: string): Promise<EmbeddingResult> {
    if (isTauri()) {
      const result = await tauriInvoke<number[]>('llama_embed', { text });
      return {
        embedding: result,
        model: 'default',
        source: 'local',
      };
    }

    const plugin = await getCapacitorLocalModel();
    if (plugin) {
      const embedding = await plugin.embed(text);
      return {
        embedding,
        model: 'default',
        source: 'local',
      };
    }

    throw new Error('Local model is not available on this platform');
  }

  public async classify(request: ClassificationRequest): Promise<ClassificationResult> {
    if (isTauri()) {
      const result = await tauriInvoke<{ category: string; confidence: number }>('llama_classify', {
        text: request.text,
        categories: request.categories,
      });
      return result;
    }

    const plugin = await getCapacitorLocalModel();
    if (plugin) {
      return plugin.classify(request.text, request.categories);
    }

    throw new Error('Local model is not available on this platform');
  }

  public async isAvailable(): Promise<boolean> {
    if (isTauri()) {
      try {
        await tauriInvoke<boolean>('llama_available');
        return true;
      } catch {
        return false;
      }
    }

    if (isCapacitor()) {
      const plugin = await getCapacitorLocalModel();
      if (plugin) {
        return plugin.isAvailable();
      }
      return false;
    }

    return false;
  }
}
