import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { ClassBMergeService } from './class-b-merge.service';

const hlc = (time: number, logical: number, nodeId: string) =>
  new HybridLogicalClock(time, logical, nodeId);

describe('ClassBMergeService', () => {
  it('applies different fields from both sides with no conflict (BR-SYN-004)', () => {
    const current = {
      price: { value: 100, hlc: hlc(10, 0, 'A') },
    };
    const incoming = {
      description: { value: 'updated', hlc: hlc(11, 0, 'B') },
    };
    const { merged, conflicts } = ClassBMergeService.merge('product', 'p1', current, incoming);
    expect(conflicts).toHaveLength(0);
    expect(merged.price.value).toBe(100);
    expect(merged.description.value).toBe('updated');
  });

  it('queues a conflict when the same field is edited concurrently (BR-SYN-005)', () => {
    const current = {
      price: { value: 100, hlc: hlc(10, 0, 'A') },
    };
    const incoming = {
      price: { value: 120, hlc: hlc(10, 0, 'B') },
    };
    const { merged, conflicts } = ClassBMergeService.merge('product', 'p1', current, incoming);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].field).toBe('price');
    expect(conflicts[0].localValue).toBe(100);
    expect(conflicts[0].remoteValue).toBe(120);
  });

  it('auto-applies the later (causally newer) value without conflict', () => {
    const current = {
      price: { value: 100, hlc: hlc(10, 0, 'A') },
    };
    const incoming = {
      price: { value: 120, hlc: hlc(12, 0, 'B') },
    };
    const { merged, conflicts } = ClassBMergeService.merge('product', 'p1', current, incoming);
    expect(conflicts).toHaveLength(0);
    expect(merged.price.value).toBe(120);
  });

  it('treats replay of the same event (same node) as idempotent', () => {
    const current = {
      price: { value: 100, hlc: hlc(10, 0, 'A') },
    };
    const incoming = {
      price: { value: 100, hlc: hlc(10, 0, 'A') },
    };
    const { merged, conflicts } = ClassBMergeService.merge('product', 'p1', current, incoming);
    expect(conflicts).toHaveLength(0);
    expect(merged.price.value).toBe(100);
  });

  it('converges silently when concurrent edits agree on the value', () => {
    const current = {
      price: { value: 100, hlc: hlc(10, 0, 'A') },
    };
    const incoming = {
      price: { value: 100, hlc: hlc(10, 0, 'B') },
    };
    const { conflicts } = ClassBMergeService.merge('product', 'p1', current, incoming);
    expect(conflicts).toHaveLength(0);
  });

  it('applies a resolution winner back to the document', () => {
    const current = { price: { value: 100, hlc: hlc(10, 0, 'A') } };
    const incoming = { price: { value: 120, hlc: hlc(10, 0, 'B') } };
    const { merged, conflicts } = ClassBMergeService.merge('product', 'p1', current, incoming);
    const resolved = ClassBMergeService.applyResolution(merged, 'price', 'remote', conflicts[0]);
    expect(resolved.price.value).toBe(120);
  });
});
