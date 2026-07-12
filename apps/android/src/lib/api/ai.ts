import { ApiEndpoints, buildEndpoint } from './endpoints';
import { client } from './client';

async function getJson<T>(url: string): Promise<T> {
    const res = await client.get(url);
    return res.data.data as T;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
    const res = await client.post(url, payload);
    return res.data.data as T;
}

export interface AiInsightView {
    id: string;
    type: string;
    headline: string;
    narrative: string;
    source: string;
    generatedAt: string;
}

export const aiInsightsApi = {
    async list(): Promise<AiInsightView[]> {
        return getJson<AiInsightView[]>(ApiEndpoints.AiInsights);
    },

    async submitFeedback(insightId: string, action: 'accept' | 'reject' | 'modify', modifiedValue?: string): Promise<void> {
        await postJson(buildEndpoint(ApiEndpoints.AiInsightFeedback, { id: insightId }), {
            action,
            modifiedValue,
        });
    },
};

export const aiAssistantApi = {
    async query(question: string): Promise<{ answer: string; source: string }> {
        return postJson<{ answer: string; source: string }>(ApiEndpoints.AiAssistantQuery, { question });
    },
};

export const aiOcrApi = {
    async extract(fileReference: string): Promise<Record<string, unknown>> {
        return postJson<Record<string, unknown>>(ApiEndpoints.AiOcr, { fileReference });
    },
};
