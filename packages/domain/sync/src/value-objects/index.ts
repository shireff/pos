export type SyncApplyStatus = 'pending' | 'applied' | 'conflict';
export type ConflictResolutionStatus = 'pending' | 'auto_resolved' | 'manual_resolved';
export type SyncTransportType = 'lan' | 'supabase_realtime' | 'websocket';

export { SyncEvent } from './sync-event.vo';
export type { SyncEventProps, SyncEventStatus } from './sync-event.vo';
