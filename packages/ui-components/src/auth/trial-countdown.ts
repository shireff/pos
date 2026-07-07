export interface TrialCountdownState {
  isVisible: boolean;
  isCritical: boolean;
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
}

export function getTrialCountdownState(
  trialEndsAt: Date,
  now: Date = new Date(),
): TrialCountdownState {
  const remainingMs = trialEndsAt.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return {
      isVisible: false,
      isCritical: false,
      isExpired: true,
      daysRemaining: 0,
      hoursRemaining: 0,
    };
  }

  const daysRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
  const hoursRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

  return {
    isVisible: daysRemaining <= 10,
    isCritical: daysRemaining <= 8 || hoursRemaining <= 72,
    isExpired: false,
    daysRemaining,
    hoursRemaining,
  };
}
