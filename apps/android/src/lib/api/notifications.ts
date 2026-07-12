import { ApiEndpoints, buildEndpoint } from './endpoints';
import {
  notificationsStore,
  type NotificationPreferenceView,
  type NotificationView,
} from '@packages/ui-components';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

async function putJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export const notificationsApi = {
  async load(companyId?: string): Promise<NotificationView[]> {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const items = await getJson<NotificationView[]>(`${ApiEndpoints.Notifications}${qs}`);
    notificationsStore.setItems(items);
    return items;
  },
  async markRead(id: string): Promise<void> {
    await fetch(buildEndpoint(ApiEndpoints.NotificationMarkRead, { id }), { method: 'POST' });
    notificationsStore.markRead(id);
  },
  async markAllRead(): Promise<void> {
    await fetch(ApiEndpoints.NotificationsReadAll, { method: 'POST' });
    notificationsStore.markAllRead();
  },
  async loadPreferences(): Promise<NotificationPreferenceView[]> {
    const prefs = await getJson<NotificationPreferenceView[]>(ApiEndpoints.NotificationPreferences);
    notificationsStore.setPreferences(prefs);
    return prefs;
  },
  async updatePreferences(prefs: NotificationPreferenceView[]): Promise<NotificationPreferenceView[]> {
    const saved = await putJson<NotificationPreferenceView[]>(ApiEndpoints.NotificationPreferences, prefs);
    notificationsStore.setPreferences(saved);
    return saved;
  },
};
