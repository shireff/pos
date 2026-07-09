import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderLine {
    productVariantId: string;
    quantity: number;
    unitPrice: number;
}

export interface OrderPayment {
    tenderType: 'cash' | 'card' | 'wallet';
    amount: number;
}

export interface Order {
    id: string;
    branchId: string;
    status: 'pending' | 'completed' | 'voided' | 'returned';
    lines: OrderLine[];
    payments: OrderPayment[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    customerId: string | null;
    clientTxnId: string;
    createdAt: string;
}

export interface CreateOrderInput {
    branchId: string;
    lines: OrderLine[];
    payments: OrderPayment[];
    customerId?: string | null;
    clientTxnId: string;
}

export interface SalesState {
    orders: Order[];
    currentOrder: Order | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: SalesState = {
    orders: [],
    currentOrder: null,
    status: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const createOrder = createAsyncThunk<Order, CreateOrderInput, { rejectValue: string }>(
    'sales/createOrder',
    async (input, thunkAPI) => {
        try {
            const response = await client.post(ApiEndpoints.Orders, input);
            return response.data.data as Order;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                    error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to create order');
        }
    },
);

export const fetchOrderById = createAsyncThunk<Order, string, { rejectValue: string }>(
    'sales/fetchOrderById',
    async (id, thunkAPI) => {
        try {
            const endpoint = buildEndpoint(ApiEndpoints.OrderById, { id });
            const response = await client.get(endpoint);
            return response.data.data as Order;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                    error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to fetch order');
        }
    },
);

export const processReturn = createAsyncThunk<
    Order,
    { orderId: string; lines: OrderLine[]; reason: string },
    { rejectValue: string }
>('sales/processReturn', async ({ orderId, lines, reason }, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.OrderReturn, { id: orderId });
        const response = await client.post(endpoint, { lines, reason });
        return response.data.data as Order;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to process return');
    }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const salesSlice = createSlice({
    name: 'sales',
    initialState,
    reducers: {
        clearCurrentOrder(state) {
            state.currentOrder = null;
        },
        setCurrentOrder(state, action: PayloadAction<Order>) {
            state.currentOrder = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createOrder.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentOrder = action.payload;
                state.orders.unshift(action.payload);
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to create order';
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.currentOrder = action.payload;
                const idx = state.orders.findIndex((o) => o.id === action.payload.id);
                if (idx !== -1) state.orders[idx] = action.payload;
            })
            .addCase(processReturn.fulfilled, (state, action) => {
                const idx = state.orders.findIndex((o) => o.id === action.payload.id);
                if (idx !== -1) state.orders[idx] = action.payload;
            });
    },
});

export const { clearCurrentOrder, setCurrentOrder } = salesSlice.actions;
export default salesSlice.reducer;
