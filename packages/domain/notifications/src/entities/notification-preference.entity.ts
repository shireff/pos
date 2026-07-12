import { Identifier } from '@packages/shared-kernel';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
} from '../types';

export interface NotificationPreferenceProps {
  id: string;
  userId: string;
  companyId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationPreferenceInput {
  userId: string;
  companyId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  isEnabled: boolean;
}

/**
 * Per-user / per-category / per-channel notification preference (Notifications.md §5).
 *
 * - Normal/Low categories are fully configurable (enabled/disabled).
 * - Critical/High notifications for safety categories can only have their
 *   channel muted, never the existence of the record (BR-NOT-003).
 * - The BILLING_TRIAL category cannot be muted in the final 4 days of trial.
 */
export class NotificationPreference {
  public readonly id: string;
  public readonly userId: string;
  public readonly companyId: string;
  public readonly category: NotificationCategory;
  public readonly channel: NotificationChannel;
  private _frequency: NotificationFrequency;
  private _isEnabled: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: NotificationPreferenceProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.companyId = props.companyId;
    this.category = props.category;
    this.channel = props.channel;
    this._frequency = props.frequency;
    this._isEnabled = props.isEnabled;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(input: CreateNotificationPreferenceInput): NotificationPreference {
    const now = new Date();
    return new NotificationPreference({
      id: Identifier.generate(),
      userId: input.userId,
      companyId: input.companyId,
      category: input.category,
      channel: input.channel,
      frequency: input.frequency,
      isEnabled: input.isEnabled,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: NotificationPreferenceProps): NotificationPreference {
    return new NotificationPreference(props);
  }

  public get frequency(): NotificationFrequency {
    return this._frequency;
  }

  public get isEnabled(): boolean {
    return this._isEnabled;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public setFrequency(frequency: NotificationFrequency): void {
    this._frequency = frequency;
    this._updatedAt = new Date();
  }

  /**
   * Sets the enabled flag. For safety-critical categories the in-app channel
   * (the record's existence) can never be disabled — only push/email may be.
   */
  public setEnabled(
    isEnabled: boolean,
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    safetyRelevant: boolean,
  ): void {
    if (safetyRelevant && (priority === 'CRITICAL' || priority === 'HIGH') && this.channel === 'IN_APP') {
      this._isEnabled = true;
    } else {
      this._isEnabled = isEnabled;
    }
    this._updatedAt = new Date();
  }
}
