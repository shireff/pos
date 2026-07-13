/**
 * BackupScheduler triggers daily backups at a company-configurable local time
 * (default 02:00), and supports manual on-demand backup triggers.
 *
 * The scheduler delegates actual backup creation to a provided callback,
 * keeping it decoupled from the Adapter implementations.
 */
export interface DailySchedule {
  hour: number; // 0-23
  minute: number; // 0-59
}

const DEFAULT_DAILY: DailySchedule = { hour: 2, minute: 0 };
const DAY_MS = 86_400_000;

export class BackupScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onBackup: () => Promise<void>;
  private readonly daily: DailySchedule;

  /**
   * @param onBackup  — async function called when a backup should run
   * @param daily     — local time to run the daily backup (default 02:00)
   */
  public constructor(onBackup: () => Promise<void>, daily: DailySchedule = DEFAULT_DAILY) {
    this.onBackup = onBackup;
    this.daily = daily;
  }

  /**
   * Starts the scheduler. Schedules the first run at the next occurrence of the
   * configured daily time, then repeats every 24h.
   */
  public start(): void {
    if (this.timer) return;
    const delay = this.computeDelayToNextRun();
    this.timer = setTimeout(() => {
      void this.runAndReschedule();
    }, delay);
  }

  /**
   * Stops the periodic scheduler.
   */
  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Manually triggers a backup immediately (outside of scheduled interval).
   */
  public async triggerNow(): Promise<void> {
    await this.onBackup();
  }

  public isRunning(): boolean {
    return this.timer !== null;
  }

  private async runAndReschedule(): Promise<void> {
    try {
      await this.onBackup();
    } finally {
      this.timer = setTimeout(() => {
        void this.runAndReschedule();
      }, DAY_MS);
    }
  }

  private computeDelayToNextRun(): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(this.daily.hour, this.daily.minute, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setTime(next.getTime() + DAY_MS);
    }
    return next.getTime() - now.getTime();
  }
}
