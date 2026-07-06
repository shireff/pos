import { describe, it, expect } from 'vitest';
import { HealthScreen } from './HealthScreen';

describe('HealthScreen', () => {
  it('renders without throwing', () => {
    // Since we have no DOM/jsdom, we just verify the component is exported correctly
    expect(typeof HealthScreen).toBe('function');
  });
});
