import { describe, it, expect } from 'vitest';
import { Identifier } from './identifier';

describe('Identifier Value Object', () => {
  it('generates a valid UUIDv7 format', () => {
    const id = Identifier.generate();
    expect(Identifier.isValid(id)).toBe(true);
    // UUIDv7 has '7' at the start of the 3rd group
    expect(id.split('-')[2][0]).toBe('7');
  });

  it('generates unique IDs', () => {
    const id1 = Identifier.generate();
    const id2 = Identifier.generate();
    expect(id1).not.toBe(id2);
  });

  it('is chronologically sortable (later ID > earlier ID lexicographically)', async () => {
    const id1 = Identifier.generate();
    // sleep for a brief millisecond to ensure different timestamp clock tick
    await new Promise((resolve) => setTimeout(resolve, 5));
    const id2 = Identifier.generate();
    expect(id2 > id1).toBe(true);
  });
});
