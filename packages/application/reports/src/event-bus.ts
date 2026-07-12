// The internal EventBus now lives in shared-kernel so all workers (projection,
// notification dispatcher) share a single in-process bus. This module re-exports
// it for backward compatibility with the ProjectionWorker.
export { EventBus, eventBus, ALL_EVENTS } from '@packages/shared-kernel';
export type { EventHandler } from '@packages/shared-kernel';
