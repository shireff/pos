import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupplierContact {
  name: string;
  phone: string;
  email?: string | null;
  role?: string | null;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: { ar: string; en?: string };
  phone: string;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTermsDays: number;
  currency: string;
  isActive: boolean;
  contacts: SupplierContact[];
  balancePiasters: number;
  onTimeRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDetail extends Supplier {
  recentLedgerEntries: LedgerEntry[];
  recentPriceHistory: PriceHistoryEntry[];
}

export interface LedgerEntry {
  id: string;
  eventType: string;
  amountPiasters: number;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface PriceHistoryEntry {
  id: string;
  productId: string;
  variantId?: string | null;
  unitPricePiasters: number;
  effectiveDate: string;
  recordedAt: string;
  purchaseOrderId?: string | null;
  createdAt: string;
}

export interface SupplierPerformance {
  onTimeDeliveryRate: { onTimeCount: number; totalCount: number; rate: number };
  priceVariance: number;
  narrative: string;
}

export interface SuppliersState {
  suppliers: Supplier[];
  selectedSupplier: SupplierDetail | null;
  performance: SupplierPerformance | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SuppliersState = {
  suppliers: [],
  selectedSupplier: null,
  performance: null,
  status: 'idle',
  detailStatus: 'idle',
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchSuppliers = createAsyncThunk<
  Supplier[],
  { query?: string; isActive?: boolean; companyId?: string } | void,
  { rejectValue: string }
>('suppliers/fetchSuppliers', async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();
    query.set('companyId', params?.companyId ?? 'company-1');
    if (params?.query) query.set('query', params.query);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    const url = `${ApiEndpoints.Suppliers}?${query.toString()}`;
    const response = await client.get(url);
    return (response.data.data ?? []) as Supplier[];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch suppliers');
  }
});

export const fetchSupplierById = createAsyncThunk<
  SupplierDetail,
  { supplierId: string; companyId?: string },
  { rejectValue: string }
>('suppliers/fetchSupplierById', async ({ supplierId, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.SupplierById, { id: supplierId });
    const response = await client.get(endpoint, {
      params: { companyId: companyId ?? 'company-1' },
    });
    return response.data.data as SupplierDetail;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch supplier');
  }
});

export const createSupplier = createAsyncThunk<
  Supplier,
  { name: { ar: string; en?: string }; phone: string; companyId: string },
  { rejectValue: string }
>('suppliers/createSupplier', async (input, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.Suppliers, {
      ...input,
      companyId: input.companyId ?? 'company-1',
    });
    return response.data.data as Supplier;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to create supplier');
  }
});

export const updateSupplier = createAsyncThunk<
  Supplier,
  { supplierId: string; updates: Partial<Supplier>; companyId?: string },
  { rejectValue: string }
>('suppliers/updateSupplier', async ({ supplierId, updates, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.SupplierById, { id: supplierId });
    const response = await client.patch(endpoint, updates, {
      params: { companyId: companyId ?? 'company-1' },
    });
    return response.data.data as Supplier;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to update supplier');
  }
});

export const deactivateSupplier = createAsyncThunk<
  Supplier,
  { supplierId: string; companyId?: string },
  { rejectValue: string }
>('suppliers/deactivateSupplier', async ({ supplierId, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.SupplierById, { id: supplierId });
    const response = await client.delete(endpoint, {
      params: { companyId: companyId ?? 'company-1' },
    });
    return response.data.data as Supplier;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to deactivate supplier');
  }
});

export const recordSupplierPayment = createAsyncThunk<
  { ledgerEntry: LedgerEntry },
  { supplierId: string; amountPiasters: number; paymentMethod: string; companyId?: string },
  { rejectValue: string }
>('suppliers/recordPayment', async ({ supplierId, amountPiasters, paymentMethod, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.SupplierPayments, { id: supplierId });
    const response = await client.post(endpoint, {
      amountPiasters,
      paymentMethod,
      companyId: companyId ?? 'company-1',
    });
    return response.data.data as { ledgerEntry: LedgerEntry };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to record payment');
  }
});

export const applySupplierCreditNote = createAsyncThunk<
  { ledgerEntry: LedgerEntry },
  { supplierId: string; amountPiasters: number; reason: string; companyId?: string },
  { rejectValue: string }
>('suppliers/applyCreditNote', async ({ supplierId, amountPiasters, reason, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.SupplierCreditNotes, { id: supplierId });
    const response = await client.post(endpoint, {
      amountPiasters,
      reason,
      companyId: companyId ?? 'company-1',
    });
    return response.data.data as { ledgerEntry: LedgerEntry };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to apply credit note');
  }
});

export const fetchSupplierPerformance = createAsyncThunk<
  SupplierPerformance,
  { supplierId: string; companyId?: string },
  { rejectValue: string }
>('suppliers/fetchPerformance', async ({ supplierId, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.SupplierPerformance, { id: supplierId });
    const response = await client.get(endpoint, {
      params: { companyId: companyId ?? 'company-1' },
    });
    return response.data.data as SupplierPerformance;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch supplier performance');
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    selectSupplier(state, action: PayloadAction<Supplier | null>) {
      state.selectedSupplier = action.payload as any;
    },
    clearSupplierDetail(state) {
      state.selectedSupplier = null;
      state.detailStatus = 'idle';
      state.performance = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch suppliers';
      })
      .addCase(fetchSupplierById.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.selectedSupplier = action.payload as any;
      })
      .addCase(fetchSupplierById.rejected, (state) => {
        state.detailStatus = 'failed';
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.suppliers.unshift(action.payload as any);
        state.selectedSupplier = action.payload as any;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const idx = state.suppliers.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.suppliers[idx] = action.payload as any;
        if (state.selectedSupplier?.id === action.payload.id) {
          state.selectedSupplier = { ...state.selectedSupplier, ...action.payload } as any;
        }
      })
      .addCase(deactivateSupplier.fulfilled, (state, action) => {
        const idx = state.suppliers.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.suppliers[idx] = action.payload as any;
        if (state.selectedSupplier?.id === action.payload.id) {
          state.selectedSupplier = { ...state.selectedSupplier, ...action.payload } as any;
        }
      })
      .addCase(recordSupplierPayment.fulfilled, (state, action) => {
        if (state.selectedSupplier) {
          state.selectedSupplier = {
            ...state.selectedSupplier,
            balancePiasters: state.selectedSupplier.balancePiasters + action.payload.ledgerEntry.amountPiasters,
            recentLedgerEntries: [action.payload.ledgerEntry, ...state.selectedSupplier.recentLedgerEntries],
          } as any;
        }
      })
      .addCase(applySupplierCreditNote.fulfilled, (state, action) => {
        if (state.selectedSupplier) {
          state.selectedSupplier = {
            ...state.selectedSupplier,
            balancePiasters: state.selectedSupplier.balancePiasters + action.payload.ledgerEntry.amountPiasters,
            recentLedgerEntries: [action.payload.ledgerEntry, ...state.selectedSupplier.recentLedgerEntries],
          } as any;
        }
      })
      .addCase(fetchSupplierPerformance.fulfilled, (state, action) => {
        state.performance = action.payload;
      });
  },
});

export const { selectSupplier, clearSupplierDetail } = suppliersSlice.actions;
export default suppliersSlice.reducer;
