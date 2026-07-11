import { HybridLogicalClock } from '@packages/shared-kernel';

/**
 * HlcConcurrentDetector determines whether two changes were made independently
 * (neither device had seen the other's timestamp at write time).
 *
 * Causal ordering is established by the (time, logical) part of the HLC.
 * Two HLCs are concurrent when neither is causally greater than the other —
 * i.e. they share the same (time, logical) coordinate. When the coordinate is
 * shared but the nodeIds differ, the edits are genuinely concurrent and the
 * higher-priority conflict logic applies. When the coordinate AND nodeId match,
 * the two HLCs represent the same event (idempotent replay).
 */
export class HlcConcurrentDetector {
  /** True when `a` is causally strictly greater than `b`. */
  public static isCausallyAfter(a: HybridLogicalClock, b: HybridLogicalClock): boolean {
    if (a.time !== b.time) return a.time > b.time;
    return a.logical > b.logical;
  }

  /**
   * Two HLCs are concurrent if neither is causally greater than the other.
   * Equivalently their (time, logical) coordinates are identical.
   */
  public static areConcurrent(a: HybridLogicalClock, b: HybridLogicalClock): boolean {
    return a.time === b.time && a.logical === b.logical;
  }

  /**
   * Concurrent edits from DIFFERENT nodes on the same field produce a conflict.
   * Same coordinate + same node means the same event (replay is a no-op).
   */
  public static isConcurrentConflict(a: HybridLogicalClock, b: HybridLogicalClock): boolean {
    return HlcConcurrentDetector.areConcurrent(a, b) && a.nodeId !== b.nodeId;
  }

  /** True when both clocks represent the exact same event (same coordinate + node). */
  public static isSameEvent(a: HybridLogicalClock, b: HybridLogicalClock): boolean {
    return HlcConcurrentDetector.areConcurrent(a, b) && a.nodeId === b.nodeId;
  }
}
