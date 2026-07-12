import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { client } from '../api/client';
import { ApiEndpoints } from '../api/endpoints';

export interface DiscountRule {
  id: string;
  companyId: string;
  name: string;
  type: string;
  ruleJson: Record<string, unknown>;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  priority: number;
  isExclusive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  companyId: string;
  code: string;
  discountType: string;
  amount: number;
  isMultiUse: boolean;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  scopeType: string;
  scopeIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PromotionsState {
  discounts: DiscountRule[];
  coupons: Coupon[];
  discountStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  couponStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: PromotionsState = {
  discounts: [],
  coupons: [],
  discountStatus: 'idle',
  couponStatus: 'idle',
  error: null,
};

export const fetchDiscountRules = createAsyncThunk<
  DiscountRule[],
  { type?: string; isActive?: boolean; companyId?: string } | void,
  { rejectValue: string }
>('promotions/fetchDiscountRules', async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();
    query.set('companyId', params?.companyId ?? 'company-1');
    if (params?.type) query.set('type', params.type);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    const response = await client.get(`${ApiEndpoints.DiscountRules}?${query.toString()}`);
    return (response.data.data ?? []) as DiscountRule[];
  } catch {
    return thunkAPI.rejectWithValue('Failed to fetch discount rules');
  }
});

export const createDiscountRule = createAsyncThunk<
  DiscountRule,
  { name: string; type: string; ruleJson: Record<string, unknown>; validFrom?: string; validUntil?: string; priority?: number; isExclusive?: boolean; companyId?: string },
  { rejectValue: string }
>('promotions/createDiscountRule', async (input, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.DiscountRules, {
      ...input,
      companyId: input.companyId ?? 'company-1',
    });
    return response.data.data as DiscountRule;
  } catch {
    return thunkAPI.rejectWithValue('Failed to create discount rule');
  }
});

export const updateDiscountRule = createAsyncThunk<
  DiscountRule,
  { id: string; name?: string; ruleJson?: Record<string, unknown>; priority?: number; isExclusive?: boolean; companyId?: string },
  { rejectValue: string }
>('promotions/updateDiscountRule', async (input, thunkAPI) => {
  try {
    const endpoint = `${ApiEndpoints.DiscountRuleById.replace(':id', input.id)}`;
    const { ...body } = input;
    const response = await client.patch(endpoint, body, {
      params: { companyId: input.companyId ?? 'company-1' },
    });
    return response.data.data as DiscountRule;
  } catch {
    return thunkAPI.rejectWithValue('Failed to update discount rule');
  }
});

export const deactivateDiscountRule = createAsyncThunk<
  DiscountRule,
  { id: string; companyId?: string },
  { rejectValue: string }
>('promotions/deactivateDiscountRule', async (input, thunkAPI) => {
  try {
    const endpoint = `${ApiEndpoints.DiscountRuleDeactivate.replace(':id', input.id)}`;
    const response = await client.post(endpoint, {}, { params: { companyId: input.companyId ?? 'company-1' } });
    return response.data.data as DiscountRule;
  } catch {
    return thunkAPI.rejectWithValue('Failed to deactivate discount rule');
  }
});

export const fetchCoupons = createAsyncThunk<
  Coupon[],
  { companyId?: string } | void,
  { rejectValue: string }
>('promotions/fetchCoupons', async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();
    query.set('companyId', params?.companyId ?? 'company-1');
    const response = await client.get(`${ApiEndpoints.Coupons}?${query.toString()}`);
    return (response.data.data ?? []) as Coupon[];
  } catch {
    return thunkAPI.rejectWithValue('Failed to fetch coupons');
  }
});

export const createCoupon = createAsyncThunk<
  Coupon,
  { code: string; discountType: string; amount: number; isMultiUse?: boolean; usageLimit?: number | null; expiresAt?: string | null; scopeType: string; scopeIds: string[]; companyId?: string },
  { rejectValue: string }
>('promotions/createCoupon', async (input, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.Coupons, {
      ...input,
      companyId: input.companyId ?? 'company-1',
    });
    return response.data.data as Coupon;
  } catch {
    return thunkAPI.rejectWithValue('Failed to create coupon');
  }
});

const promotionsSlice = createSlice({
  name: 'promotions',
  initialState,
  reducers: {
    clearPromotionsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscountRules.pending, (state) => { state.discountStatus = 'loading'; state.error = null; })
      .addCase(fetchDiscountRules.fulfilled, (state, action: PayloadAction<DiscountRule[]>) => { state.discountStatus = 'succeeded'; state.discounts = action.payload; })
      .addCase(fetchDiscountRules.rejected, (state, action) => { state.discountStatus = 'failed'; state.error = action.payload ?? 'Failed'; })
      .addCase(createDiscountRule.fulfilled, (state, action: PayloadAction<DiscountRule>) => { state.discounts.unshift(action.payload); })
      .addCase(updateDiscountRule.fulfilled, (state, action: PayloadAction<DiscountRule>) => {
        const idx = state.discounts.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.discounts[idx] = action.payload;
      })
      .addCase(deactivateDiscountRule.fulfilled, (state, action: PayloadAction<DiscountRule>) => {
        const idx = state.discounts.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.discounts[idx] = action.payload;
      })
      .addCase(fetchCoupons.pending, (state) => { state.couponStatus = 'loading'; state.error = null; })
      .addCase(fetchCoupons.fulfilled, (state, action: PayloadAction<Coupon[]>) => { state.couponStatus = 'succeeded'; state.coupons = action.payload; })
      .addCase(fetchCoupons.rejected, (state, action) => { state.couponStatus = 'failed'; state.error = action.payload ?? 'Failed'; })
      .addCase(createCoupon.fulfilled, (state, action: PayloadAction<Coupon>) => { state.coupons.unshift(action.payload); });
  },
});

export const { clearPromotionsError } = promotionsSlice.actions;
export default promotionsSlice.reducer;
