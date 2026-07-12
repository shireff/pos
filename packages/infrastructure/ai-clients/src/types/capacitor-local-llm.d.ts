/**
 * Ambient declaration for the optional `@capacitor-community/local-llm`
 * plugin used by the Android (Capacitor) shell for on-device LLM inference.
 * The plugin is loaded lazily, so it is intentionally NOT a hard dependency
 * of this package — this declaration keeps typechecking green when the
 * plugin is not installed. Shape is the minimal subset the provider relies on.
 */
declare module '@capacitor-community/local-llm' {
  export const LocalLLM: {
    complete(prompt: string, maxTokens?: number, temperature?: number): Promise<{ text: string; tokensUsed: number }>;
    embed(text: string): Promise<number[]>;
    classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }>;
    isAvailable(): Promise<boolean>;
  };
}
