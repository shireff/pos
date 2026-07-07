export type SubscriptionStatus =
  'trialing' | 'active' | 'past_due' | 'locked' | 'suspended' | 'trial_expired' | 'cancelled';

export interface SubscriptionState {
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  planId: string | null;
  isReadOnlyLocked: boolean;
  isFullAccessOverride: boolean;
}

export type SubscriptionAction =
  | {
      type: 'subscription/set-state';
      payload: SubscriptionState;
    }
  | {
      type: 'subscription/reset';
    };

const initialState: SubscriptionState = {
  status: 'trialing',
  trialEndsAt: null,
  planId: null,
  isReadOnlyLocked: false,
  isFullAccessOverride: false,
};

export function subscriptionReducer(
  state: SubscriptionState = initialState,
  action: SubscriptionAction,
): SubscriptionState {
  switch (action.type) {
    case 'subscription/set-state':
      return {
        ...state,
        ...action.payload,
      };
    case 'subscription/reset':
      return initialState;
    default:
      return state;
  }
}

export function setSubscriptionState(payload: SubscriptionState): SubscriptionAction {
  return { type: 'subscription/set-state', payload };
}

export function resetSubscriptionState(): SubscriptionAction {
  return { type: 'subscription/reset' };
}
