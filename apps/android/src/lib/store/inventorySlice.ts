import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

export interface StockMovement {
    id: string;
    productVariantId: string;
    warehouseId: string;
    type: string;
    quantity: number;
    createdAt: string;
}

export interface WarehouseSummary {
    id: string;
    name: string;
}

export interface InventoryState {
    movements: StockMovement[];
    warehouses: WarehouseSummary[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: InventoryState = {
    movements: [],
    warehouses: [],
    status: 'idle',
    error: null,
};

function toStockMovement(m: any): StockMovement {
    return {
        id: m.id,
        productVariantId: m.variantId ?? m.productId,
        warehouseId: m.warehouseId ?? '',
        type: m.eventType ?? m.type,
        quantity: m.quantity ?? 0,
        createdAt: m.occurredAt ?? m.createdAt,
    };
}

function toWarehouseSummary(w: any): WarehouseSummary {
    return { id: w.id, name: w.name };
}

export const fetchStockMovements = createAsyncThunk<
    StockMovement[],
    { warehouseId?: string } | void,
    { rejectValue: string }
>('inventory/fetchStockMovements', async (params, thunkAPI) => {
    try {
        const url = params?.warehouseId
            ? `${ApiEndpoints.StockMovements}?warehouseId=${params.warehouseId}`
            : ApiEndpoints.StockMovements;
        const response = await client.get(url);
        const items = response.data.data?.items ?? [];
        return items.map(toStockMovement);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as any)?.data?.error?.message || error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch stock movements');
    }
});

export const fetchWarehouses = createAsyncThunk<
    WarehouseSummary[],
    void,
    { rejectValue: string }
>('inventory/fetchWarehouses', async (_params, thunkAPI) => {
    try {
        const response = await client.get(ApiEndpoints.Warehouses);
        return (response.data.data ?? []).map(toWarehouseSummary);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as any)?.data?.error?.message || error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch warehouses');
    }
});

export const createStockAdjustment = createAsyncThunk<
    { id: string },
    { productVariantId: string; warehouseId: string; delta: number; reason: string },
    { rejectValue: string }
>('inventory/createStockAdjustment', async (payload, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.StockAdjustments, {
            productId: payload.productVariantId,
            variantId: null,
            warehouseId: payload.warehouseId,
            quantity: payload.delta,
            reason: payload.reason,
        });
        return {
            id:
                response.data.data?.movementEvent?.id ??
                response.data.data?.id ??
                '',
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as any)?.data?.error?.message || error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to create stock adjustment');
    }
});

export const createStockTransfer = createAsyncThunk<
    { id: string },
    {
        fromWarehouseId: string;
        toWarehouseId: string;
        lines: { productId: string; quantityRequested: number }[];
    },
    { rejectValue: string }
>('inventory/createStockTransfer', async (payload, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.StockTransfers, {
            fromWarehouseId: payload.fromWarehouseId,
            toWarehouseId: payload.toWarehouseId,
            lines: payload.lines,
        });
        return {
            id:
                response.data.data?.transfer?.id ?? response.data.data?.id ?? '',
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as any)?.data?.error?.message || error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to create stock transfer');
    }
});

export const submitTransfer = createAsyncThunk<string, string, { rejectValue: string }>(
    'inventory/submitTransfer',
    async (id, thunkAPI) => {
        try {
            await client.post(buildEndpoint(ApiEndpoints.StockTransferSubmit, { id }));
            return id;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as any)?.data?.error?.message || error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to submit stock transfer');
        }
    },
);

export const approveTransfer = createAsyncThunk<string, string, { rejectValue: string }>(
    'inventory/approveTransfer',
    async (id, thunkAPI) => {
        try {
            await client.post(buildEndpoint(ApiEndpoints.StockTransferApprove, { id }));
            return id;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as any)?.data?.error?.message || error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to approve stock transfer');
        }
    },
);

export const shipTransfer = createAsyncThunk<string, string, { rejectValue: string }>(
    'inventory/shipTransfer',
    async (id, thunkAPI) => {
        try {
            await client.post(buildEndpoint(ApiEndpoints.StockTransferShip, { id }), {
                lineShippedQuantities: [],
            });
            return id;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as any)?.data?.error?.message || error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to ship stock transfer');
        }
    },
);

export const receiveTransfer = createAsyncThunk<string, string, { rejectValue: string }>(
    'inventory/receiveTransfer',
    async (id, thunkAPI) => {
        try {
            await client.post(buildEndpoint(ApiEndpoints.StockTransferReceive, { id }), {
                lineReceivedQuantities: [],
            });
            return id;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as any)?.data?.error?.message || error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to receive stock transfer');
        }
    },
);

export const cancelTransfer = createAsyncThunk<string, string, { rejectValue: string }>(
    'inventory/cancelTransfer',
    async (id, thunkAPI) => {
        try {
            await client.post(buildEndpoint(ApiEndpoints.StockTransferCancel, { id }));
            return id;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as any)?.data?.error?.message || error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to cancel stock transfer');
        }
    },
);

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStockMovements.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchStockMovements.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.movements = action.payload;
            })
            .addCase(fetchStockMovements.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to load stock movements';
            })
            .addCase(fetchWarehouses.fulfilled, (state, action) => {
                state.warehouses = action.payload;
            })
            .addCase(createStockAdjustment.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(createStockTransfer.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(submitTransfer.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(approveTransfer.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(shipTransfer.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(receiveTransfer.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(cancelTransfer.fulfilled, (state) => {
                state.status = 'succeeded';
            });
    },
});

export default inventorySlice.reducer;
