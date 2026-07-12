import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    source?: 'local' | 'cloud';
    timestamp: string;
}

export interface AiSalesPrediction {
    branchId: string;
    horizon: string;
    predictions: { date: string; revenue: number; confidence: number }[];
}

export interface AiHealthScore {
    companyId: string;
    overallScore: number;
    salesScore: number;
    inventoryScore: number;
    financialScore: number;
    employeeScore: number;
    customerScore: number;
    narrative: string;
    recommendations: { id: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
}

export interface AiState {
    messages: AiMessage[];
    salesPrediction: AiSalesPrediction | null;
    healthScore: AiHealthScore | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: AiState = {
    messages: [],
    salesPrediction: null,
    healthScore: null,
    status: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const queryAiAssistant = createAsyncThunk<
    AiMessage,
    { question: string; branchId?: string; dateRange?: { from: string; to: string } },
    { rejectValue: string }
>('ai/query', async ({ question, branchId, dateRange }, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.AiAssistantQuery, {
            question,
            context: { branchId, dateRange },
        });
        const data = response.data.data as { answer: string; source: 'local' | 'cloud' };
        return {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: data.answer,
            source: data.source,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to query AI assistant');
    }
});

export const fetchSalesPrediction = createAsyncThunk<
    AiSalesPrediction,
    { branchId: string; horizon?: string },
    { rejectValue: string }
>('ai/fetchSalesPrediction', async ({ branchId, horizon = 'week' }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.AiInsights}?type=sales_prediction&branchId=${encodeURIComponent(branchId)}&horizon=${encodeURIComponent(horizon)}`,
        );
        return response.data.data as AiSalesPrediction;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch sales predictions');
    }
});

export const fetchHealthScore = createAsyncThunk<
    AiHealthScore,
    string,
    { rejectValue: string }
>('ai/fetchHealthScore', async (companyId, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.AiInsights}?type=health_score&companyId=${encodeURIComponent(companyId)}`,
        );
        return response.data.data as AiHealthScore;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch health score');
    }
});

export const submitInsightFeedback = createAsyncThunk<
    void,
    { insightId: string; accepted: boolean },
    { rejectValue: string }
>('ai/submitFeedback', async ({ insightId, accepted }, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.AiInsightFeedback, { id: insightId });
        await client.post(endpoint, { accepted });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to submit insight feedback');
    }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        addUserMessage(state, action: PayloadAction<string>) {
            state.messages.push({
                id: crypto.randomUUID(),
                role: 'user',
                content: action.payload,
                timestamp: new Date().toISOString(),
            });
        },
        clearMessages(state) {
            state.messages = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(queryAiAssistant.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(queryAiAssistant.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.messages.push(action.payload);
            })
            .addCase(queryAiAssistant.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'AI query failed';
            })
            .addCase(fetchSalesPrediction.fulfilled, (state, action) => {
                state.salesPrediction = action.payload;
            })
            .addCase(fetchHealthScore.fulfilled, (state, action) => {
                state.healthScore = action.payload;
            });
    },
});

export const { addUserMessage, clearMessages } = aiSlice.actions;
export default aiSlice.reducer;
