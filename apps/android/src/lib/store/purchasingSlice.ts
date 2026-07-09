import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PurchaseOrderStatus =
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'partially_received'
    | 'fully_received'
    | 'cancelled';

export interface PurchaseOrderLine {
    id: string;
    productId: string;
    variantId: string | null;
    unitId: string;
    orderedQuantity: number;
    unitPricePiasters: number;
    receivedQuantity: number;
}

export interface PurchaseOrder {
    id: string;
    referenceNumber: string;
    status: PurchaseOrderStatus;
    supplierId: string;
    branchId: string;
    companyId: string;
    expectedDeliveryDate: string;
    totalAmountPiasters: number;
    notes: string | null;
    requestedByUserId: string;
    approvedByUserId: string | null;
    rejectedReason: string | null;
    cancelledReason: string | null;
    createdAt: string;
    updatedAt: string;
    lines: PurchaseOrderLine[];
}

export interface OcrLineItem {
    productName: string;
    quantity: number;
    unitPricePiasters: number;
}

export interface OcrInvoiceResult {
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    lineItems: OcrLineItem[];
    totalAmountPiasters: number;
    confidence: number;
}

export interface PurchaseOrderFilter {
    status?: PurchaseOrderStatus;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface PurchasingState {
    purchaseOrders: PurchaseOrder[];
    currentPurchaseOrder: PurchaseOrder | null;
    ocrResult: OcrInvoiceResult | null;
    filter: PurchaseOrderFilter;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: PurchasingState = {
    purchaseOrders: [],
    currentPurchaseOrder: null,
    ocrResult: null,
    filter: {},
    status: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchPurchaseOrders = createAsyncThunk<
    PurchaseOrder[],
    PurchaseOrderFilter | undefined,
    { rejectValue: string }
>('purchasing/fetchOrders', async (filter, thunkAPI) => {
    try {
        const params = new URLSearchParams();
        if (filter?.status) params.set('status', filter.status);
        if (filter?.supplierId) params.set('supplierId', filter.supplierId);
        if (filter?.dateFrom) params.set('dateFrom', filter.dateFrom);
        if (filter?.dateTo) params.set('dateTo', filter.dateTo);
        const qs = params.toString();
        const response = await client.get(`${ApiEndpoints.PurchaseOrders}${qs ? `?${qs}` : ''}`);
        return response.data.data as PurchaseOrder[];
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to fetch purchase orders'));
    }
});

export const fetchPurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    string,
    { rejectValue: string }
>('purchasing/fetchOrder', async (id, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderById, { id });
        const response = await client.get(endpoint);
        return response.data.data as PurchaseOrder;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to fetch purchase order'));
    }
});

export const createPurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    {
        companyId: string;
        branchId: string;
        supplierId: string;
        expectedDeliveryDate: string;
        notes?: string | null;
        lines: Array<{
            productId: string;
            variantId?: string | null;
            unitId: string;
            orderedQuantity: number;
            unitPricePiasters: number;
        }>;
        autoApproveThresholdPiasters?: number;
    },
    { rejectValue: string }
>('purchasing/createOrder', async (input, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.PurchaseOrders, input);
        return response.data.data as PurchaseOrder;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to create purchase order'));
    }
});

export const submitPurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    { id: string; autoApproveThresholdPiasters?: number },
    { rejectValue: string }
>('purchasing/submitOrder', async (input, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderSubmit, { id: input.id });
        const response = await client.post(endpoint, {
            autoApproveThresholdPiasters: input.autoApproveThresholdPiasters,
        });
        return response.data.data.purchaseOrder as PurchaseOrder;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to submit purchase order'));
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
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to approve purchase order'));
    }
});

export const rejectPurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    { id: string; reason: string },
    { rejectValue: string }
>('purchasing/rejectOrder', async (input, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderReject, { id: input.id });
        const response = await client.post(endpoint, { reason: input.reason });
        return response.data.data as PurchaseOrder;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to reject purchase order'));
    }
});

export const cancelPurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    { id: string; reason: string },
    { rejectValue: string }
>('purchasing/cancelOrder', async (input, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderCancel, { id: input.id });
        const response = await client.post(endpoint, { reason: input.reason });
        return response.data.data as PurchaseOrder;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to cancel purchase order'));
    }
});

