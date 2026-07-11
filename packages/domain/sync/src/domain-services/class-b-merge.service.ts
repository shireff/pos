import { HybridLogicalClock } from '@packages/shared-kernel';
import { HlcConcurrentDetector } from './hlc-concurrent-detector.service';

export interface FieldState {
  value: unknown;
  hlc: HybridLogicalClock;
}

export interface FieldConflict {
  entityType: string;
  entityId: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localHlc: HybridLogicalClock;
  remoteHlc: HybridLogicalClock;
}

export interface ClassBMergeResult {
  /** The merged document: every field with its winning field-state. */
  merged: Record<string, FieldState>;
  /** Fields that could not be auto-merged (concurrent edits with divergent values). */
  conflicts: FieldConflict[];
}

/**
 * ClassBMergeService implements the field-level Hybrid Logical Clock merge
 * strategy for Class B (mutable header) entities.
 *
 * For each field the higher-causality HLC wins:
 *  - remote HLC causally after local  -> remote value is applied (it saw local)
 *  - local HLC causally after remote  -> local value is kept
 *  - equal causal position, same node -> same event, idempotent (no change)
 *  - equal causal position, diff node -> concurrent edit; if values differ a
 *    SyncConflict is produced, otherwise the shared value is kept.
 */
export class ClassBMergeService {
  public static merge(
    entityType: string,
    entityId: string,
    current: Record<string, FieldState>,
    incoming: Record<string, FieldState>,
  ): ClassBMergeResult {
    const merged: Record<string, FieldState> = { ...current };
    const conflicts: FieldConflict[] = [];

    for (const [field, remote] of Object.entries(incoming)) {
      const local = current[field];

      if (!local) {
        merged[field] = remote;
        continue;
      }

      const remoteAfter = HlcConcurrentDetector.isCausallyAfter(remote.hlc, local.hlc);
      const localAfter = HlcConcurrentDetector.isCausallyAfter(local.hlc, remote.hlc);

      if (remoteAfter) {
        merged[field] = remote;
        continue;
      }

      if (localAfter) {
        merged[field] = local;
        continue;
      }

      // Equal causal position. Same event → idempotent. Concurrent → conflict.
      if (HlcConcurrentDetector.isSameEvent(remote.hlc, local.hlc)) {
        merged[field] = local;
        continue;
      }

      if (JSON.stringify(local.value) === JSON.stringify(remote.value)) {
        merged[field] = local; // concurrent but identical value — converge silently
        continue;
      }

      conflicts.push({
        entityType,
        entityId,
        field,
        localValue: local.value,
        remoteValue: remote.value,
        localHlc: local.hlc,
        remoteHlc: remote.hlc,
      });
      merged[field] = local; // keep local until a resolution is applied
    }

    return { merged, conflicts };
  }

  /**
   * Applies a resolved winner back onto a merged document for a single field.
   * Returns a new document with the chosen value and the winner's HLC.
   */
  public static applyResolution(
    merged: Record<string, FieldState>,
    field: string,
    winner: 'local' | 'remote',
    conflict: FieldConflict,
  ): Record<string, FieldState> {
    const chosenHlc = winner === 'local' ? conflict.localHlc : conflict.remoteHlc;
    const chosenValue = winner === 'local' ? conflict.localValue : conflict.remoteValue;
    return {
      ...merged,
      [field]: { value: chosenValue, hlc: chosenHlc },
    };
  }
}
