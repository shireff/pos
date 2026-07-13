import { describe, it, expect } from 'vitest';
import { BackupHealthMonitor, STALE_THRESHOLD_HOURS } from './backup-health-monitor';

describe('BackupHealthMonitor', () => {
  it('reports none when there is no backup', () => {
    const health = BackupHealthMonitor.evaluate(null);
    expect(health.status).toBe('none');
    expect(health.lastBackupAt).toBeNull();
  });

  it('reports healthy within the stale window', () => {
    const health = BackupHealthMonitor.evaluate(new Date(Date.now() - 60 * 60 * 1000).toISOString());
    expect(health.status).toBe('healthy');
  });

  it('reports stale beyond the threshold', () => {
    const health = BackupHealthMonitor.evaluate(
      new Date(Date.now() - (STALE_THRESHOLD_HOURS + 1) * 60 * 60 * 1000).toISOString(),
    );
    expect(health.status).toBe('stale');
  });
});
