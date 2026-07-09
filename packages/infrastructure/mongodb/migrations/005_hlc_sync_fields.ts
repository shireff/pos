/**
 * Migration 005 — HLC sync fields for categories and units collections.
 *
 * Adds hlc_timestamp (string, "time:logical:nodeId") to enable Class B
 * field-level HLC merge during offline sync.
 *
 * Also adds hlc_timestamp to sync_outbox so each outbox entry carries the
 * causal timestamp of the event that produced it.
 *
 * Existing documents are backfilled with an initial HLC derived from
 * their updated_at timestamp (logical=0, nodeId="server").
 */
import { Db } from 'mongodb';

const HLC_COLLECTIONS = ['categories', 'units'] as const;

/** Build an initial HLC string from a Date (or now) for backfill. */
function initialHlc(ts: Date | null | undefined): string {
    const time = ts instanceof Date && !isNaN(ts.getTime()) ? ts.getTime() : Date.now();
    return `${time}:0:server`;
}

export const up = async (db: Db): Promise<void> => {
    // 1. Add hlc_timestamp to categories and units — add field to JSON Schema validator
    //    and backfill all existing documents.
    for (const collectionName of HLC_COLLECTIONS) {
        const existing = await db.listCollections({ name: collectionName }).toArray();
        if (existing.length === 0) continue;

        // Relax validator to allow the new optional field (addFields approach).
        // We update each doc individually so we can compute per-doc HLC from its updated_at.
        try {
            await db.command({
                collMod: collectionName,
                validationLevel: 'off', // temporarily disable to allow schema migration
            });
        } catch {
            // older servers may not support collMod — continue anyway
        }

        // Backfill all documents that do not yet have hlc_timestamp.
        const cursor = db
            .collection<{ _id: string; updated_at?: Date; hlc_timestamp?: string }>(collectionName)
            .find({ hlc_timestamp: { $exists: false } });

        const bulk = db.collection(collectionName).initializeUnorderedBulkOp();
        let hasBulk = false;

        for await (const doc of cursor) {
            bulk.find({ _id: doc._id }).updateOne({
                $set: { hlc_timestamp: initialHlc(doc.updated_at) },
            });
            hasBulk = true;
        }

        if (hasBulk) {
            await bulk.execute();
        }

        // Re-enable validation with the updated schema that includes hlc_timestamp.
        const updatedSchema =
            collectionName === 'categories'
                ? categoriesSchemaWithHlc()
                : unitsSchemaWithHlc();

        try {
            await db.command({
                collMod: collectionName,
                validator: { $jsonSchema: updatedSchema },
                validationLevel: 'moderate',
                validationAction: 'error',
            });
        } catch {
            // ignore collMod failures on older servers
        }
    }

    // 2. Add hlc_timestamp to sync_outbox — backfill existing entries.
    const outboxExists = await db.listCollections({ name: 'sync_outbox' }).toArray();
    if (outboxExists.length > 0) {
        try {
            await db.command({ collMod: 'sync_outbox', validationLevel: 'off' });
        } catch { /* ignore */ }

        const outboxCursor = db
            .collection<{ _id: string; created_at?: Date; hlc_timestamp?: string }>('sync_outbox')
            .find({ hlc_timestamp: { $exists: false } });

        const outboxBulk = db.collection('sync_outbox').initializeUnorderedBulkOp();
        let hasOutboxBulk = false;

        for await (const doc of outboxCursor) {
            outboxBulk.find({ _id: doc._id }).updateOne({
                $set: { hlc_timestamp: initialHlc(doc.created_at) },
            });
            hasOutboxBulk = true;
        }

        if (hasOutboxBulk) {
            await outboxBulk.execute();
        }

        try {
            await db.command({
                collMod: 'sync_outbox',
                validator: { $jsonSchema: outboxSchemaWithHlc() },
                validationLevel: 'moderate',
                validationAction: 'error',
            });
        } catch { /* ignore */ }
    }
};

export const down = async (db: Db): Promise<void> => {
    // Remove hlc_timestamp field from all affected documents.
    for (const collectionName of [...HLC_COLLECTIONS, 'sync_outbox'] as const) {
        const exists = await db.listCollections({ name: collectionName }).toArray();
        if (exists.length === 0) continue;

        try {
            await db.command({ collMod: collectionName, validationLevel: 'off' });
        } catch { /* ignore */ }

        await db.collection(collectionName).updateMany(
            { hlc_timestamp: { $exists: true } },
            { $unset: { hlc_timestamp: '' } },
        );
    }
};

// ─── Schema helpers ───────────────────────────────────────────────────────────

function categoriesSchemaWithHlc(): object {
    return {
        bsonType: 'object',
        required: [
            '_id',
            'company_id',
            'name',
            'level',
            'path',
            'sort_order',
            'is_deleted',
            'created_at',
            'updated_at',
        ],
        properties: {
            _id: { bsonType: 'string' },
            company_id: { bsonType: 'string' },
            name: {
                bsonType: 'object',
                required: ['ar'],
                properties: {
                    ar: { bsonType: 'string', minLength: 1 },
                    en: { bsonType: 'string' },
                },
                additionalProperties: false,
            },
            parent_id: { bsonType: ['string', 'null'] },
            level: { bsonType: 'int', minimum: 0 },
            path: { bsonType: 'string', minLength: 1 },
            sort_order: { bsonType: 'int', minimum: 0 },
            is_deleted: { bsonType: 'bool' },
            sync_version: { bsonType: 'int' },
            hlc_timestamp: { bsonType: 'string' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
        },
        additionalProperties: false,
    };
}

function unitsSchemaWithHlc(): object {
    return {
        bsonType: 'object',
        required: [
            '_id',
            'company_id',
            'name',
            'abbreviation',
            'is_base_unit',
            'conversion_factor_to_base',
            'is_deleted',
            'created_at',
            'updated_at',
        ],
        properties: {
            _id: { bsonType: 'string' },
            company_id: { bsonType: 'string' },
            name: {
                bsonType: 'object',
                required: ['ar'],
                properties: {
                    ar: { bsonType: 'string', minLength: 1 },
                    en: { bsonType: 'string' },
                },
                additionalProperties: false,
            },
            abbreviation: { bsonType: 'string', minLength: 1 },
            is_base_unit: { bsonType: 'bool' },
            conversion_factor_to_base: { bsonType: 'double', minimum: 0, exclusiveMinimum: true },
            is_deleted: { bsonType: 'bool' },
            sync_version: { bsonType: 'int' },
            hlc_timestamp: { bsonType: 'string' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
        },
        additionalProperties: false,
    };
}

function outboxSchemaWithHlc(): object {
    return {
        bsonType: 'object',
        required: [
            '_id',
            'aggregate_type',
            'aggregate_id',
            'event_type',
            'event_payload_json',
            'hlc_timestamp',
            'created_at',
            'device_id',
        ],
        properties: {
            _id: { bsonType: 'string' },
            aggregate_type: { bsonType: 'string' },
            aggregate_id: { bsonType: 'string' },
            event_type: { bsonType: 'string' },
            event_payload_json: { bsonType: 'string' },
            hlc_timestamp: { bsonType: 'string' },
            created_at: { bsonType: 'date' },
            sent_at: { bsonType: 'date' },
            device_id: { bsonType: 'string' },
        },
        additionalProperties: false,
    };
}
