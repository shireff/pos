import { HybridLogicalClock } from '@packages/shared-kernel';
import { HlcConcurrentDetector } from './hlc-concurrent-detector.service';

/**
 * HLCMergeService implements per-field HLC merge for Class B entities.
 * Delegates to HlcConcurrentDetector for the causal/concurrency checks.
 */
export class HLCMergeService {
  /**
   * Given two versions of the same field (each with an HLC timestamp),
   * returns the winning value or null to indicate a manual conflict.
   */
  public static mergeField<T>(
    local: { value: T; hlc: HybridLogicalClock },
    remote: { value: T; hlc: HybridLogicalClock },
  ): { value: T; conflict: false } | { value: null; conflict: true } {
    const remoteAfter = HlcConcurrentDetector.isCausallyAfter(remote.hlc, local.hlc);
    const localAfter = HlcConcurrentDetector.isCausallyAfter(local.hlc, remote.hlc);

    if (remoteAfter) return { value: remote.value, conflict: false };
    if (localAfter) return { value: local.value, conflict: false };
    if (HlcConcurrentDetector.isSameEvent(remote.hlc, local.hlc)) {
      return { value: local.value, conflict: false };
    }
    return { value: null, conflict: true };
  }

  public static areConcurrent(a: HybridLogicalClock, b: HybridLogicalClock): boolean {
    return HlcConcurrentDetector.isConcurrentConflict(a, b);
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

export { HlcConcurrentDetector } from './hlc-concurrent-detector.service';
export { ClassAMergeService } from './class-a-merge.service';
export type {
  ClassAEvent,
  ClassAEventType,
  ClassAProjection,
} from './class-a-merge.service';
export { ClassBMergeService } from './class-b-merge.service';
export type { FieldState, FieldConflict, ClassBMergeResult } from './class-b-merge.service';
