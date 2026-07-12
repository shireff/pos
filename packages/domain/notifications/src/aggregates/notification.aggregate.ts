import { Identifier } from '@packages/shared-kernel';
import {
  NotificationCategory,
  NotificationPriorityLevel,
} from '../types';
import { NotificationPriority } from '../value-objects/notification-priority.vo';

export interface NotificationProps {
  id: string;
  companyId: string;
  recipientUserId: string;
  triggerCode: string;
  category: NotificationCategory;
  priority: NotificationPriorityLevel;
  titleKey: string;
  bodyKey: string;
  title: string;
  body: string;
  vars: Record<string, string | number>;
  actionUrl?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput {
  companyId: string;
  recipientUserId: string;
  triggerCode: string;
  category: NotificationCategory;
  priority: NotificationPriorityLevel;
  titleKey: string;
  bodyKey: string;
  title: string;
  body: string;
  vars?: Record<string, string | number>;
  actionUrl?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}

/**
 * Notification aggregate — the in-app "source of truth" record. Every channel
 * delivery (push/email) references one of these; a channel failure never removes
 * the in-app record (BR-NOT-001 / Notifications.md §7).
 */
export class Notification {
  public readonly id: string;
  public readonly companyId: string;
  public readonly recipientUserId: string;
  public readonly triggerCode: string;
  public readonly category: NotificationCategory;
  public readonly priority: NotificationPriorityLevel;
  public readonly titleKey: string;
  public readonly bodyKey: string;
  public readonly title: string;
  public readonly body: string;
  public readonly vars: Record<string, string | number>;
  public readonly actionUrl: string | null;
  public readonly referenceType: string | null;
  public readonly referenceId: string | null;
  private _isRead: boolean;
  private _isDismissed: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: NotificationProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.recipientUserId = props.recipientUserId;
    this.triggerCode = props.triggerCode;
    this.category = props.category;
    this.priority = props.priority;
    this.titleKey = props.titleKey;
    this.bodyKey = props.bodyKey;
    this.title = props.title;
    this.body = props.body;
    this.vars = props.vars;
    this.actionUrl = props.actionUrl ?? null;
    this.referenceType = props.referenceType ?? null;
    this.referenceId = props.referenceId ?? null;
    this._isRead = props.isRead;
    this._isDismissed = props.isDismissed;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(input: CreateNotificationInput): Notification {
    const now = new Date();
    return new Notification({
      id: Identifier.generate(),
      companyId: input.companyId,
      recipientUserId: input.recipientUserId,
      triggerCode: input.triggerCode,
      category: input.category,
      priority: input.priority,
      titleKey: input.titleKey,
      bodyKey: input.bodyKey,
      title: input.title,
      body: input.body,
      vars: input.vars ?? {},
      actionUrl: input.actionUrl ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      isRead: false,
      isDismissed: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }

  public get isRead(): boolean {
    return this._isRead;
  }

  public get isDismissed(): boolean {
    return this._isDismissed;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public markRead(): void {
    if (this._isRead) return;
    this._isRead = true;
    this._updatedAt = new Date();
  }

  public markUnread(): void {
    if (!this._isRead) return;
    this._isRead = false;
    this._updatedAt = new Date();
  }

  public dismiss(): void {
    if (this._isDismissed) return;
    this._isDismissed = true;
    this._updatedAt = new Date();
  }

  public get priorityVo(): NotificationPriority {
    return NotificationPriority.from(this.priority);
  }
}
