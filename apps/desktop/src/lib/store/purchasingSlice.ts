import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PurchaseOrderLine {
    productVariantId: string;
    quantity: number;
    unitCost: number;
}

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    lines: PurchaseOrderLine[];
    status: 'draft' | 'pending_approval' | 'approved' | 'received' | 'cancelled';
    totalCost: number;
    createdAt: string;
}

export interface OcrInvoiceResult {
    lines: PurchaseOrderLine[];
    supplierId: string | null;
    invoiceNumber: string | null;
}

export interface PurchasingState {
    purchaseOrders: PurchaseOrder[];
    currentPurchaseOrder: PurchaseOrder | null;
    ocrResult: OcrInvoiceResult | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: PurchasingState = {
    purchaseOrders: [],
    currentPurchaseOrder: null,
    ocrResult: null,
    status: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const createPurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    { supplierId: string; lines: PurchaseOrderLine[] },
    { rejectValue: string }
>('purchasing/createOrder', async (input, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.PurchaseOrders, input);
        return response.data.data as PurchaseOrder;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to create purchase order');
    }
});

export const approvePurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    string,
    { rejectValue: string }
>('purchasing/approveOrder', async (id, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderApprove, { id });
        const response = await client.post(endpoint);
        return response.data.data as PurchaseOrder;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to approve purchase order');
    }
});

export const receivePurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    string,
    { rejectValue: string }
>('purchasing/receiveOrder', async (id, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderReceive, { id });
        const response = await client.post(endpoint);
        return response.data.data as PurchaseOrder;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to receive purchase order');
    }
});

export const importInvoiceOcr = createAsyncThunk<
    OcrInvoiceResult,
    FormData,
    { rejectValue: string }
>('purchasing/importInvoiceOcr', async (formData, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.SupplierInvoiceOcr, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data as OcrInvoiceResult;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to import invoice via OCR');
    }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const purchasingSlice = createSlice({
    name: 'purchasing',
    initialState,
    reducers: {
        clearOcrResult(state) {
            state.ocrResult = null;
        },
        setCurrentPurchaseOrder(state, action: PayloadAction<PurchaseOrder>) {
            state.currentPurchaseOrder = action.payload;
        },
    },
    extraReducers: (builder) => {
        const orderFulfilled = (state: PurchasingState, action: { payload: PurchaseOrder }) => {
            state.status = 'succeeded';
            state.currentPurchaseOrder = action.payload;
            const idx = state.purchaseOrders.findIndex((o) => o.id === action.payload.id);
            if (idx !== -1) {
                state.purchaseOrders[idx] = action.payload;
            } else {
                state.purchaseOrders.unshift(action.payload);
            }
        };

        builder
            .addCase(createPurchaseOrder.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createPurchaseOrder.fulfilled, orderFulfilled)
            .addCase(createPurchaseOrder.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to create purchase order';
            })
            .addCase(approvePurchaseOrder.fulfilled, orderFulfilled)
            .addCase(receivePurchaseOrder.fulfilled, orderFulfilled)
            .addCase(importInvoiceOcr.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(importInvoiceOcr.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.ocrResult = action.payload;
            })
            .addCase(importInvoiceOcr.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to import invoice';
            });
    },
});

export const { clearOcrResult, setCurrentPurchaseOrder } = purchasingSlice.actions;
export default purchasingSlice.reducer;