export const receivePurchaseOrder = createAsyncThunk<
    PurchaseOrder,
    {
        id: string;
        receivedByUserId?: string;
        notes?: string | null;
        lines: Array<{
            lineId: string;
            warehouseId: string;
            receivedQuantity: number;
            discrepancyType?: string | null;
            discrepancyNotes?: string | null;
        }>;
    },
    { rejectValue: string }
>('purchasing/receiveOrder', async (input, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderReceive, { id: input.id });
        const response = await client.post(endpoint, {
            receivedByUserId: input.receivedByUserId,
            notes: input.notes,
            lines: input.lines,
        });
        return response.data.data.purchaseOrder as PurchaseOrder;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to receive goods'));
    }
});

export const recordSupplierInvoice = createAsyncThunk<
    { id: string; purchaseOrderId: string; invoiceNumber: string; status: string },
    {
        id: string;
        supplierId: string;
        invoiceNumber: string;
        invoiceDate: string;
        totalAmountPiasters: number;
        taxAmountPiasters: number;
        attachmentUrl?: string | null;
    },
    { rejectValue: string }
>('purchasing/recordInvoice', async (input, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderInvoice, { id: input.id });
        const response = await client.post(endpoint, {
            supplierId: input.supplierId,
            invoiceNumber: input.invoiceNumber,
            invoiceDate: input.invoiceDate,
            totalAmountPiasters: input.totalAmountPiasters,
            taxAmountPiasters: input.taxAmountPiasters,
            attachmentUrl: input.attachmentUrl ?? null,
        });
        return response.data.data as { id: string; purchaseOrderId: string; invoiceNumber: string; status: string };
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to record supplier invoice'));
    }
});

export const uploadInvoiceOcr = createAsyncThunk<
    OcrInvoiceResult,
    { id: string; fileReference: string },
    { rejectValue: string }
>('purchasing/uploadOcr', async (input, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.PurchaseOrderOcr, { id: input.id });
        const response = await client.post(endpoint, { fileReference: input.fileReference });
        return response.data.data.extracted as OcrInvoiceResult;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractMessage(error, 'Failed to extract invoice via OCR'));
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
        setCurrentPurchaseOrder(state, action: PayloadAction<PurchaseOrder | null>) {
            state.currentPurchaseOrder = action.payload;
        },
        setFilter(state, action: PayloadAction<PurchaseOrderFilter>) {
            state.filter = action.payload;
        },
    },
    extraReducers: (builder) => {
        const upsert = (state: PurchasingState, po: PurchaseOrder) => {
            state.status = 'succeeded';
            state.currentPurchaseOrder = po;
            state.error = null;
            const idx = state.purchaseOrders.findIndex((o) => o.id === po.id);
            if (idx !== -1) state.purchaseOrders[idx] = po;
            else state.purchaseOrders.unshift(po);
        };

        builder
            .addCase(fetchPurchaseOrders.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.purchaseOrders = action.payload;
                state.error = null;
            })
            .addCase(fetchPurchaseOrders.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to fetch purchase orders';
            })
            .addCase(fetchPurchaseOrder.fulfilled, (state, action) => {
                upsert(state, action.payload);
            })
            .addCase(createPurchaseOrder.fulfilled, (state, action) => {
                upsert(state, action.payload);
            })
            .addCase(submitPurchaseOrder.fulfilled, (state, action) => {
                upsert(state, action.payload);
            })
            .addCase(approvePurchaseOrder.fulfilled, (state, action) => {
                upsert(state, action.payload);
            })
            .addCase(rejectPurchaseOrder.fulfilled, (state, action) => {
                upsert(state, action.payload);
            })
            .addCase(cancelPurchaseOrder.fulfilled, (state, action) => {
                upsert(state, action.payload);
            })
            .addCase(receivePurchaseOrder.fulfilled, (state, action) => {
                upsert(state, action.payload);
            })
            .addCase(uploadInvoiceOcr.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.ocrResult = action.payload;
            })
            .addCase(uploadInvoiceOcr.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to extract invoice';
            });
    },
});

function extractMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        return (
            (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
            error.message
        );
    }
    return fallback;
}

export const { clearOcrResult, setCurrentPurchaseOrder, setFilter } = purchasingSlice.actions;
export default purchasingSlice.reducer;
