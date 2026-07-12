import { useSyncExternalStore } from 'react';

export type NotificationFrequency = 'IMMEDIATE' | 'HOURLY_DIGEST' | 'DAILY_DIGEST';
export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL';
export type NotificationCategory =
  | 'INVENTORY'
  | 'APPROVALS'
  | 'SYNC'
  | 'AI_INSIGHTS'
  | 'BILLING_TRIAL'
  | 'REPORTS'
  | 'SECURITY'
  | 'GENERAL';
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface NotificationView {
  id: string;
  triggerCode: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionUrl: string | null;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferenceView {
  category: NotificationCategory;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  isEnabled: boolean;
}

export interface NotificationsState {
  items: NotificationView[];
  unreadCount: number;
  preferences: NotificationPreferenceView[];
  loading: boolean;
}

const EMPTY: NotificationsState = { items: [], unreadCount: 0, preferences: [], loading: false };

/**
 * External store for notification UI state (bell badge, history, preferences).
 * Mirrors the sync store pattern — integrates with React via
 * useSyncExternalStore. Apps populate it by calling `refresh*` with their
 * API client; components stay presentational.
 */
export class NotificationsStore {
  private state: NotificationsState = EMPTY;
  private listeners = new Set<() => void>();

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): NotificationsState => this.state;

  private setState(next: Partial<NotificationsState>): void {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l());
  }

  public setItems(items: NotificationView[]): void {
    const unreadCount = items.filter((i) => !i.isRead).length;
    this.setState({ items, unreadCount });
  }

  public setPreferences(preferences: NotificationPreferenceView[]): void {
    this.setState({ preferences });
  }

  public setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  public markRead(id: string): void {
    this.setState({
      items: this.state.items.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
      unreadCount: Math.max(0, this.state.unreadCount - 1),
    });
  }

  public markAllRead(): void {
    this.setState({
      items: this.state.items.map((i) => ({ ...i, isRead: true })),
      unreadCount: 0,
    });
  }

  public upsertPreference(pref: NotificationPreferenceView): void {
    const others = this.state.preferences.filter(
      (p) => !(p.category === pref.category && p.channel === pref.channel),
    );
    this.setState({ preferences: [...others, pref] });
  }

  public reset(): void {
    this.state = EMPTY;
    this.listeners.forEach((l) => l());
  }
}

export const notificationsStore = new NotificationsStore();

export function useNotificationsStore(): NotificationsState {
  return useSyncExternalStore(notificationsStore.subscribe, notificationsStore.getSnapshot);
}
