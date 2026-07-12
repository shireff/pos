import React, { useEffect, useState } from 'react';
import {
  useT,
  NotificationList,
  NotificationPreferences,
  notificationsStore,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationFrequency,
  type NotificationPreferenceView,
  type NotificationView,
} from '@packages/ui-components';
import { notificationsApi } from '../../lib/api/notifications';

const ALL_CATEGORIES: NotificationCategory[] = [
  'INVENTORY',
  'APPROVALS',
  'SYNC',
  'AI_INSIGHTS',
  'BILLING_TRIAL',
  'REPORTS',
  'SECURITY',
  'GENERAL',
];

export function NotificationsScreen(): React.ReactElement {
  const t = useT();
  const [tab, setTab] = useState<'list' | 'preferences'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await notificationsApi.load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateOne = (
    category: NotificationCategory,
    channel: NotificationChannel,
    patch: Partial<NotificationPreferenceView>,
  ) => {
    const prefs = notificationsStore.getSnapshot().preferences;
    const existing = prefs.find((p) => p.category === category && p.channel === channel);
    const others = prefs.filter((p) => !(p.category === category && p.channel === channel));
    const updated: NotificationPreferenceView[] = [
      ...others,
      {
        category,
        channel,
        frequency: patch.frequency ?? existing?.frequency ?? 'IMMEDIATE',
        isEnabled: patch.isEnabled ?? existing?.isEnabled ?? true,
      },
    ];
    notificationsStore.setPreferences(updated);
    void notificationsApi.updatePreferences(updated);
  };

  const handleToggle = (category: NotificationCategory, channel: NotificationChannel, isEnabled: boolean) =>
    updateOne(category, channel, { isEnabled });
  const handleFrequencyChange = (
    category: NotificationCategory,
    channel: NotificationChannel,
    frequency: NotificationFrequency,
  ) => updateOne(category, channel, { frequency });

  const handleSelect = (n: NotificationView) => {
    if (n.actionUrl) window.location.href = n.actionUrl;
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)' }}>{t('notifications.title')}</h1>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => void notificationsApi.markAllRead()}
        >
          {t('notifications.markAllRead')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          className={`btn btn-sm${tab === 'list' ? ' btn-primary' : ' btn-secondary'}`}
          onClick={() => setTab('list')}
        >
          {t('notifications.title')}
        </button>
        <button
          type="button"
          className={`btn btn-sm${tab === 'preferences' ? ' btn-primary' : ' btn-secondary'}`}
          onClick={() => {
            setTab('preferences');
            void notificationsApi.loadPreferences();
          }}
        >
          {t('notifications.preferences')}
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <span className="spinner" />
        </div>
      ) : tab === 'list' ? (
        <NotificationList onSelect={handleSelect} onMarkRead={(id) => void notificationsApi.markRead(id)} />
      ) : (
        <NotificationPreferences
          categories={ALL_CATEGORIES}
          onToggle={handleToggle}
          onFrequencyChange={handleFrequencyChange}
        />
      )}
    </div>
  );
}
