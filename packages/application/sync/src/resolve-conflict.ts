import { SyncConflict, ClassBMergeService } from '@packages/domain-sync';
import { ConflictStore, ReplicaStore } from './ports/engine.ports';

export type ConflictWinner = 'local' | 'remote' | 'merge';

export interface ResolveConflictDeps {
  conflicts: ConflictStore;
  replica: ReplicaStore;
}

/**
 * ConflictResolutionService applies a user's decision to a detected SyncConflict
 * and persists it (recording the resolution in the audit trail). For Class B
 * conflicts it also writes the winning value back into the local replica so the
 * device converges.
 */
export class ConflictResolutionService {
  public constructor(private readonly deps: ResolveConflictDeps) {}

  public async resolve(
    conflictId: string,
    winner: ConflictWinner,
    resolvedByUserId: string | null = null,
    mergedValue?: unknown,
  ): Promise<SyncConflict> {
    const conflict = await this.deps.conflicts.findById(conflictId);
    if (!conflict) throw new Error(`Conflict not found: ${conflictId}`);
    if (!conflict.isUnresolved) throw new Error(`Conflict ${conflictId} already resolved`);

    if (winner === 'local') conflict.resolveLocal(resolvedByUserId);
    else if (winner === 'remote') conflict.resolveRemote(resolvedByUserId);
    else conflict.resolveMerge(resolvedByUserId, mergedValue as unknown);

    await this.deps.conflicts.save(conflict);
    await this.applyToReplica(conflict, conflict.resolvedValue(winner, mergedValue));
    return conflict;
  }

  /** Resolve every unresolved conflict for an entity in a single action. */
  public async resolveAllForEntity(
    companyId: string,
    entityType: string,
    entityId: string,
    winner: ConflictWinner,
    resolvedByUserId: string | null = null,
  ): Promise<number> {
    const pending = await this.deps.conflicts.findPending(companyId);
    const forEntity = pending.filter(
      (c) => c.entityType === entityType && c.entityId === entityId,
    );
    for (const conflict of forEntity) {
      await this.resolve(conflict.id, winner, resolvedByUserId);
    }
    return forEntity.length;
  }

  private async applyToReplica(conflict: SyncConflict, value: unknown): Promise<void> {
    const current = await this.deps.replica.getFieldStates(conflict.entityType, conflict.entityId);
    let merged = current;
    if (conflict.status === 'resolved_merge') {
      merged = { ...current, [conflict.field]: { value, hlc: conflict.remoteHlc } };
    } else {
      const winner: 'local' | 'remote' =
        conflict.status === 'resolved_remote' ? 'remote' : 'local';
      merged = ClassBMergeService.applyResolution(current, conflict.field, winner, {
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        field: conflict.field,
        localValue: conflict.localValue,
        remoteValue: conflict.remoteValue,
        localHlc: conflict.localHlc,
        remoteHlc: conflict.remoteHlc,
      });
    }
    await this.deps.replica.putFieldStates(conflict.entityType, conflict.entityId, merged);
  }
}
