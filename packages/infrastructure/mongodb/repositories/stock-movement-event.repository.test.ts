import { describe, it, expect } from 'vitest';
import { MongoStockMovementEventRepository } from './index';

describe('MongoStockMovementEventRepository (append-only contract)', () => {
  const repo = new MongoStockMovementEventRepository();

  it('rejects UPDATE — stock movement events are append-only', async () => {
    await expect(repo.update('event-1', { quantity: 5 })).rejects.toThrow(/append-only/i);
  });

  it('rejects DELETE — stock movement events are append-only', async () => {
    await expect(repo.delete('event-1')).rejects.toThrow(/append-only/i);
  });
});
