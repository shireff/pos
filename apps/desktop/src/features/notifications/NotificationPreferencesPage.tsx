import React, { useEffect, useState } from 'react';
import {
  useT,
  NotificationPreferences,
  notificationsStore,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationFrequency,
  type NotificationPreferenceView,
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
const CHANNELS: NotificationChannel[] = ['IN_APP', 'PUSH', 'EMAIL'];

export function NotificationPreferencesPage(): React.ReactElement {
  const t = useT();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await notificationsApi.loadPreferences();
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

  void ALL_CATEGORIES;
  void CHANNELS;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notifications.preferences')}</h1>
        </div>
      </div>
      {loading ? (
        <div className="spinner-wrap">
          <span className="spinner" />
        </div>
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
