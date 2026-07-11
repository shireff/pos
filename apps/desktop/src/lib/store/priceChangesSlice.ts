import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { client } from '../api/client';
import { ApiEndpoints } from '../api/endpoints';

export interface PriceChange {
  id: string;
  companyId: string;
  productId: string;
  variantId: string | null;
  oldPricePiasters: number;
  newPricePiasters: number;
  requestedByUserId: string;
  approvedByUserId: string | null;
  status: string;
  notes: string | null;
  requestedAt: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceChangesState {
  items: PriceChange[];
  pendingApproval: PriceChange[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: PriceChangesState = {
  items: [],
  pendingApproval: [],
  status: 'idle',
  error: null,
};

export const fetchPriceChanges = createAsyncThunk<
  PriceChange[],
  { companyId?: string } | void,
  { rejectValue: string }
>('priceChanges/fetchPriceChanges', async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();
    query.set('companyId', params?.companyId ?? 'company-1');
    const response = await client.get(`${ApiEndpoints.PriceChanges}?${query.toString()}`);
    return (response.data.data ?? []) as PriceChange[];
  } catch {
    return thunkAPI.rejectWithValue('Failed to fetch price changes');
  }
});

export const requestPriceChange = createAsyncThunk<
  PriceChange,
  { productId: string; variantId?: string | null; oldPricePiasters: number; newPricePiasters: number; notes?: string | null; autoApproveThresholdPiasters?: number; companyId?: string },
  { rejectValue: string }
>('priceChanges/requestPriceChange', async (input, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.PriceChanges, {
      ...input,
      companyId: input.companyId ?? 'company-1',
    });
    return response.data.data as PriceChange;
  } catch {
    return thunkAPI.rejectWithValue('Failed to request price change');
  }
});

export const approvePriceChange = createAsyncThunk<
  PriceChange,
  { id: string; companyId?: string },
  { rejectValue: string }
>('priceChanges/approvePriceChange', async (input, thunkAPI) => {
  try {
    const endpoint = `${ApiEndpoints.PriceChangeApprove.replace(':id', input.id)}`;
    const response = await client.post(endpoint, {}, { params: { companyId: input.companyId ?? 'company-1' } });
    return response.data.data as PriceChange;
  } catch {
    return thunkAPI.rejectWithValue('Failed to approve price change');
  }
});

export const rejectPriceChange = createAsyncThunk<
  PriceChange,
  { id: string; companyId?: string },
  { rejectValue: string }
>('priceChanges/rejectPriceChange', async (input, thunkAPI) => {
  try {
    const endpoint = `${ApiEndpoints.PriceChangeReject.replace(':id', input.id)}`;
    const response = await client.post(endpoint, {}, { params: { companyId: input.companyId ?? 'company-1' } });
    return response.data.data as PriceChange;
  } catch {
    return thunkAPI.rejectWithValue('Failed to reject price change');
  }
});

const priceChangesSlice = createSlice({
  name: 'priceChanges',
  initialState,
  reducers: {
    clearPriceChangesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriceChanges.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchPriceChanges.fulfilled, (state, action: PayloadAction<PriceChange[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.pendingApproval = action.payload.filter((p) => p.status === 'pending_approval');
      })
      .addCase(fetchPriceChanges.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload ?? 'Failed'; })
      .addCase(requestPriceChange.fulfilled, (state, action: PayloadAction<PriceChange>) => {
        state.items.unshift(action.payload);
        if (action.payload.status === 'pending_approval') state.pendingApproval.unshift(action.payload);
      })
      .addCase(approvePriceChange.fulfilled, (state, action: PayloadAction<PriceChange>) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.pendingApproval = state.pendingApproval.filter((p) => p.id !== action.payload.id);
      })
      .addCase(rejectPriceChange.fulfilled, (state, action: PayloadAction<PriceChange>) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.pendingApproval = state.pendingApproval.filter((p) => p.id !== action.payload.id);
      });
  },
});

export const { clearPriceChangesError } = priceChangesSlice.actions;
export default priceChangesSlice.reducer;
