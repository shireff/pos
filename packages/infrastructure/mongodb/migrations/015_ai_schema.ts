import { Db } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

type Schema = Record<string, unknown>;
type IndexDefinition = { key: Record<string, number>; options?: Record<string, unknown> };

function loadSchema(name: string): Schema {
  const here = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(readFileSync(join(here, '..', 'schemas', name), 'utf-8')) as Schema;
}

const AI_PREDICTIONS_SCHEMA = loadSchema('ai_predictions.schema.json');
const AI_ANOMALIES_SCHEMA = loadSchema('ai_anomalies.schema.json');
const AI_HEALTH_SCORE_SNAPSHOTS_SCHEMA = loadSchema('ai_health_score_snapshots.schema.json');
const AI_INSIGHT_FEEDBACK_SCHEMA = loadSchema('ai_insight_feedback.schema.json');

/**
 * Migration 015 — AI schema (Phase 15).
 *
 * Creates AI insight collections:
 *  - ai_predictions: stores deterministic predictions with LLM narrative
 *  - ai_anomalies: stores detected anomalies with Z-scores
 *  - ai_health_score_snapshots: stores composite health scores
 *  - ai_insight_feedback: stores accept/reject/modify feedback per insight
 */
const COLLECTIONS: Array<{ name: string; schema: Schema; indexes?: IndexDefinition[] }> = [
  {
    name: 'ai_predictions',
    schema: AI_PREDICTIONS_SCHEMA,
    indexes: [
      { key: { companyId: 1, insightType: 1, generatedAt: -1 } },
      { key: { companyId: 1, branchId: 1, generatedAt: -1 } },
      { key: { validUntil: 1 }, options: { expireAfterSeconds: 0 } },
    ],
  },
  {
    name: 'ai_anomalies',
    schema: AI_ANOMALIES_SCHEMA,
    indexes: [
      { key: { companyId: 1, anomalyType: 1, generatedAt: -1 } },
      { key: { companyId: 1, branchId: 1, generatedAt: -1 } },
    ],
  },
  {
    name: 'ai_health_score_snapshots',
    schema: AI_HEALTH_SCORE_SNAPSHOTS_SCHEMA,
    indexes: [
      { key: { companyId: 1, generatedAt: -1 } },
      { key: { companyId: 1, branchId: 1, generatedAt: -1 } },
    ],
  },
  {
    name: 'ai_insight_feedback',
    schema: AI_INSIGHT_FEEDBACK_SCHEMA,
    indexes: [
      { key: { insightId: 1, occurredAt: -1 } },
      { key: { actingUserId: 1, occurredAt: -1 } },
    ],
  },
];

export const up = async (db: Db): Promise<void> => {
  for (const { name, schema, indexes } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) {
      await db.createCollection(name, {
        validator: { $jsonSchema: schema },
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    } else {
      try {
        await db.command({
          collMod: name,
          validator: { $jsonSchema: schema },
          validationLevel: 'moderate',
          validationAction: 'error',
        });
      } catch {
        // collection already aligned
      }
    }
    for (const idx of indexes ?? []) {
      try {
        await db.collection(name).createIndex(idx.key, idx.options);
      } catch {
        // index may already exist
      }
    }
  }
};

export const down = async (db: Db): Promise<void> => {
  for (const { name } of COLLECTIONS) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) continue;
    try {
      await db.command({ collMod: name, validator: {}, validationLevel: 'off' });
    } catch {
      // ignore
    }
    await db.dropCollection(name).catch(() => undefined);
  }
};
