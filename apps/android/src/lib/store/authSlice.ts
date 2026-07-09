/**
 * Auth slice for Android — mirrors desktop authSlice exactly,
 * adapted to use the Android API client.
 */
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

export interface AuthState {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    token: string | null;
    user: AuthUser | null;
    error: string | null;
    challengeToken: string | null;
    mfaRequired: boolean;
    branchRoles: string[];
}

const persisted = getAuthSessionSync();

const initialState: AuthState = {
    status: 'idle',
    token: persisted?.accessToken ?? null,
    user: persisted?.currentUser
        ? {
            id: persisted.currentUser.id,
            email: persisted.currentUser.email,
            name: persisted.currentUser.name,
            companyId: persisted.currentUser.companyId,
        }
        : null,
    error: null,
    challengeToken: null,
    mfaRequired: false,
    branchRoles: persisted?.branchRoles ?? [],
};

export const login = createAsyncThunk<
    RestoreSessionResult,
    LoginPayload,
    { rejectValue: string }
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
                deviceFingerprint: `android-${Date.now()}`,
                deviceType: 'android',
            };

        const response = await client.post<{
            data: {
                accessToken?: string;
                challengeToken?: string;
                user?: AuthUser;
                admin?: AuthUser;
            };
        }>(endpoint, body);

        const resData = response.data.data;
        const token = resData.accessToken ?? resData.challengeToken ?? null;
        const rawUser = resData.user ?? resData.admin ?? null;
        const user = rawUser
            ? { id: rawUser.id, email: rawUser.email, name: rawUser.name, companyId: (rawUser as { companyId?: string }).companyId }
            : null;

        if (token && !resData.challengeToken && user) {
            await setAuthSessionInStorage({
                currentUser: {
                    ...user,
                    companyId: user.companyId ?? '',
                    defaultBranchId: null,
                    isActive: true,
                },
                accessToken: token,
                branchRoles: [],
                isAuthenticated: true,
            });
        }

        return { token, user };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Unable to connect to authentication server.');
    }
});

export const verifyMfa = createAsyncThunk<
    RestoreSessionResult,
    { challengeToken: string; code: string },
    { rejectValue: string }
>('auth/verifyMfa', async (payload, thunkAPI) => {
    try {
        const response = await client.post<{
            data: { accessToken: string; admin: AuthUser };
        }>(ApiEndpoints.PlatformAdminMfaVerify, {
            mfaChallengeToken: payload.challengeToken,
            code: payload.code,
        });
        const { accessToken, admin } = response.data.data;
        const user: AuthUser = { id: admin.id, email: admin.email, name: admin.name };
        await setAuthSessionInStorage({
            currentUser: {
                ...user,
                companyId: user.companyId ?? '',
                defaultBranchId: null,
                isActive: true,
            },
            accessToken,
            branchRoles: [],
            isAuthenticated: true,
        });
        return { token: accessToken, user };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('MFA verification failed');
    }
});

export const fetchMe = createAsyncThunk<
    { userId: string; companyId: string; branchRoles: string[] },
    void,
    { rejectValue: string }
>('auth/fetchMe', async (_, thunkAPI) => {
    try {
        const response = await client.get<{
            data: { userId: string; companyId: string; branchRoles: string[] };
        }>(ApiEndpoints.AuthMe);
        return response.data.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch profile');
    }
});

export const restoreSession = createAsyncThunk<RestoreSessionResult | null>(
    'auth/restoreSession',
    async () => {
        const session = await getAuthSession();
        if (!session) return null;
        return {
            token: session.accessToken,
            user: session.currentUser
                ? {
                    id: session.currentUser.id,
                    email: session.currentUser.email,
                    name: session.currentUser.name,
                    companyId: session.currentUser.companyId,
                }
                : null,
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
        const response = await client.post<{ data: { accessToken: string } }>(
            ApiEndpoints.AuthRefresh,
            {},
            { headers: { Authorization: `Bearer ${currentToken}` } },
        );
        return { token: response.data.data.accessToken };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to refresh session');
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
            .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
            .addCase(login.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.error = null;
                const isChallenge = Boolean(action.payload.token?.includes('challenge'));
                if (isChallenge) {
                    state.challengeToken = action.payload.token;
                    state.mfaRequired = true;
                } else {
                    state.token = action.payload.token;
                    state.user = action.payload.user;
                    state.challengeToken = null;
                    state.mfaRequired = false;
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Login failed';
            })
            .addCase(verifyMfa.pending, (state) => { state.status = 'loading'; state.error = null; })
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
                state.error = action.payload ?? 'MFA failed';
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.branchRoles = action.payload.branchRoles;
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
            .addCase(refreshToken.fulfilled, (state, action) => { state.token = action.payload.token; })
            .addCase(refreshToken.rejected, (state) => { state.token = null; state.user = null; state.status = 'idle'; });
    },
});

export const { clearMfaState } = authSlice.actions;
export default authSlice.reducer;
