export type QueryComplexity = 'low' | 'medium' | 'high';
export type PrivacySensitivity = 'low' | 'high';
export type LatencyBudget = 'interactive' | 'batch';

export interface QueryClassification {
  complexity: QueryComplexity;
  privacySensitivity: PrivacySensitivity;
  latencyBudget: LatencyBudget;
  suggestedProvider: 'local' | 'nara';
  reasoning: string[];
}

const INDIVIDUAL_IDENTIFIER_PATTERNS = [
  /\b(customer|client|user|person|buyer)\s+(name|id|email|phone|address)\b/i,
  /\b(find|show|get)\s+(my|specific|single)\s+(customer|order|transaction|sale)\b/i,
  /\b(phone|email|national\s+id|address)\s+of\b/i,
  /\bindividual\b.*\b(customer|sale|order|transaction)\b/i,
];

const BATCH_PATTERNS = [
  /\b(batch|schedule|nightly|daily|weekly|all|every|export|report)\b/i,
  /\b(calculate|compute|generate)\s+(all|every|full)\b/i,
];

const COMPLEX_PATTERNS = [
  /\b(why|how|explain|analyze|compare|trend|forecast|predict|correlate)\b/i,
  /\b(what\s+if|scenario|simulate)\b/i,
  /\b(across|between|relationship|pattern)\b/i,
];

export class QueryClassifier {
  /**
   * Classifies a natural-language query to determine routing and context assembly.
   */
  public classify(query: string): QueryClassification {
    const reasoning: string[] = [];
    const lower = query.toLowerCase();

    const privacySensitivity = this.classifyPrivacy(lower, reasoning);
    const complexity = this.classifyComplexity(lower, reasoning);
    const latencyBudget = this.classifyLatency(lower, reasoning);
    const suggestedProvider = this.determineProvider(complexity, privacySensitivity, latencyBudget, reasoning);

    return {
      complexity,
      privacySensitivity,
      latencyBudget,
      suggestedProvider,
      reasoning,
    };
  }

  private classifyPrivacy(query: string, reasoning: string[]): PrivacySensitivity {
    for (const pattern of INDIVIDUAL_IDENTIFIER_PATTERNS) {
      if (pattern.test(query)) {
        reasoning.push(`Privacy flagged: matched individual identifier pattern "${pattern.source}"`);
        return 'high';
      }
    }

    if (/\b(my\s+\w+|specific\s+\w+|single\s+\w+)\b/i.test(query) && /\b(customer|order|sale|transaction|invoice)\b/i.test(query)) {
      reasoning.push('Privacy flagged: query references a specific entity');
      return 'high';
    }

    reasoning.push('Privacy: aggregate-only query, no individual PII detected');
    return 'low';
  }

  private classifyComplexity(query: string, reasoning: string[]): QueryComplexity {
    const complexMatches = COMPLEX_PATTERNS.filter((p) => p.test(query)).length;
    if (complexMatches >= 2) {
      reasoning.push(`Complexity: high — matched ${complexMatches} complex-analysis patterns`);
      return 'high';
    }
    if (complexMatches === 1) {
      reasoning.push('Complexity: medium — matched one complex-analysis pattern');
      return 'medium';
    }

    if (/\b(list|show|count|total|sum|average|max|min|top|bottom)\b/i.test(query)) {
      reasoning.push('Complexity: low — simple aggregation or lookup');
      return 'low';
    }

    reasoning.push('Complexity: low — default for short factual queries');
    return 'low';
  }

  private classifyLatency(query: string, reasoning: string[]): LatencyBudget {
    for (const pattern of BATCH_PATTERNS) {
      if (pattern.test(query)) {
        reasoning.push(`Latency: batch — matched pattern "${pattern.source}"`);
        return 'batch';
      }
    }

    reasoning.push('Latency: interactive — default for on-screen queries');
    return 'interactive';
  }

  private determineProvider(
    complexity: QueryComplexity,
    privacy: PrivacySensitivity,
    latency: LatencyBudget,
    reasoning: string[],
  ): 'local' | 'nara' {
    if (privacy === 'high') {
      reasoning.push('Provider: local — high privacy sensitivity requires local inference');
      return 'local';
    }

    if (complexity === 'high' && latency === 'interactive') {
      reasoning.push('Provider: nara — high complexity requires cloud quality');
      return 'nara';
    }

    if (complexity === 'low' && latency === 'interactive') {
      reasoning.push('Provider: local — low complexity + interactive = lowest latency');
      return 'local';
    }

    if (latency === 'batch') {
      reasoning.push('Provider: nara — batch job tolerates network latency for better quality');
      return 'nara';
    }

    reasoning.push('Provider: local — default to local for balanced workloads');
    return 'local';
  }
}
