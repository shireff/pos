export type ContextSliceType =
  | 'sales_kpis'
  | 'inventory_status'
  | 'recent_transactions'
  | 'customer_summary'
  | 'product_catalog'
  | 'financial_summary'
  | 'employee_activity'
  | 'anomaly_history';

export interface ContextSlice {
  type: ContextSliceType;
  label: string;
  data: unknown;
  tokenEstimate: number;
}

export interface ContextAssembly {
  query: string;
  classification: {
    complexity: 'low' | 'medium' | 'high';
    privacySensitivity: 'low' | 'high';
    latencyBudget: 'interactive' | 'batch';
  };
  slices: ContextSlice[];
  totalTokens: number;
  maxTokens: number;
  truncated: boolean;
}

const MAX_TOKENS_BY_COMPLEXITY: Record<string, number> = {
  low: 512,
  medium: 2048,
  high: 4096,
};

const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'credential',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'nationalId',
  'national_id',
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
  'privateKey',
  'private_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
]);

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function redactSensitiveData(obj: unknown, path: string = ''): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => redactSensitiveData(item, `${path}[${index}]`));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactSensitiveData(value, path ? `${path}.${key}` : key);
    }
  }

  return result;
}

export class ContextAssembler {
  /**
   * Builds a structured context payload from read-model slices.
   * Enforces token budgets and redacts sensitive fields.
   */
  public async assemble(params: {
    query: string;
    classification: { complexity: 'low' | 'medium' | 'high'; privacySensitivity: 'low' | 'high' };
    availableSlices: Array<{
      type: ContextSliceType;
      label: string;
      fetch: () => Promise<unknown>;
    }>;
  }): Promise<ContextAssembly> {
    const maxTokens = MAX_TOKENS_BY_COMPLEXITY[params.classification.complexity] ?? 2048;
    const slices: ContextSlice[] = [];
    let totalTokens = 0;
    let truncated = false;

    for (const sliceDef of params.availableSlices) {
      if (truncated) break;

      const rawData = await sliceDef.fetch();
      const redacted = params.classification.privacySensitivity === 'high'
        ? this.aggregateIfPossible(rawData)
        : redactSensitiveData(rawData);

      const serialized = JSON.stringify(redacted);
      const tokenEstimate = estimateTokens(serialized);

      if (totalTokens + tokenEstimate > maxTokens) {
        truncated = true;
        break;
      }

      slices.push({
        type: sliceDef.type,
        label: sliceDef.label,
        data: redacted,
        tokenEstimate,
      });

      totalTokens += tokenEstimate;
    }

    return {
      query: params.query,
      classification: {
        ...params.classification,
        latencyBudget: 'interactive',
      },
      slices,
      totalTokens,
      maxTokens,
      truncated,
    };
  }

  /**
   * When privacy sensitivity is high, replace raw records with aggregated
   * statistics so no individual PII reaches the model context.
   */
  private aggregateIfPossible(data: unknown): unknown {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return { count: 0 };

      const first = data[0];
      if (first && typeof first === 'object' && 'amount' in first && 'count' in first) {
        const totalAmount = data.reduce((sum: number, item: Record<string, unknown>) => sum + Number(item.amount ?? 0), 0);
        const totalCount = data.reduce((sum: number, item: Record<string, unknown>) => sum + Number(item.count ?? 0), 0);
        return {
          aggregatedFrom: data.length,
          totalAmount,
          totalCount,
          averageAmount: totalCount > 0 ? totalAmount / totalCount : 0,
        };
      }

      return {
        aggregatedFrom: data.length,
        summary: 'Array data redacted for privacy',
      };
    }

    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const aggregated: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'number') {
          aggregated[key] = value;
        } else if (Array.isArray(value)) {
          aggregated[key] = this.aggregateIfPossible(value);
        } else {
          aggregated[key] = redactSensitiveData(value);
        }
      }
      return aggregated;
    }

    return data;
  }
}
