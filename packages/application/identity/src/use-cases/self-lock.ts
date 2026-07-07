/**
 * SelfLockCommand — client-side offline lock enforcement
 *
 * When a device reads subscription.trialEndsAt from last sync,
 * it compares to current time and self-locks locally if trial has expired.
 * This prevents write operations while offline even if the server hasn't yet notified.
 */

export interface SelfLockInput {
  cachedTrialEndsAt: string; // ISO datetime from last sync
  offlineModeFallbackLockMs?: number; // optional: if provided, device enters offline read-only after this many ms offline
}

export interface SelfLockOutput {
  isLocked: boolean;
  lockedAt: string | null;
  lockReason: 'trial_expired' | 'offline_ttl_exceeded' | null;
}

/**
 * SelfLockCommand runs locally on the device.
 * No backend communication. Pure timestamp comparison.
 */
export class SelfLock {
  public execute(input: SelfLockInput): SelfLockOutput {
    const now = new Date();
    const trialEndsAt = new Date(input.cachedTrialEndsAt);

    // Trial expired
    if (trialEndsAt < now) {
      return {
        isLocked: true,
        lockedAt: now.toISOString(),
        lockReason: 'trial_expired',
      };
    }

    // Not locked
    return {
      isLocked: false,
      lockedAt: null,
      lockReason: null,
    };
  }
}
