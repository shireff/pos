import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

export interface AccountSubscription {
  status: 'trialing' | 'active' | 'trial_expired' | 'past_due' | 'suspended';
  planId: 'basic' | 'pro' | 'enterprise' | null;
  trialEndsAt: string;
}

export interface AccountDetail {
  companyId: string;
  name: string;
  businessType: string;
  subscription: AccountSubscription;
  createdAt: string;
}

export interface PlatformAdminState {
  accounts: AccountDetail[];
  selectedAccount: AccountDetail | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: PlatformAdminState = {
  accounts: [],
  selectedAccount: null,
  status: 'idle',
  error: null,
};

export const fetchAccounts = createAsyncThunk<AccountDetail[], void, { rejectValue: string }>(
  'platformAdmin/fetchAccounts',
  async (_, thunkAPI) => {
    try {
      const response = await client.get(ApiEndpoints.PlatformAdminAccounts);
      return response.data.data.accounts;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response as any)?.data?.error?.message || error.message;
        return thunkAPI.rejectWithValue(message);
      }
      return thunkAPI.rejectWithValue('Failed to fetch accounts list');
    }
  },
);

export const fetchAccountDetail = createAsyncThunk<AccountDetail, string, { rejectValue: string }>(
  'platformAdmin/fetchAccountDetail',
  async (companyId, thunkAPI) => {
    try {
      const endpoint = buildEndpoint(ApiEndpoints.PlatformAdminAccountDetail, { companyId });
      const response = await client.get(endpoint);
      return response.data.data.account;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response as any)?.data?.error?.message || error.message;
        return thunkAPI.rejectWithValue(message);
      }
      return thunkAPI.rejectWithValue('Failed to fetch account detail');
    }
  },
);

export const changePlan = createAsyncThunk<
  { companyId: string; subscription: AccountSubscription },
  { companyId: string; planId: string; reason: string },
  { rejectValue: string }
>('platformAdmin/changePlan', async ({ companyId, planId, reason }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.PlatformAdminAccountPlan, { companyId });
    const response = await client.patch(endpoint, { planId, reason });
    return {
      companyId,
      subscription: response.data.data.subscription,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue('Failed to change subscription plan');
  }
});

export const suspendAccount = createAsyncThunk<
  { companyId: string; subscription: AccountSubscription },
  { companyId: string; reason: string },
  { rejectValue: string }
>('platformAdmin/suspendAccount', async ({ companyId, reason }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.PlatformAdminAccountSuspend, { companyId });
    const response = await client.post(endpoint, { reason });
    return {
      companyId,
      subscription: response.data.data.subscription,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue('Failed to suspend account');
  }
});

export const reactivateAccount = createAsyncThunk<
  { companyId: string; subscription: AccountSubscription },
  { companyId: string; reason: string },
  { rejectValue: string }
>('platformAdmin/reactivateAccount', async ({ companyId, reason }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.PlatformAdminAccountReactivate, { companyId });
    const response = await client.post(endpoint, { reason });
    return {
      companyId,
      subscription: response.data.data.subscription,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue('Failed to reactivate account');
  }
});

export const extendTrial = createAsyncThunk<
  { companyId: string; subscription: AccountSubscription },
  { companyId: string; newTrialEndsAt: string; reason: string },
  { rejectValue: string }
>('platformAdmin/extendTrial', async ({ companyId, newTrialEndsAt, reason }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.PlatformAdminAccountTrialExtend, { companyId });
    const response = await client.post(endpoint, { newTrialEndsAt, reason });
    return {
      companyId,
      subscription: response.data.data.subscription,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue('Failed to extend trial period');
  }
});

const platformAdminSlice = createSlice({
  name: 'platformAdmin',
  initialState,
  reducers: {
    selectAccount(state, action: PayloadAction<string>) {
      const account = state.accounts.find((acc) => acc.companyId === action.payload);
      if (account) {
        state.selectedAccount = account;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.accounts = action.payload;
        if (state.accounts.length > 0 && !state.selectedAccount) {
          state.selectedAccount = state.accounts[0];
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch accounts';
      })
      .addCase(fetchAccountDetail.fulfilled, (state, action) => {
        state.selectedAccount = action.payload;
        const idx = state.accounts.findIndex((acc) => acc.companyId === action.payload.companyId);
        if (idx !== -1) {
          state.accounts[idx] = action.payload;
        }
      })
      .addCase(changePlan.fulfilled, (state, action) => {
        const { companyId, subscription } = action.payload;
        if (state.selectedAccount?.companyId === companyId) {
          state.selectedAccount.subscription = subscription;
        }
        const idx = state.accounts.findIndex((acc) => acc.companyId === companyId);
        if (idx !== -1) {
          state.accounts[idx].subscription = subscription;
        }
      })
      .addCase(suspendAccount.fulfilled, (state, action) => {
        const { companyId, subscription } = action.payload;
        if (state.selectedAccount?.companyId === companyId) {
          state.selectedAccount.subscription = subscription;
        }
        const idx = state.accounts.findIndex((acc) => acc.companyId === companyId);
        if (idx !== -1) {
          state.accounts[idx].subscription = subscription;
        }
      })
      .addCase(reactivateAccount.fulfilled, (state, action) => {
        const { companyId, subscription } = action.payload;
        if (state.selectedAccount?.companyId === companyId) {
          state.selectedAccount.subscription = subscription;
        }
        const idx = state.accounts.findIndex((acc) => acc.companyId === companyId);
        if (idx !== -1) {
          state.accounts[idx].subscription = subscription;
        }
      })
      .addCase(extendTrial.fulfilled, (state, action) => {
        const { companyId, subscription } = action.payload;
        if (state.selectedAccount?.companyId === companyId) {
          state.selectedAccount.subscription = subscription;
        }
        const idx = state.accounts.findIndex((acc) => acc.companyId === companyId);
        if (idx !== -1) {
          state.accounts[idx].subscription = subscription;
        }
      });
  },
});

export const { selectAccount } = platformAdminSlice.actions;
export default platformAdminSlice.reducer;
