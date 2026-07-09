import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncEvent {
    aggregateType: string;
    aggregateId: string;
    sequenceNo: number;
    payload: Record<string, unknown>;
}

export interface SyncPushResult {
    accepted: number;
    duplicates: number;
    conflicts: number;
}

export interface SyncConflict {
    id: string;
    aggregateType: string;
    aggregateId: string;
    localPayload: Record<string, unknown>;
    remotePayload: Record<string, unknown>;
    status: 'pending' | 'resolved';
    createdAt: string;
}

export interface SyncState {
    lastSyncAt: string | null;
    pendingEvents: SyncEvent[];
    conflicts: SyncConflict[];
    pushStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    pullStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: SyncState = {
    lastSyncAt: null,
    pendingEvents: [],
    conflicts: [],
    pushStatus: 'idle',
    pullStatus: 'idle',
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const pushSyncEvents = createAsyncThunk<
    SyncPushResult,
    { deviceId: string; events: SyncEvent[] },
    { rejectValue: string }
>('sync/push', async ({ deviceId, events }, thunkAPI) => {
    try {
        const response = await client.post(ApiEndpoints.SyncPush, { deviceId, events });
        return response.data.data as SyncPushResult;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to push sync events');
    }
});

export const pullSyncEvents = createAsyncThunk<
    SyncEvent[],
    { deviceId: string; since?: number },
    { rejectValue: string }
>('sync/pull', async ({ deviceId, since }, thunkAPI) => {
    try {
        const query = new URLSearchParams({ deviceId });
        if (since !== undefined) query.set('since', String(since));
        const response = await client.get(`${ApiEndpoints.SyncPull}?${query.toString()}`);
        return (response.data.data ?? []) as SyncEvent[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to pull sync events');
    }
});

export const fetchConflicts = createAsyncThunk<
    SyncConflict[],
    { status?: 'pending' | 'resolved' } | void,
    { rejectValue: string }
>('sync/fetchConflicts', async (params, thunkAPI) => {
    try {
        const query = params?.status ? `?status=${params.status}` : '';
        const response = await client.get(`${ApiEndpoints.SyncConflicts}${query}`);
        return (response.data.data ?? []) as SyncConflict[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to fetch sync conflicts');
    }
});

export const resolveConflict = createAsyncThunk<
    SyncConflict,
    {
        conflictId: string;
        resolution: 'keep_local' | 'keep_remote' | 'merged';
        mergedPayload?: Record<string, unknown>;
    },
    { rejectValue: string }
>('sync/resolveConflict', async ({ conflictId, resolution, mergedPayload }, thunkAPI) => {
    try {
        const endpoint = buildEndpoint(ApiEndpoints.SyncConflictResolve, { id: conflictId });
        const response = await client.post(endpoint, { resolution, mergedPayload });
        return response.data.data as SyncConflict;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return thunkAPI.rejectWithValue(
                (error.response as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                error.message,
            );
        }
        return thunkAPI.rejectWithValue('Failed to resolve conflict');
    }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const syncSlice = createSlice({
    name: 'sync',
    initialState,
    reducers: {
        queueEvent(state, action: PayloadAction<SyncEvent>) {
            state.pendingEvents.push(action.payload);
        },
        clearPendingEvents(state) {
            state.pendingEvents = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(pushSyncEvents.pending, (state) => {
                state.pushStatus = 'loading';
                state.error = null;
            })
            .addCase(pushSyncEvents.fulfilled, (state) => {
                state.pushStatus = 'succeeded';
                state.lastSyncAt = new Date().toISOString();
                state.pendingEvents = [];
            })
            .addCase(pushSyncEvents.rejected, (state, action) => {
                state.pushStatus = 'failed';
                state.error = action.payload ?? 'Sync push failed';
            })
            .addCase(pullSyncEvents.pending, (state) => {
                state.pullStatus = 'loading';
            })
            .addCase(pullSyncEvents.fulfilled, (state) => {
                state.pullStatus = 'succeeded';
                state.lastSyncAt = new Date().toISOString();
            })
            .addCase(pullSyncEvents.rejected, (state, action) => {
                state.pullStatus = 'failed';
                state.error = action.payload ?? 'Sync pull failed';
            })
            .addCase(fetchConflicts.fulfilled, (state, action) => {
                state.conflicts = action.payload;
            })
            .addCase(resolveConflict.fulfilled, (state, action) => {
                const idx = state.conflicts.findIndex((c) => c.id === action.payload.id);
                if (idx !== -1) state.conflicts[idx] = action.payload;
            });
    },
});

export const { queueEvent, clearPendingEvents } = syncSlice.actions;
export default syncSlice.reducer;
