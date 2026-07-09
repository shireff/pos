import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints } from '../api/endpoints';

export interface HealthState {
  dbConnected: boolean;
  encryptionActive: boolean;
  appVersion: string;
}

export interface SubscriptionInfo {
  id: string;
  status: 'trialing' | 'active' | 'trial_expired' | 'past_due' | 'suspended';
  planId: string | null;
  trialEndsAt: string;
  trialStartedAt: string;
  isWriteLocked: boolean;
}

export interface DeviceInfo {
  id: string;
  deviceFingerprint: string;
  deviceType: string;
  registeredAt: string;
}

export interface SystemState {
  health: HealthState | null;
  subscription: SubscriptionInfo | null;
  registeredDevice: DeviceInfo | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SystemState = {
  health: null,
  subscription: null,
  registeredDevice: null,
  status: 'idle',
  error: null,
};

export const fetchHealth = createAsyncThunk<HealthState, void, { rejectValue: string }>(
  'system/fetchHealth',
  async (_, thunkAPI) => {
    try {
      const response = await client.get(ApiEndpoints.Health);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response as any)?.data?.error?.message || error.message;
        return thunkAPI.rejectWithValue(message);
      }
      return thunkAPI.rejectWithValue('Failed to verify system health');
    }
  },
);

export const fetchSubscription = createAsyncThunk<SubscriptionInfo, void, { rejectValue: string }>(
  'system/fetchSubscription',
  async (_, thunkAPI) => {
    try {
      const response = await client.get(ApiEndpoints.Subscription);
      return response.data.data.subscription;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response as any)?.data?.error?.message || error.message;
        return thunkAPI.rejectWithValue(message);
      }
      return thunkAPI.rejectWithValue('Failed to fetch subscription profile');
    }
  },
);

export const upgradeSubscription = createAsyncThunk<
  SubscriptionInfo,
  { planId: string; billingCycle: string },
  { rejectValue: string }
>('system/upgradeSubscription', async ({ planId, billingCycle }, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.Subscription, { planId, billingCycle });
    return response.data.data.subscription;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue('Failed to upgrade subscription');
  }
});

export const registerDevice = createAsyncThunk<
  DeviceInfo,
  { companyId: string; deviceType: string; deviceFingerprint: string },
  { rejectValue: string }
>('system/registerDevice', async ({ companyId, deviceType, deviceFingerprint }, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.DevicesRegister, {
      companyId,
      deviceType,
      deviceFingerprint,
    });
    return response.data.data.device;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue('Failed to register device');
  }
});

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.health = action.payload;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.subscription = action.payload;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.subscription = action.payload;
      })
      .addCase(registerDevice.fulfilled, (state, action) => {
        state.registeredDevice = action.payload;
      });
  },
});

export default systemSlice.reducer;
