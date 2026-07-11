import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { client } from '../api/client';
import { ApiEndpoints } from '../api/endpoints';

export interface TaxRule {
  id: string;
  companyId: string;
  name: string;
  rateBasisPoints: number;
  appliesTo: string;
  scopeIds: string[];
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRulesState {
  rules: TaxRule[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TaxRulesState = {
  rules: [],
  status: 'idle',
  error: null,
};

export const fetchTaxRules = createAsyncThunk<
  TaxRule[],
  { companyId?: string } | void,
  { rejectValue: string }
>('taxRules/fetchTaxRules', async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();
    query.set('companyId', params?.companyId ?? 'company-1');
    const response = await client.get(`${ApiEndpoints.TaxRules}?${query.toString()}`);
    return (response.data.data ?? []) as TaxRule[];
  } catch {
    return thunkAPI.rejectWithValue('Failed to fetch tax rules');
  }
});

export const createTaxRule = createAsyncThunk<
  TaxRule,
  { name: string; rateBasisPoints: number; appliesTo: string; scopeIds: string[]; priority?: number; companyId?: string },
  { rejectValue: string }
>('taxRules/createTaxRule', async (input, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.TaxRules, {
      ...input,
      companyId: input.companyId ?? 'company-1',
    });
    return response.data.data as TaxRule;
  } catch {
    return thunkAPI.rejectWithValue('Failed to create tax rule');
  }
});

const taxRulesSlice = createSlice({
  name: 'taxRules',
  initialState,
  reducers: {
    clearTaxRulesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxRules.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchTaxRules.fulfilled, (state, action: PayloadAction<TaxRule[]>) => { state.status = 'succeeded'; state.rules = action.payload; })
      .addCase(fetchTaxRules.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload ?? 'Failed'; })
      .addCase(createTaxRule.fulfilled, (state, action: PayloadAction<TaxRule>) => { state.rules.unshift(action.payload); });
  },
});

export const { clearTaxRulesError } = taxRulesSlice.actions;
export default taxRulesSlice.reducer;
