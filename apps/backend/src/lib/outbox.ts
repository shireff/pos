/**
 * Outbox Writer — inserts events into sync_outbox for offline sync relay.
 *
 * hlc_timestamp uses HybridLogicalClock format "time:logical:nodeId"
 * enabling causal ordering during field-level HLC merge on sync.
 */
import { type Db } from 'mongodb';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { getMongoDb } from './cloud-db';
import { Identifier } from '@packages/shared-kernel';

export interface OutboxEventInput {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
    /** Originating device. Falls back to "server" for server-initiated writes. */
    deviceId?: string;
}

/**
 * Writes a single outbox entry with an HLC timestamp.
 * Accepts an optional Db instance to participate in the caller's session.
 */
export async function writeOutboxEvent(
    input: OutboxEventInput,
    db?: Db,
): Promise<void> {
    const database = db ?? (await getMongoDb());
    const hlc = HybridLogicalClock.generateInitial(input.deviceId ?? 'server').advance();

    // Use a typed document interface to avoid ObjectId constraint on _id.
    const doc = {
        _id: Identifier.generate(),
        aggregate_type: input.aggregateType,
        aggregate_id: input.aggregateId,
        event_type: input.eventType,
        event_payload_json: JSON.stringify(input.payload),
        hlc_timestamp: hlc.toString(),
        created_at: new Date(),
        device_id: input.deviceId ?? 'server',
    };

    await database
        .collection<typeof doc>('sync_outbox')
        .insertOne(doc as unknown as typeof doc & { _id: string });
}

/** Builds an OutboxEventInput for a category mutation. */
export function categoryOutboxEvent(
    eventType: 'CategoryCreated' | 'CategoryUpdated' | 'CategoryDeleted' | 'CategoryMoved',
    categoryId: string,
    payload: Record<string, unknown>,
    deviceId?: string,
): OutboxEventInput {
    return {
        aggregateType: 'Category',
        aggregateId: categoryId,
        eventType,
        payload,
        deviceId,
    };
}

/** Builds an OutboxEventInput for a unit mutation. */
export function unitOutboxEvent(
    eventType: 'UnitCreated' | 'UnitUpdated',
    unitId: string,
    payload: Record<string, unknown>,
    deviceId?: string,
): OutboxEventInput {
    return {
        aggregateType: 'Unit',
        aggregateId: unitId,
        eventType,
        payload,
        deviceId,
    };
}
