import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    loyaltyBalance: number;
    creditBalance: number;
    companyId: string;
    createdAt: string;
}

export interface LoyaltyRedemption {
    customerId: string;
    points: number;
    orderId: string;
}

export interface CustomersState {
    customers: Customer[];
    selectedCustomer: Customer | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: CustomersState = {
    customers: [],
    selectedCustomer: null,
    status: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCustomers = createAsyncThunk<
    Customer[],
    { phone?: string; companyId?: string } | void,
    { rejectValue: string }
>('customers/fetchCustomers', async (params, thunkAPI) => {
    try {
        const query = new URLSearchParams();
        if (params?.phone) query.set('phone', params.phone);
        if (params?.companyId) query.set('companyId', params.companyId);
        const url = `${ApiEndpoints.Customers}${query.toString() ? `?${query.toString()}` : ''}`;
        const response = await client.get(url);
        return (response.data.data ?? []) as Customer[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch customers');
    }
});

export const createCustomer = createAsyncThunk<
    Customer,
    { name: string; phone: string; email?: string; companyId: string },
    { rejectValue: string }
>('customers/createCustomer', async (input, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.Customers, input);
        return response.data.data as Customer;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to create customer');
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
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to redeem loyalty points');
    }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const customersSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {
        selectCustomer(state, action: PayloadAction<Customer | null>) {
            state.selectedCustomer = action.payload;
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
            .addCase(createCustomer.fulfilled, (state, action) => {
                state.customers.unshift(action.payload);
                state.selectedCustomer = action.payload;
            })
            .addCase(redeemLoyalty.fulfilled, (state, action) => {
                const idx = state.customers.findIndex((c) => c.id === action.payload.id);
                if (idx !== -1) state.customers[idx] = action.payload;
                if (state.selectedCustomer?.id === action.payload.id) {
                    state.selectedCustomer = action.payload;
                }
            });
    },
});

export const { selectCustomer } = customersSlice.actions;
export default customersSlice.reducer;
