import { HybridLogicalClock } from '@packages/shared-kernel';

/**
 * HLCMergeService implements per-field HLC merge for Class B entities.
 * Two changes are concurrent if neither HLC is derivable as causally after the other.
 */
export class HLCMergeService {
  /**
   * Given two versions of the same field (each with an HLC timestamp),
   * returns the winning value or null to indicate a manual conflict.
   *
   * - If one HLC is causally after the other → winner is the later HLC.
   * - If both HLCs are concurrent → returns null (manual conflict required).
   */
  public static mergeField<T>(
    local: { value: T; hlc: HybridLogicalClock },
    remote: { value: T; hlc: HybridLogicalClock },
  ): { value: T; conflict: false } | { value: null; conflict: true } {
    const cmp = local.hlc.compare(remote.hlc);
    if (cmp > 0) return { value: local.value, conflict: false }; // local is later
    if (cmp < 0) return { value: remote.value, conflict: false }; // remote is later
    // Exactly equal HLC AND same nodeId → idempotent, same value
    if (local.hlc.nodeId === remote.hlc.nodeId) {
      return { value: local.value, conflict: false };
    }
    // Concurrent edits from different nodes on the same field → conflict
    return { value: null, conflict: true };
  }

  /**
   * Detects whether two field-level changes are truly concurrent
   * (neither device had seen the other's change at write time).
   */
  public static areConcurrent(a: HybridLogicalClock, b: HybridLogicalClock): boolean {
    return a.compare(b) === 0 && a.nodeId !== b.nodeId;
  }
}

/**
 * IdempotencyChecker deduplicates incoming sync events by change_id.
 */
export class IdempotencyChecker {
  private readonly appliedIds: Set<string>;

  public constructor(appliedChangeIds: string[] = []) {
    this.appliedIds = new Set(appliedChangeIds);
  }

  public isAlreadyApplied(changeId: string): boolean {
    return this.appliedIds.has(changeId);
  }

  public markApplied(changeId: string): void {
    this.appliedIds.add(changeId);
  }
}
