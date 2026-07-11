export {
  SyncSimulationHarness,
  SimulatedNetwork,
  VirtualDevice,
} from './simulation/sync-simulation-harness';
export {
  runOfflineConflictScenario,
} from './simulation/scenarios/offline-conflict.scenario';
export {
  runBacklogCatchupScenario,
} from './simulation/scenarios/backlog-catchup.scenario';
export {
  runClassAConvergenceScenario,
} from './simulation/scenarios/class-a-convergence.scenario';

export { WebSocketTransport } from './websocket.transport';
export type { WebSocketTransportOptions } from './websocket.transport';
export { LanTransport } from './lan.transport';
export type { LanTransportOptions } from './lan.transport';
export { SupabaseRealtimeTransport } from './supabase-realtime.transport';
export type { SupabaseRealtimeTransportOptions } from './supabase-realtime.transport';
export { TransportSelector } from './transport-selector';
export type { TransportSelectorDeps } from './transport-selector';

export { MongoOutboxRepository } from './outbox.repository';
export { MongoInboxRepository } from './inbox.repository';
export { MongoConflictRepository } from './conflict.repository';
export { MongoReplicaStore } from './replica.repository';

export type {
  WebSocketLike,
  WebSocketFactory,
  DeviceDiscovery,
  RealtimeChannelLike,
  RealtimeClientLike,
  SyncEnvelope,
} from './transport-types';
