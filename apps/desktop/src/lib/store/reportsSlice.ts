import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailySalesReport {
    date: string;
    branchId: string;
    totalOrders: number;
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
}

export interface ProfitLossReport {
    from: string;
    to: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
}

export interface ReportsState {
    dailySales: DailySalesReport | null;
    profitLoss: ProfitLossReport | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: ReportsState = {
    dailySales: null,
    profitLoss: null,
    status: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchDailySales = createAsyncThunk<
    DailySalesReport,
    { branchId: string; date: string },
    { rejectValue: string }
>('reports/fetchDailySales', async ({ branchId, date }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsDailySales}?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`,
        );
        return response.data.data as DailySalesReport;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch daily sales report');
    }
});

export const fetchProfitLoss = createAsyncThunk<
    ProfitLossReport,
    { from: string; to: string },
    { rejectValue: string }
>('reports/fetchProfitLoss', async ({ from, to }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsProfitLoss}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        return response.data.data as ProfitLossReport;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch profit/loss report');
    }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDailySales.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDailySales.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.dailySales = action.payload;
            })
            .addCase(fetchDailySales.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to fetch report';
            })
            .addCase(fetchProfitLoss.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchProfitLoss.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.profitLoss = action.payload;
            })
            .addCase(fetchProfitLoss.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to fetch report';
            });
    },
});

export default reportsSlice.reducer;
