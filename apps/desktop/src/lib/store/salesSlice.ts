import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TenderType =
    | 'cash'
    | 'card'
    | 'vodafone_cash'
    | 'orange_cash'
    | 'etisalat_cash'
    | 'we_pay'
    | 'instapay'
    | 'bank_transfer'
    | 'customer_credit'
    | 'store_credit';

export interface OrderLine {
    id: string;
    productVariantId: string;
    productId: string;
    batchId: string | null;
    quantity: number;
    unitPricePiasters: number;
    discountAmountPiasters: number;
    taxAmountPiasters: number;
    lineTotalPiasters: number;
}

export interface OrderPayment {
    id: string;
    tenderType: TenderType;
    amountPiasters: number;
    providerReference: string | null;
}

export interface OrderReturn {
    id: string;
    originalOrderId: string;
    reason: string;
    refundMethod: string;
    status: 'pending_approval' | 'approved' | 'rejected';
    refundAmountPiasters: number;
}

export interface Order {
    id: string;
    companyId: string;
    branchId: string;
    cashierId: string;
    customerId: string | null;
    clientTxnId: string;
    shiftSessionId: string | null;
    status: 'pending' | 'completed' | 'partially_returned' | 'fully_returned' | 'voided';
    subtotalPiasters: number;
    discountTotalPiasters: number;
    taxTotalPiasters: number;
    grandTotalPiasters: number;
    lines: OrderLine[];
    payments: OrderPayment[];
    returns: OrderReturn[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderInput {
    companyId?: string;
    branchId: string;
    cashierId?: string;
    warehouseId?: string;
    clientTxnId: string;
    customerId?: string | null;
    shiftSessionId?: string | null;
    lines: Array<{
        productVariantId: string;
        productId: string;
        batchId?: string | null;
        isBundle?: boolean;
        quantity: number;
        unitPricePiasters: number;
        discountAmountPiasters?: number;
        taxAmountPiasters?: number;
    }>;
    payments: Array<{ tenderType: TenderType; amountPiasters: number; providerReference?: string | null }>;
}

export interface ShiftSession {
    id: string;
    companyId: string;
    branchId: string;
    cashierId: string;
    openedAt: string;
    closedAt: string | null;
    openingCashPiasters: number;
    closingCashPiasters: number | null;
    status: 'open' | 'closed';
}

export interface SalesState {
    orders: Order[];
    currentOrder: Order | null;
    currentShift: ShiftSession | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: SalesState = {
    orders: [],
    currentOrder: null,
    currentShift: null,
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
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error
                        ?.message || error.message,
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
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error
                        ?.message || error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to fetch order');
        }
    },
);

export const processReturn = createAsyncThunk<
    Order,
    { orderId: string; lines: Array<{ orderLineId: string; productVariantId: string; productId: string; returnQuantity: number; refundAmountPiasters: number }>; reason: string; refundApprovalThresholdPiasters?: number },
    { rejectValue: string }
>('sales/processReturn', async ({ orderId, lines, reason, refundApprovalThresholdPiasters }, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.OrderReturn, { id: orderId });
        const response = await client.post(endpoint, {
            lines,
            reason,
            refundApprovalThresholdPiasters,
        });
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

export const voidOrder = createAsyncThunk<
    Order,
    { orderId: string; reason: string; currentShiftSessionId?: string | null },
    { rejectValue: string }
>('sales/voidOrder', async ({ orderId, reason, currentShiftSessionId }, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.OrderVoid, { id: orderId });
        const response = await client.post(endpoint, { reason, currentShiftSessionId });
        return response.data.data as Order;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                    error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to void order');
    }
});

export const openShift = createAsyncThunk<ShiftSession, { branchId: string; cashierId?: string; openingCashPiasters: number }, { rejectValue: string }>(
    'sales/openShift',
    async ({ branchId, cashierId, openingCashPiasters }, thunkAPI) => {
        try {
            const response = await client.post(ApiEndpoints.ShiftOpen, {
                branchId,
                cashierId,
                openingCashPiasters,
            });
            return response.data.data as ShiftSession;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                        error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to open shift');
        }
    },
);

export const fetchCurrentShift = createAsyncThunk<ShiftSession | null, { branchId?: string; cashierId?: string }, { rejectValue: string }>(
    'sales/fetchCurrentShift',
    async ({ branchId, cashierId }, thunkAPI) => {
        try {
            const params = new URLSearchParams();
            if (branchId) params.set('branchId', branchId);
            if (cashierId) params.set('cashierId', cashierId);
            const qs = params.toString();
            const response = await client.get(`${ApiEndpoints.ShiftCurrent}${qs ? `?${qs}` : ''}`);
            return (response.data.data as ShiftSession | null) ?? null;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                        error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to fetch current shift');
        }
    },
);

export const closeShift = createAsyncThunk<ShiftSession, { shiftSessionId: string; closingCashPiasters: number }, { rejectValue: string }>(
    'sales/closeShift',
    async ({ shiftSessionId, closingCashPiasters }, thunkAPI) => {
        try {
            const response = await client.post(ApiEndpoints.ShiftClose, {
                shiftSessionId,
                closingCashPiasters,
            });
            return response.data.data as ShiftSession;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return thunkAPI.rejectWithValue(
                    (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                        error.message,
                );
            }
            return thunkAPI.rejectWithValue('Failed to close shift');
        }
    },
);

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
        setCurrentShift(state, action: PayloadAction<ShiftSession | null>) {
            state.currentShift = action.payload;
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
            })
            .addCase(voidOrder.fulfilled, (state, action) => {
                const idx = state.orders.findIndex((o) => o.id === action.payload.id);
                if (idx !== -1) state.orders[idx] = action.payload;
            })
            .addCase(openShift.fulfilled, (state, action) => {
                state.currentShift = action.payload;
            })
            .addCase(fetchCurrentShift.fulfilled, (state, action) => {
                state.currentShift = action.payload;
            })
            .addCase(closeShift.fulfilled, (state, action) => {
                state.currentShift = action.payload;
            });
    },
});

export const { clearCurrentOrder, setCurrentOrder, setCurrentShift } = salesSlice.actions;
export default salesSlice.reducer;
