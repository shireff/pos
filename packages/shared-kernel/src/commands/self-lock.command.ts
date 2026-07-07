/**
 * SelfLockCommand — Client-side offline trial expiry self-lock.
 *
 * When a device is offline and the locally-cached trialEndsAt timestamp
 * has passed, the client locks itself and shows the paywall screen
 * without waiting for server confirmation.
 *
 * Implements the "strong offline mode" behavior from UI_UX.md §2.7:
 * The device knows its current entitlement from the last sync and enforces
 * the write-lock locally until it can reconnect and pull the latest status.
 */

export interface CachedSubscriptionState {
  trialEndsAt: string | null;
  status: 'trialing' | 'active' | 'suspended' | 'locked';
  planId: string | null;
}

export interface SelfLockResult {
  isLocked: boolean;
  lockReason: 'trial_expired' | 'suspended' | null;
  remainingMs: number | null;
}

/**
 * Checks if the device should self-lock based on cached subscription state.
 * Called on app startup and after sync to determine UI state.
 *
 * Returns:
 * - isLocked: true if the device is in a write-locked state
 * - lockReason: why it's locked (trial_expired or suspended)
 * - remainingMs: milliseconds until trial end (null if already expired)
 */
export function checkSelfLock(
  cachedState: CachedSubscriptionState | null,
  now: Date = new Date(),
): SelfLockResult {
  if (!cachedState) {
    // No cached state — assume online-only mode, not locked
    return { isLocked: false, lockReason: null, remainingMs: null };
  }

  // Already suspended by platform admin — always locked
  if (cachedState.status === 'suspended') {
    return { isLocked: true, lockReason: 'suspended', remainingMs: null };
  }

  // Trial expired locally
  if (
    cachedState.status === 'trialing' &&
    cachedState.trialEndsAt &&
    new Date(cachedState.trialEndsAt) <= now
  ) {
    return { isLocked: true, lockReason: 'trial_expired', remainingMs: 0 };
  }

  // Active or within trial — not locked
  if (cachedState.status === 'active' || cachedState.status === 'trialing') {
    const remainingMs = cachedState.trialEndsAt
      ? new Date(cachedState.trialEndsAt).getTime() - now.getTime()
      : null;
    return { isLocked: false, lockReason: null, remainingMs };
  }

  // Unknown or locked status — defer to server
  return { isLocked: false, lockReason: null, remainingMs: null };
}

/**
 * Determines if a user action should be blocked based on self-lock state.
 * Used by the client to reject write operations when offline and locked.
 *
 * Permits:
 * - All GET requests (read-only)
 * - Pull/sync operations (pull read-only, always allowed per API.md §4.9)
 *
 * Blocks:
 * - All POST/PATCH/DELETE (mutating operations)
 */
export function isActionBlocked(
  action: 'read' | 'write' | 'sync',
  lockResult: SelfLockResult,
): boolean {
  if (!lockResult.isLocked) return false;

  // Even when locked, pull and read operations always succeed (API.md §4.8, §4.9)
  if (action === 'read' || action === 'sync') return false;

  // Write operations are blocked when locked
  if (action === 'write') return true;

  return false;
}

/**
 * Formats the lock reason into user-facing message (for UI).
 */
export function getLockMessage(lockReason: string | null): string {
  switch (lockReason) {
    case 'trial_expired':
      return 'Your 14-day trial has ended. Choose a plan to continue.';
    case 'suspended':
      return 'Your account has been suspended. Contact support.';
    default:
      return 'Your account is temporarily locked. Try again later.';
  }
}
