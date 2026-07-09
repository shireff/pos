import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyCode: string;
  loyaltyTierId: string;
  loyaltyBalance: number;
  creditLimitPiasters: number;
  creditBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends Customer {
  loyaltyAccount: {
    pointsBalance: number;
    tierId: string;
  } | null;
  creditLedger: {
    balancePiasters: number;
    creditLimitPiasters: number;
  } | null;
  recentEvents: LoyaltyEvent[];
  recentCreditEntries: CreditEntry[];
}

export interface LoyaltyEvent {
  id: string;
  eventType: string;
  amountPoints: number;
  referenceType?: string;
  referenceId?: string;
  occurredAt: string;
  createdAt: string;
}

export interface CreditEntry {
  id: string;
  eventType: string;
  amountPiasters: number;
  paymentMethod?: string;
  referenceNumber?: string;
  occurredAt: string;
  createdAt: string;
}

export interface LoyaltyRedemption {
  customerId: string;
  points: number;
  orderId?: string;
}

export interface CustomersState {
  customers: Customer[];
  selectedCustomer: CustomerDetail | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  selectedCustomer: null,
  status: 'idle',
  detailStatus: 'idle',
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCustomers = createAsyncThunk<
  Customer[],
  { query?: string; companyId?: string } | void,
  { rejectValue: string }
>('customers/fetchCustomers', async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();
    query.set('companyId', params?.companyId ?? 'company-1');
    if (params?.query) query.set('query', params.query);
    const url = `${ApiEndpoints.Customers}?${query.toString()}`;
    const response = await client.get(url);
    return (response.data.data ?? []) as Customer[];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch customers');
  }
});

export const fetchCustomerById = createAsyncThunk<
  CustomerDetail,
  { customerId: string; companyId?: string },
  { rejectValue: string }
>('customers/fetchCustomerById', async ({ customerId, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.CustomerById, { id: customerId });
    const response = await client.get(endpoint, {
      params: { companyId: companyId ?? 'company-1' },
    });
    return response.data.data as CustomerDetail;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch customer');
  }
});

export const createCustomer = createAsyncThunk<
  Customer,
  { name: string; phone: string; email?: string; companyId: string },
  { rejectValue: string }
>('customers/createCustomer', async (input, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.Customers, {
      ...input,
      companyId: input.companyId ?? 'company-1',
    });
    return response.data.data as Customer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to create customer');
  }
});

export const updateCustomer = createAsyncThunk<
  Customer,
  { customerId: string; updates: Partial<Customer>; companyId?: string },
  { rejectValue: string }
>('customers/updateCustomer', async ({ customerId, updates, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.CustomerById, { id: customerId });
    const response = await client.patch(endpoint, updates, {
      params: { companyId: companyId ?? 'company-1' },
    });
    return response.data.data as Customer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to update customer');
  }
});

export const redeemLoyalty = createAsyncThunk<
  Customer,
  LoyaltyRedemption,
  { rejectValue: string }
>('customers/redeemLoyalty', async ({ customerId, points, orderId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.CustomerLoyaltyRedeem, { id: customerId });
    const response = await client.post(endpoint, { points, orderId });
    return response.data.data as Customer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to redeem loyalty points');
  }
});

export const recordCreditPayment = createAsyncThunk<
  Customer,
  { customerId: string; amountPiasters: number; paymentMethod: string; companyId?: string },
  { rejectValue: string }
>('customers/recordCreditPayment', async ({ customerId, amountPiasters, paymentMethod, companyId }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.CustomerCreditPayments, { id: customerId });
    const response = await client.post(endpoint, {
      amountPiasters,
      paymentMethod,
      companyId: companyId ?? 'company-1',
    });
    return response.data.data as Customer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to record credit payment');
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    selectCustomer(state, action: PayloadAction<Customer | null>) {
      state.selectedCustomer = action.payload as any;
    },
    clearCustomerDetail(state) {
      state.selectedCustomer = null;
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch customers';
      })
      .addCase(fetchCustomerById.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.selectedCustomer = action.payload as any;
      })
      .addCase(fetchCustomerById.rejected, (state) => {
        state.detailStatus = 'failed';
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.unshift(action.payload as any);
        state.selectedCustomer = action.payload as any;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const idx = state.customers.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.customers[idx] = action.payload as any;
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = { ...state.selectedCustomer, ...action.payload } as any;
        }
      })
      .addCase(redeemLoyalty.fulfilled, (state, action) => {
        const idx = state.customers.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.customers[idx] = action.payload as any;
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = { ...state.selectedCustomer, ...action.payload } as any;
        }
      })
      .addCase(recordCreditPayment.fulfilled, (state, action) => {
        const idx = state.customers.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.customers[idx] = action.payload as any;
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = { ...state.selectedCustomer, ...action.payload } as any;
        }
      });
  },
});

export const { selectCustomer, clearCustomerDetail } = customersSlice.actions;
export default customersSlice.reducer;
