import { Db } from 'mongodb';
import { FieldState } from '@packages/domain-sync';
import { ReplicaStore } from '@packages/application-sync';

/**
 * MongoReplicaStore applies resolved field values back to the real entity
 * collections. Used by the conflict-resolution endpoint so a resolved winner
 * is written through to the document that owns the conflicting field.
 */
export class MongoReplicaStore implements ReplicaStore {
  public constructor(private readonly db: Db) {}

  public async applyClassA(): Promise<void> {
    // Class A is event-sourced; the projection is maintained by the inbox
    // processor, so no inline mutation is required here.
  }

  public async getFieldStates(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, FieldState>> {
    const coll = this.db.collection(entityType);
    const doc = await coll.findOne({ _id: entityId } as any, { projection: { _id: 0 } });
    const result: Record<string, FieldState> = {};
    const serverHlc = { time: 0, logical: 0, nodeId: 'server' } as unknown as FieldState['hlc'];
    if (doc) {
      for (const [field, value] of Object.entries(doc)) {
        result[field] = { value, hlc: serverHlc };
      }
    }
    return result;
  }

  public async putFieldStates(
    entityType: string,
    entityId: string,
    states: Record<string, FieldState>,
  ): Promise<void> {
    const set: Record<string, unknown> = {};
    for (const [field, state] of Object.entries(states)) {
      set[field] = state.value;
    }
    const coll = this.db.collection(entityType);
    await coll.updateOne({ _id: entityId } as any, { $set: set }, { upsert: false });
  }
}
