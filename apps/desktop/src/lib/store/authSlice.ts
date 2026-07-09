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

/** Structured reject value so the UI can translate by code. */
interface AuthRejectValue {
  message: string;
  code: string;
}

export interface AuthState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  token: string | null;
  user: AuthUser | null;
  /** Raw English message from the server (fallback). */
  error: string | null;
  /** Machine-readable code for client-side i18n lookup. */
  errorCode: string | null;
  challengeToken: string | null;
  mfaRequired: boolean;
  mfaSetup: {
    secret: string;
    otpauthUri: string;
    qrCode: string;
    setupToken: string;
  } | null;
  branchRoles: string[];
}

const persistedSession = getAuthSessionSync();

const initialState: AuthState = {
  status: 'idle',
  token: persistedSession?.token ?? null,
  user: persistedSession?.user ?? null,
  error: null,
  errorCode: null,
  challengeToken: null,
  mfaRequired: false,
  mfaSetup: null,
  branchRoles: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractAxiosError(error: unknown): AuthRejectValue {
  if (axios.isAxiosError(error)) {
    const errData = (error.response?.data as { error?: { message?: string; code?: string } })
      ?.error;
    return {
      message: errData?.message ?? error.message,
      code: errData?.code ?? 'NETWORK_ERROR',
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    code: 'INTERNAL_SERVER_ERROR',
  };
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const login = createAsyncThunk<
  RestoreSessionResult,
  LoginPayload,
  { rejectValue: AuthRejectValue }
>('auth/login', async (payload, thunkAPI) => {
  try {
    const endpoint = payload.isPlatformAdmin
      ? ApiEndpoints.PlatformAdminLogin
      : ApiEndpoints.AuthLogin;

    const body = payload.isPlatformAdmin
      ? { email: payload.email, password: payload.password }
      : {
        email: payload.email,
        password: payload.password,
        companyId: payload.companyId,
        deviceFingerprint: 'desktop-client',
        deviceType: 'desktop',
      };

    type LoginResponseData = {
      accessToken?: string;
      refreshToken?: string;
      challengeToken?: string;
      user?: { id: string; companyId: string; email: string; name: string };
      admin?: { id: string; email: string; name: string; role: string };
    };

    const response = await client.post<{ data?: LoginResponseData } & LoginResponseData>(endpoint, body);
    const raw = response.data;
    const resData: LoginResponseData = raw.data ?? raw;

    const token: string | null = resData.accessToken ?? resData.challengeToken ?? null;
    const userData = resData.user ?? resData.admin;
    const user: AuthUser | null = userData
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
    return thunkAPI.rejectWithValue(extractAxiosError(error));
  }
});

interface MfaSetupResult {
  secret: string;
  otpauthUri: string;
  qrCode: string;
  setupToken: string;
}

export const setupMfa = createAsyncThunk<
  MfaSetupResult,
  { email: string; password: string },
  { rejectValue: AuthRejectValue }
>('auth/setupMfa', async (payload, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.PlatformAdminMfaSetup, {
      email: payload.email,
      password: payload.password,
    });
    const data = (response.data as { data: MfaSetupResult }).data;
    return { secret: data.secret, otpauthUri: data.otpauthUri, qrCode: data.qrCode, setupToken: data.setupToken };
  } catch (error) {
    return thunkAPI.rejectWithValue(extractAxiosError(error));
  }
});

export const confirmMfaSetup = createAsyncThunk<
  { adminId: string; enrolled: boolean },
  { setupToken: string; code: string },
  { rejectValue: AuthRejectValue }
>('auth/confirmMfaSetup', async (payload, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.PlatformAdminMfaSetupVerify, {
      setupToken: payload.setupToken,
      code: payload.code,
    });
    return (response.data as { data: { adminId: string; enrolled: boolean } }).data;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractAxiosError(error));
  }
});

export const verifyMfa = createAsyncThunk<
  RestoreSessionResult,
  { challengeToken: string; code: string },
  { rejectValue: AuthRejectValue }
>('auth/verifyMfa', async (payload, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.PlatformAdminMfaVerify, {
      mfaChallengeToken: payload.challengeToken,
      code: payload.code,
    });
    const resData = (response.data as { data?: { accessToken?: string; admin?: AuthUser } }).data;
    const token = resData?.accessToken ?? null;
    const admin = resData?.admin;
    const user: AuthUser | null = admin
      ? { id: admin.id, email: admin.email, name: admin.name }
      : null;

    if (token) {
      await setAuthSessionInStorage({ token, user });
    }

    return { token, user };
  } catch (error) {
    return thunkAPI.rejectWithValue(extractAxiosError(error));
  }
});

