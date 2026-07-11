import { Db, Collection } from 'mongodb';
import { SyncEvent } from '@packages/domain-sync';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { InboxStore } from '@packages/application-sync';

interface InboxDoc {
  _id: string;
  event_id: string;
  event_type: string;
  payload: unknown;
  company_id: string;
  source_device_id: string;
  status: 'pending' | 'applied' | 'conflict';
  hlc_timestamp: string;
  received_at: Date;
  applied_at?: Date;
}

/**
 * MongoDB-backed InboxStore. Inbound events are persisted before they are
 * applied so a crash mid-apply leaves the event available for the next pass.
 */
export class MongoInboxRepository implements InboxStore {
  private readonly collection: Collection<InboxDoc>;

  public constructor(db: Db, collectionName = 'sync_inbox') {
    this.collection = db.collection<InboxDoc>(collectionName);
  }

  private static toDoc(event: SyncEvent): InboxDoc {
    return {
      _id: event.eventId,
      event_id: event.eventId,
      event_type: event.eventType,
      payload: event.payload,
      company_id: event.companyId,
      source_device_id: event.deviceId,
      status: 'pending',
      hlc_timestamp: event.hlcTimestamp.toString(),
      received_at: new Date(),
    };
  }

  private static toEvent(doc: InboxDoc): SyncEvent {
    return SyncEvent.reconstitute(
      {
        eventId: doc.event_id,
        eventType: doc.event_type,
        payload: doc.payload,
        hlcTimestamp: HybridLogicalClock.parse(doc.hlc_timestamp),
        deviceId: doc.source_device_id,
        companyId: doc.company_id,
        occurredAt: doc.received_at.toISOString(),
      },
      'pending',
    );
  }

  public async append(event: SyncEvent): Promise<void> {
    await this.collection.insertOne(MongoInboxRepository.toDoc(event));
  }

  public async getPending(): Promise<SyncEvent[]> {
    const docs = await this.collection
      .find({ status: 'pending' })
      .sort({ received_at: 1 })
      .toArray();
    return docs.map(MongoInboxRepository.toEvent);
  }

  public async markApplied(eventId: string): Promise<void> {
    await this.collection.updateOne(
      { event_id: eventId },
      { $set: { status: 'applied', applied_at: new Date() } },
    );
  }

  public async markConflict(eventId: string): Promise<void> {
    await this.collection.updateOne({ event_id: eventId }, { $set: { status: 'conflict' } });
  }
}
