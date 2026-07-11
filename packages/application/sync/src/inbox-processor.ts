import { SyncConflict, ClassBMergeService, FieldState, ClassAEventType } from '@packages/domain-sync';
import {
  InboxStore,
  IdempotencyStore,
  ReplicaStore,
  ConflictStore,
} from './ports/engine.ports';
import { classifyEvent } from './sync-classifier';
import { recordConflict } from './conflict-recorder';

export interface ClassBPayload {
  entityType: string;
  entityId: string;
  fields: Record<string, FieldState>;
}

export interface InboxProcessorDeps {
  inbox: InboxStore;
  idempotency: IdempotencyStore;
  replica: ReplicaStore;
  conflicts: ConflictStore;
  /** Optional hook for emitted domain events (e.g. SyncConflictDetected). */
  onConflictDetected?: (conflict: SyncConflict) => void;
}

export interface ProcessResult {
  applied: number;
  conflicts: number;
  skipped: number;
}

/**
 * InboxProcessor is the background worker that applies queued inbound events to
 * the local replica. It is idempotent on `eventId` (a replayed already-applied
 * event is a no-op) and selects the merge strategy by sync class:
 *  - Class A: commutative signed-quantity / append-only — never conflicts.
 *  - Class B: per-field HLC merge — concurrent same-field edits produce a
 *    SyncConflict record via `recordConflict`.
 */
export class InboxProcessor {
  private readonly inbox: InboxStore;
  private readonly idempotency: IdempotencyStore;
  private readonly replica: ReplicaStore;
  private readonly conflicts: ConflictStore;
  private readonly onConflictDetected?: (conflict: SyncConflict) => void;

  public constructor(deps: InboxProcessorDeps) {
    this.inbox = deps.inbox;
    this.idempotency = deps.idempotency;
    this.replica = deps.replica;
    this.conflicts = deps.conflicts;
    this.onConflictDetected = deps.onConflictDetected;
  }

  public async processPending(companyId: string): Promise<ProcessResult> {
    const pending = await this.inbox.getPending();
    let applied = 0;
    let conflicts = 0;
    let skipped = 0;

    for (const event of pending) {
      if (await this.idempotency.isApplied(event.eventId)) {
        await this.inbox.markApplied(event.eventId);
        skipped++;
        continue;
      }

      if (classifyEvent(event) === 'A') {
        await this.replica.applyClassA([
          {
            eventId: event.eventId,
            entityId: (event.payload as { entityId: string }).entityId,
            eventType: (event.payload as { eventType: ClassAEventType }).eventType,
            signedQuantity: (event.payload as { signedQuantity: number }).signedQuantity,
          },
        ]);
      } else {
        const payload = event.payload as unknown as ClassBPayload;
        const current = await this.replica.getFieldStates(payload.entityType, payload.entityId);
        const { merged, conflicts: detected } = ClassBMergeService.merge(
          payload.entityType,
          payload.entityId,
          current,
          payload.fields,
        );
        await this.replica.putFieldStates(payload.entityType, payload.entityId, merged);

        for (const fieldConflict of detected) {
          const conflict = await recordConflict(this.conflicts, companyId, fieldConflict);
          this.onConflictDetected?.(conflict);
          conflicts++;
        }
      }

      await this.idempotency.markApplied(event.eventId);
      await this.inbox.markApplied(event.eventId);
      applied++;
    }

    return { applied, conflicts, skipped };
  }
}
