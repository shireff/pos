import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints } from '../api/endpoints';

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

export interface ReportState {
    dailySales: DailySalesReport | null;
    profitLoss: ProfitLossReport | null;
    inventoryValuation: Record<string, unknown> | null;
    stockMovements: Record<string, unknown> | null;
    branchComparison: Record<string, unknown> | null;
    employeePerformance: Record<string, unknown> | null;
    customerLoyalty: Record<string, unknown> | null;
    tax: Record<string, unknown> | null;
    supplierPerformance: Record<string, unknown> | null;
    storeHealth: Record<string, unknown> | null;
    cashFlow: Record<string, unknown> | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: ReportState = {
    dailySales: null,
    profitLoss: null,
    inventoryValuation: null,
    stockMovements: null,
    branchComparison: null,
    employeePerformance: null,
    customerLoyalty: null,
    tax: null,
    supplierPerformance: null,
    storeHealth: null,
    cashFlow: null,
    status: 'idle',
    error: null,
};

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

export const fetchInventoryValuation = createAsyncThunk<
    Record<string, unknown>,
    { warehouseId?: string; date: string },
    { rejectValue: string }
>('reports/fetchInventoryValuation', async ({ warehouseId, date }, thunkAPI) => {
    try {
        const params = new URLSearchParams({ date });
        if (warehouseId) params.set('warehouseId', warehouseId);
        const response = await client.get(`${ApiEndpoints.ReportsInventoryValuation}?${params.toString()}`);
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch inventory valuation');
    }
});

export const fetchStockMovements = createAsyncThunk<
    Record<string, unknown>,
    { warehouseId: string; from: string; to: string },
    { rejectValue: string }
>('reports/fetchStockMovements', async ({ warehouseId, from, to }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsStockMovements}?warehouseId=${encodeURIComponent(warehouseId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch stock movements');
    }
});

export const fetchBranchComparison = createAsyncThunk<
    Record<string, unknown>,
    { from: string; to: string },
    { rejectValue: string }
>('reports/fetchBranchComparison', async ({ from, to }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsBranchComparison}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch branch comparison');
    }
});

export const fetchEmployeePerformance = createAsyncThunk<
    Record<string, unknown>,
    { branchId: string; from: string; to: string },
    { rejectValue: string }
>('reports/fetchEmployeePerformance', async ({ branchId, from, to }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsEmployeePerformance}?branchId=${encodeURIComponent(branchId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch employee performance');
    }
});

export const fetchCustomerLoyalty = createAsyncThunk<
    Record<string, unknown>,
    { from: string; to: string },
    { rejectValue: string }
>('reports/fetchCustomerLoyalty', async ({ from, to }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsCustomerLoyalty}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch customer loyalty');
    }
});

export const fetchTaxReport = createAsyncThunk<
    Record<string, unknown>,
    { year: number; month: number },
    { rejectValue: string }
>('reports/fetchTaxReport', async ({ year, month }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsTax}?year=${year}&month=${month}`,
        );
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch tax report');
    }
});

export const fetchSupplierPerformance = createAsyncThunk<
    Record<string, unknown>,
    { supplierId?: string; from: string; to: string },
    { rejectValue: string }
>('reports/fetchSupplierPerformance', async ({ supplierId, from, to }, thunkAPI) => {
    try {
        const params = new URLSearchParams({ from, to });
        if (supplierId) params.set('supplierId', supplierId);
        const response = await client.get(`${ApiEndpoints.ReportsSupplierPerformance}?${params.toString()}`);
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch supplier performance');
    }
});

export const fetchStoreHealth = createAsyncThunk<
    Record<string, unknown>,
    { companyId: string },
    { rejectValue: string }
>('reports/fetchStoreHealth', async ({ companyId }, thunkAPI) => {
    try {
        const response = await client.get(`${ApiEndpoints.ReportsStoreHealth}?companyId=${encodeURIComponent(companyId)}`);
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch store health');
    }
});

export const fetchCashFlow = createAsyncThunk<
    Record<string, unknown>,
    { from: string; to: string },
    { rejectValue: string }
>('reports/fetchCashFlow', async ({ from, to }, thunkAPI) => {
    try {
        const response = await client.get(
            `${ApiEndpoints.ReportsCashFlow}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        return response.data.data as Record<string, unknown>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Failed to fetch cash flow');
    }
});

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
            })
            .addCase(fetchInventoryValuation.fulfilled, (state, action) => {
                state.inventoryValuation = action.payload;
            })
            .addCase(fetchStockMovements.fulfilled, (state, action) => {
                state.stockMovements = action.payload;
            })
            .addCase(fetchBranchComparison.fulfilled, (state, action) => {
                state.branchComparison = action.payload;
            })
            .addCase(fetchEmployeePerformance.fulfilled, (state, action) => {
                state.employeePerformance = action.payload;
            })
            .addCase(fetchCustomerLoyalty.fulfilled, (state, action) => {
                state.customerLoyalty = action.payload;
            })
            .addCase(fetchTaxReport.fulfilled, (state, action) => {
                state.tax = action.payload;
            })
            .addCase(fetchSupplierPerformance.fulfilled, (state, action) => {
                state.supplierPerformance = action.payload;
            })
            .addCase(fetchStoreHealth.fulfilled, (state, action) => {
                state.storeHealth = action.payload;
            })
            .addCase(fetchCashFlow.fulfilled, (state, action) => {
                state.cashFlow = action.payload;
            });
    },
});

export default reportsSlice.reducer;