export const fetchMe = createAsyncThunk<
  { userId: string; companyId: string; branchRoles: string[] },
  void,
  { rejectValue: AuthRejectValue }
>('auth/fetchMe', async (_, thunkAPI) => {
  try {
    const response = await client.get(ApiEndpoints.AuthMe);
    return (response.data as { data: { userId: string; companyId: string; branchRoles: string[] } }).data;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractAxiosError(error));
  }
});

export const restoreSession = createAsyncThunk<RestoreSessionResult | null>(
  'auth/restoreSession',
  async () => {
    const session = await getAuthSession();
    if (!session) return null;
    return { token: session.token, user: session.user };
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await removeAuthSession();
});

export const refreshToken = createAsyncThunk<
  { token: string },
  void,
  { rejectValue: AuthRejectValue; state: RootState }
>('auth/refreshToken', async (_, thunkAPI) => {
  try {
    const currentToken = thunkAPI.getState().auth.token;
    if (!currentToken) {
      return thunkAPI.rejectWithValue({ message: 'No session to refresh', code: 'UNAUTHORIZED' });
    }

    const response = await client.post(
      ApiEndpoints.AuthRefresh,
      {},
      { headers: { Authorization: `Bearer ${currentToken}` } },
    );
    const newToken: string =
      (response.data as { data?: { accessToken?: string }; accessToken?: string }).data
        ?.accessToken ??
      (response.data as { accessToken?: string }).accessToken ??
      '';

    if (!newToken) {
      return thunkAPI.rejectWithValue({ message: 'No token in refresh response', code: 'UNAUTHORIZED' });
    }

    const session = await import('../storage/secureStorage').then((m) => m.getAuthSession());
    await import('../storage/secureStorage').then((m) =>
      m.setAuthSessionInStorage({ token: newToken, user: session?.user ?? null }),
    );
    return { token: newToken };
  } catch (error) {
    return thunkAPI.rejectWithValue(extractAxiosError(error));
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearMfaState(state) {
      state.challengeToken = null;
      state.mfaRequired = false;
      state.mfaSetup = null;
      state.error = null;
      state.errorCode = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.errorCode = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.errorCode = null;

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
        state.error = action.payload?.message ?? action.error.message ?? 'Login failed';
        state.errorCode = action.payload?.code ?? 'INTERNAL_SERVER_ERROR';
      })

      // verifyMfa
      .addCase(verifyMfa.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.errorCode = null;
      })
      .addCase(verifyMfa.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.challengeToken = null;
        state.mfaRequired = false;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(verifyMfa.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message ?? action.error.message ?? 'MFA verification failed';
        state.errorCode = action.payload?.code ?? 'MFA_INVALID';
      })

      // setupMfa
      .addCase(setupMfa.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.errorCode = null;
      })
      .addCase(setupMfa.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.mfaSetup = action.payload;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(setupMfa.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message ?? action.error.message ?? 'MFA setup failed';
        state.errorCode = action.payload?.code ?? 'MFA_SETUP_FAILED';
      })

      // confirmMfaSetup
      .addCase(confirmMfaSetup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.errorCode = null;
      })
      .addCase(confirmMfaSetup.fulfilled, (state) => {
        state.status = 'succeeded';
        state.mfaSetup = null;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(confirmMfaSetup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message ?? action.error.message ?? 'MFA enrollment failed';
        state.errorCode = action.payload?.code ?? 'MFA_INVALID';
      })

      // fetchMe
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.branchRoles = action.payload.branchRoles;
        if (state.user) state.user.branchRoles = action.payload.branchRoles;
      })

      // restoreSession
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
        state.errorCode = null;
      })

      // logout
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.token = null;
        state.user = null;
        state.error = null;
        state.errorCode = null;
        state.challengeToken = null;
        state.mfaRequired = false;
        state.branchRoles = [];
      })

      // refreshToken
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshToken.rejected, (state) => {
        // Silent fail — expired refresh means full re-login
        state.token = null;
        state.user = null;
        state.status = 'idle';
      });
  },
});

export const { clearMfaState } = authSlice.actions;
export default authSlice.reducer;
