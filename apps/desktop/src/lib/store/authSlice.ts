import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints } from '../api/endpoints';
import type { RootState } from './index';
import {
  getAuthSession,
  getAuthSessionSync,
  removeAuthSession,
  setAuthSessionInStorage,
} from '../storage/secureStorage';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  companyId?: string;
  branchRoles?: string[];
}

interface AuthResponse {
  [x: string]: any;
  data: {
    accessToken?: string;
    refreshToken?: string;
    challengeToken?: string;
    user?: {
      id: string;
      companyId: string;
      email: string;
      name: string;
    };
    admin?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
}

interface LoginPayload {
  email: string;
  password: string;
  companyId?: string;
  isPlatformAdmin?: boolean;
}

interface RestoreSessionResult {
  token: string | null;
  user: AuthUser | null;
}

export interface AuthState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  token: string | null;
  user: AuthUser | null;
  error: string | null;
  challengeToken: string | null;
  mfaRequired: boolean;
  branchRoles: string[];
}

const persistedSession = getAuthSessionSync();

const initialState: AuthState = {
  status: 'idle',
  token: persistedSession?.token ?? null,
  user: persistedSession?.user ?? null,
  error: null,
  challengeToken: null,
  mfaRequired: false,
  branchRoles: [],
};

export const login = createAsyncThunk<
  RestoreSessionResult,
  LoginPayload,
  {
    rejectValue: string;
  }
>('auth/login', async (payload, thunkAPI) => {
  try {
    const endpoint = payload.isPlatformAdmin
      ? ApiEndpoints.PlatformAdminLogin
      : ApiEndpoints.AuthLogin;

    const body = payload.isPlatformAdmin
      ? {
          email: payload.email,
          password: payload.password,
        }
      : {
          email: payload.email,
          password: payload.password,
          companyId: payload.companyId,
          deviceFingerprint: 'desktop-client',
          deviceType: 'desktop',
        };

    const response = await client.post<AuthResponse>(endpoint, body);

    // For Platform Admin login: response.data.data could have challengeToken
    const resData = (response.data as any).data || response.data;
    const token = resData.accessToken ?? resData.challengeToken ?? null;
    const userData = resData.user ?? resData.admin;
    const user = userData
      ? {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          companyId: (userData as { companyId?: string }).companyId,
        }
      : null;

    if (token && !resData.challengeToken) {
      await setAuthSessionInStorage({ token, user });
    }

    return { token, user };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }

    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : 'Unable to connect to the authentication server.',
    );
  }
});

export const verifyMfa = createAsyncThunk<
  RestoreSessionResult,
  { challengeToken: string; code: string },
  { rejectValue: string }
>('auth/verifyMfa', async (payload, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.PlatformAdminMfaVerify, {
      mfaChallengeToken: payload.challengeToken,
      code: payload.code,
    });
    const resData = (response.data as any).data;
    const token = resData.accessToken;
    const admin = resData.admin;
    const user = admin
      ? {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        }
      : null;

    if (token) {
      await setAuthSessionInStorage({ token, user });
    }

    return { token, user };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : 'MFA verification failed',
    );
  }
});

export const fetchMe = createAsyncThunk<
  { userId: string; companyId: string; branchRoles: string[] },
  void,
  { rejectValue: string }
>('auth/fetchMe', async (_, thunkAPI) => {
  try {
    const response = await client.get(ApiEndpoints.AuthMe);
    return (response.data as any).data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response as any)?.data?.error?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
    return thunkAPI.rejectWithValue('Failed to fetch profile settings');
  }
});

export const restoreSession = createAsyncThunk<RestoreSessionResult | null>(
  'auth/restoreSession',
  async () => {
    const session = await getAuthSession();
    if (!session) {
      return null;
    }

    return {
      token: session.token,
      user: session.user,
    };
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await removeAuthSession();
});

export const refreshToken = createAsyncThunk<
  { token: string },
  void,
  { rejectValue: string; state: RootState }
>('auth/refreshToken', async (_, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const currentToken = state.auth.token;
    if (!currentToken) return thunkAPI.rejectWithValue('No session to refresh');

    const response = await client.post(
      ApiEndpoints.AuthRefresh,
      {},
      {
        headers: { Authorization: `Bearer ${currentToken}` },
      },
    );
    const newToken: string =
      (response.data as any).data?.accessToken ?? (response.data as any).accessToken;
    if (!newToken) return thunkAPI.rejectWithValue('No token in refresh response');

    const session = await import('../storage/secureStorage').then((m) => m.getAuthSession());
    await import('../storage/secureStorage').then((m) =>
      m.setAuthSessionInStorage({ token: newToken, user: session?.user ?? null }),
    );
    return { token: newToken };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to refresh session token');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearMfaState(state) {
      state.challengeToken = null;
      state.mfaRequired = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;

        const isChallenge = Boolean(
          action.payload.token &&
          (action.payload.token.startsWith('challenge_') ||
            action.payload.token.includes('challenge')),
        );

        if (isChallenge) {
          state.challengeToken = action.payload.token;
          state.mfaRequired = true;
          state.token = null;
          state.user = null;
        } else {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.challengeToken = null;
          state.mfaRequired = false;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Login failed';
      })
      .addCase(verifyMfa.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyMfa.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.challengeToken = null;
        state.mfaRequired = false;
        state.error = null;
      })
      .addCase(verifyMfa.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'MFA verification failed';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.branchRoles = action.payload.branchRoles;
        if (state.user) {
          state.user.branchRoles = action.payload.branchRoles;
        }
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = 'succeeded';
          state.token = action.payload.token;
          state.user = action.payload.user;
        } else {
          state.status = 'idle';
          state.token = null;
          state.user = null;
        }
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.token = null;
        state.user = null;
        state.error = null;
        state.challengeToken = null;
        state.mfaRequired = false;
        state.branchRoles = [];
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshToken.rejected, (state) => {
        // Silent fail — expired refresh means full logout
        state.token = null;
        state.user = null;
        state.status = 'idle';
      });
  },
});

export const { clearMfaState } = authSlice.actions;
export default authSlice.reducer;
