import { SyncConflict } from '@packages/domain-sync';
import { FieldConflict } from '@packages/domain-sync';
import { ConflictStore } from './ports/engine.ports';

/**
 * ConflictRecorder persists a detected Class B field conflict and returns the
 * domain SyncConflict entity. The caller (InboxProcessor) is responsible for
 * emitting the `SyncConflictDetected` domain event afterwards.
 */
export async function recordConflict(
  store: ConflictStore,
  companyId: string,
  field: FieldConflict,
): Promise<SyncConflict> {
  const conflict = SyncConflict.detect({
    companyId,
    entityType: field.entityType,
    entityId: field.entityId,
    field: field.field,
    localValue: field.localValue,
    remoteValue: field.remoteValue,
    localHlc: field.localHlc,
    remoteHlc: field.remoteHlc,
  });
  await store.save(conflict);
  return conflict;
}
