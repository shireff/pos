import { Subscription } from '@packages/domain-billing';
import { SubscriptionPlan, LicenseKey } from '@packages/domain-billing';

export interface SubscriptionRepository {
  findByCompany(companyId: string): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<void>;
  findTrialsEndingBefore(asOfIso: string): Promise<Subscription[]>;
}

export interface SubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlan | null>;
  findByCode(code: string): Promise<SubscriptionPlan | null>;
  findAllActive(): Promise<SubscriptionPlan[]>;
}

export interface LicenseKeyRepository {
  findByCompany(companyId: string): Promise<LicenseKey | null>;
  save(key: LicenseKey): Promise<void>;
}

/** Port: NotificationDispatcher — triggers trial/billing notifications */
export interface TrialNotificationDispatcher {
  dispatchTrialCountdown(companyId: string, daysRemaining: number): Promise<void>;
  dispatchTrialExpired(companyId: string): Promise<void>;
  dispatchSubscriptionActivated(companyId: string, planCode: string): Promise<void>;
}
