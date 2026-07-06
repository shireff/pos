/**
 * BackupScheduler triggers daily backups via a cron-style interval,
 * and supports manual on-demand backup triggers.
 *
 * The scheduler delegate actual backup creation to a provided callback,
 * keeping it decoupled from the Adapter implementations.
 */
export class BackupScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private readonly onBackup: () => Promise<void>;

  /**
   * @param onBackup     — async function called when a backup should run
   * @param intervalMs   — how frequently to auto-run (default: 24 hours = 86_400_000 ms)
   */
  public constructor(onBackup: () => Promise<void>, intervalMs: number = 86_400_000) {
    this.onBackup = onBackup;
    this.intervalMs = intervalMs;
  }

  /**
   * Starts the scheduler. Fires the first backup immediately, then repeats on interval.
   */
  public start(): void {
    if (this.timer) return;
    void this.onBackup();
    this.timer = setInterval(() => {
      void this.onBackup();
    }, this.intervalMs);
  }

  /**
   * Stops the periodic scheduler.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
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
}
