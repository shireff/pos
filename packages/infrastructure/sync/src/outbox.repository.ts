import { Db, Collection } from 'mongodb';
import { SyncEvent } from '@packages/domain-sync';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { OutboxStore } from '@packages/application-sync';

interface OutboxDoc {
  _id: string;
  event_id: string;
  event_type: string;
  payload: unknown;
  company_id: string;
  device_id: string;
  status: 'pending' | 'sent' | 'acknowledged';
  hlc_timestamp: string;
  created_at: Date;
}

/**
 * MongoDB-backed OutboxStore. Mirrors the 012_sync_schema migration: each
 * SyncEvent is persisted as a document so it survives crashes and restarts.
 */
export class MongoOutboxRepository implements OutboxStore {
  private readonly collection: Collection<OutboxDoc>;

  public constructor(db: Db, collectionName = 'sync_outbox') {
    this.collection = db.collection<OutboxDoc>(collectionName);
  }

  private static toDoc(event: SyncEvent): OutboxDoc {
    return {
      _id: event.eventId,
      event_id: event.eventId,
      event_type: event.eventType,
      payload: event.payload,
      company_id: event.companyId,
      device_id: event.deviceId,
      status: event.status,
      hlc_timestamp: event.hlcTimestamp.toString(),
      created_at: new Date(event.occurredAt),
    };
  }

  private static toEvent(doc: OutboxDoc): SyncEvent {
    return SyncEvent.reconstitute(
      {
        eventId: doc.event_id,
        eventType: doc.event_type,
        payload: doc.payload,
        hlcTimestamp: HybridLogicalClock.parse(doc.hlc_timestamp),
        deviceId: doc.device_id,
        companyId: doc.company_id,
        occurredAt: doc.created_at.toISOString(),
      },
      doc.status,
    );
  }

  public async append(event: SyncEvent): Promise<void> {
    await this.collection.insertOne(MongoOutboxRepository.toDoc(event));
  }

  public async getPending(deviceId: string): Promise<SyncEvent[]> {
    const docs = await this.collection
      .find({ device_id: deviceId, status: 'pending' })
      .sort({ created_at: 1 })
      .toArray();
    return docs.map(MongoOutboxRepository.toEvent);
  }

  public async markSent(eventId: string): Promise<void> {
    await this.collection.updateOne({ event_id: eventId }, { $set: { status: 'sent' } });
  }

  public async markAcknowledged(eventId: string): Promise<void> {
    await this.collection.updateOne(
      { event_id: eventId },
      { $set: { status: 'acknowledged' } },
    );
  }

  public async countPending(companyId: string): Promise<number> {
    return this.collection.countDocuments({ company_id: companyId, status: 'pending' });
  }

  public async lastSyncedAt(companyId: string): Promise<Date | null> {
    const doc = await this.collection.findOne(
      { company_id: companyId, status: 'acknowledged' },
      { sort: { created_at: -1 } },
    );
    return doc ? doc.created_at : null;
  }
}
