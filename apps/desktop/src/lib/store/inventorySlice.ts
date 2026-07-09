import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockMovement {
    id: string;
    productVariantId: string;
    warehouseId: string;
    type: 'in' | 'out' | 'adjustment' | 'transfer_in' | 'transfer_out';
    quantity: number;
    note: string;
    createdAt: string;
}

export interface StockAdjustment {
    productVariantId: string;
    warehouseId: string;
    delta: number;
    reason: string;
}

export interface StockTransfer {
    id: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    lines: { id: string; productId: string; variantId?: string | null; batchId?: string | null; quantityRequested: number; quantityShipped: number; quantityReceived: number }[];
    status: 'draft' | 'pending_approval' | 'approved' | 'shipped' | 'received' | 'cancelled';
    createdAt: string;
    updatedAt: string;
}

export interface CreateTransferInput {
    fromWarehouseId: string;
    toWarehouseId: string;
    lines: { productId: string; variantId?: string | null; batchId?: string | null; quantityRequested: number }[];
    notes?: string;
}

export interface Warehouse {
    id: string;
    companyId: string;
    name: string;
    address?: string | null;
    isDefault: boolean;
    isActive: boolean;
    managerId?: string | null;
    isDeleted: boolean;
}

export interface StockMovementsParams {
    productVariantId?: string;
    warehouseId?: string;
}

export interface InventoryState {
    movements: StockMovement[];
    transfers: StockTransfer[];
    currentTransfer: StockTransfer | null;
    warehouses: Warehouse[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: InventoryState = {
    movements: [],
    transfers: [],
    currentTransfer: null,
    warehouses: [],
    status: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const createStockAdjustment = createAsyncThunk<
    void,
    StockAdjustment,
    { rejectValue: string }
>('inventory/createAdjustment', async (input, thunkAPI) => {
    try {
        await client.post(ApiEndpoints.StockAdjustments, input);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to create stock adjustment');
    }
});

export const createStockTransfer = createAsyncThunk<
    StockTransfer,
    CreateTransferInput,
    { rejectValue: string }
>('inventory/createTransfer', async (input, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.StockTransfers, input);
        return response.data.data as StockTransfer;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to create stock transfer');
    }
});

export const approveTransfer = createAsyncThunk<StockTransfer, string, { rejectValue: string }>(
    'inventory/approveTransfer',
    async (id, thunkAPI) => {
        try {
            const endpoint = buildEndpoint(ApiEndpoints.StockTransferApprove, { id });
            const response = await client.post(endpoint);
            return response.data.data as StockTransfer;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                    error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to approve transfer');
        }
    },
);

export const shipTransfer = createAsyncThunk<StockTransfer, string, { rejectValue: string }>(
    'inventory/shipTransfer',
    async (id, thunkAPI) => {
        try {
            const endpoint = buildEndpoint(ApiEndpoints.StockTransferShip, { id });
            const response = await client.post(endpoint);
            return response.data.data as StockTransfer;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                    error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to ship transfer');
        }
    },
);

export const receiveTransfer = createAsyncThunk<StockTransfer, string, { rejectValue: string }>(
    'inventory/receiveTransfer',
    async (id, thunkAPI) => {
        try {
            const endpoint = buildEndpoint(ApiEndpoints.StockTransferReceive, { id });
            const response = await client.post(endpoint);
            return response.data.data as StockTransfer;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                    error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to receive transfer');
        }
    },
);

export const fetchStockMovements = createAsyncThunk<
    StockMovement[],
    StockMovementsParams,
    { rejectValue: string }
>('inventory/fetchMovements', async (params, thunkAPI) => {
    try {
        const query = new URLSearchParams();
        if (params.productVariantId) query.set('productVariantId', params.productVariantId);
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        const url = `${ApiEndpoints.StockMovements}${query.toString() ? `?${query.toString()}` : ''}`;
        const response = await client.get(url);
        return (response.data.data ?? []) as StockMovement[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch stock movements');
    }
});

export const submitTransfer = createAsyncThunk<
    StockTransfer,
    string,
    { rejectValue: string }
>('inventory/submitTransfer', async (id, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.StockTransferSubmit, { id });
        const response = await client.post(endpoint);
        return response.data.data as StockTransfer;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to submit transfer');
    }
});

export const cancelTransfer = createAsyncThunk<
    StockTransfer,
    string,
    { rejectValue: string }
>('inventory/cancelTransfer', async (id, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.StockTransferCancel, { id });
        const response = await client.post(endpoint);
        return response.data.data as StockTransfer;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to cancel transfer');
    }
});

export const fetchWarehouses = createAsyncThunk<
    Warehouse[],
    void,
    { rejectValue: string }
>('inventory/fetchWarehouses', async (_, thunkAPI) => {
    try {
        const response = await client.get(ApiEndpoints.Warehouses);
        return (response.data.data ?? []) as Warehouse[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch warehouses');
    }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        clearCurrentTransfer(state) {
            state.currentTransfer = null;
        },
        setCurrentTransfer(state, action: PayloadAction<StockTransfer>) {
            state.currentTransfer = action.payload;
        },
    },
    extraReducers: (builder) => {
        const transferFulfilled = (
            state: InventoryState,
            action: { payload: StockTransfer },
        ) => {
            const idx = state.transfers.findIndex((t) => t.id === action.payload.id);
            if (idx !== -1) {
                state.transfers[idx] = action.payload;
            } else {
                state.transfers.unshift(action.payload);
            }
            state.currentTransfer = action.payload;
            state.status = 'succeeded';
        };

        builder
            .addCase(createStockAdjustment.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createStockAdjustment.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(createStockAdjustment.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to create adjustment';
            })
            .addCase(createStockTransfer.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createStockTransfer.fulfilled, transferFulfilled)
            .addCase(createStockTransfer.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to create transfer';
            })
            .addCase(approveTransfer.fulfilled, transferFulfilled)
            .addCase(shipTransfer.fulfilled, transferFulfilled)
            .addCase(receiveTransfer.fulfilled, transferFulfilled)
            .addCase(fetchStockMovements.fulfilled, (state, action) => {
                state.movements = action.payload;
            })
            .addCase(submitTransfer.fulfilled, transferFulfilled)
            .addCase(cancelTransfer.fulfilled, transferFulfilled)
            .addCase(fetchWarehouses.fulfilled, (state, action) => {
                state.warehouses = action.payload;
            });
    },
});

export const { clearCurrentTransfer, setCurrentTransfer } = inventorySlice.actions;
export default inventorySlice.reducer;
