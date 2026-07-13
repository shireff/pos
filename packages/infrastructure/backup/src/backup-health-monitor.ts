export type BackupHealthStatus = 'healthy' | 'stale' | 'none';

export interface BackupHealth {
  status: BackupHealthStatus;
  lastBackupAt: string | null;
  /** Hours since the last successful backup */
  hoursSinceLastBackup: number | null;
  message: string;
}

export const STALE_THRESHOLD_HOURS = 25;

/**
 * BackupHealthMonitor — compact status of the most recent backup.
 * Turns "stale" (red) when the last backup is older than 25 hours.
 */
export class BackupHealthMonitor {
  public static evaluate(lastBackupAt: string | null, now: Date = new Date()): BackupHealth {
    if (!lastBackupAt) {
      return {
        status: 'none',
        lastBackupAt: null,
        hoursSinceLastBackup: null,
        message: 'لا توجد نسخة احتياطية بعد. يرجى إنشاء نسخة الآن.',
      };
    }

    const hours = (now.getTime() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60);
    if (hours > STALE_THRESHOLD_HOURS) {
      return {
        status: 'stale',
        lastBackupAt,
        hoursSinceLastBackup: Math.round(hours),
        message: 'آخر نسخة احتياطية قديمة. يرجى تشغيل نسخة جديدة.',
      };
    }

    return {
      status: 'healthy',
      lastBackupAt,
      hoursSinceLastBackup: Math.round(hours),
      message: 'آخر نسخة احتياطية حديثة.',
    };
  }
}
