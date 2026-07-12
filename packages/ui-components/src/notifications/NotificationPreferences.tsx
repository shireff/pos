import { useT } from '../i18n';
import {
  useNotificationsStore,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationFrequency,
  type NotificationPreferenceView,
} from '../stores/notifications.store';

export interface NotificationPreferencesProps {
  /** All categories the UI should render (defaults to the standard set). */
  categories?: NotificationCategory[];
  onToggle?: (category: NotificationCategory, channel: NotificationChannel, isEnabled: boolean) => void;
  onFrequencyChange?: (
    category: NotificationCategory,
    channel: NotificationChannel,
    frequency: NotificationFrequency,
  ) => void;
  className?: string;
}

const DEFAULT_CATEGORIES: NotificationCategory[] = [
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
const FREQUENCIES: NotificationFrequency[] = ['IMMEDIATE', 'HOURLY_DIGEST', 'DAILY_DIGEST'];

function findPref(
  prefs: NotificationPreferenceView[],
  category: NotificationCategory,
  channel: NotificationChannel,
): NotificationPreferenceView | undefined {
  return prefs.find((p) => p.category === category && p.channel === channel);
}

/**
 * Per-category / per-channel notification preferences with a frequency selector
 * (immediate / hourly digest / daily digest). Synced as Class B (Notifications.md §5).
 */
export function NotificationPreferences({
  categories = DEFAULT_CATEGORIES,
  onToggle,
  onFrequencyChange,
  className,
}: NotificationPreferencesProps) {
  const t = useT();
  const { preferences } = useNotificationsStore();

  return (
    <div className={`notification-preferences ${className ?? ''}`}>
      <h3>{t('notifications.preferences')}</h3>
      <table className="notification-preferences__table">
        <thead>
          <tr>
            <th>{t('notifications.category')}</th>
            {CHANNELS.map((c) => (
              <th key={c}>{t(`notifications.${c.toLowerCase()}`)}</th>
            ))}
            <th>{t('notifications.frequency')}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const inApp = findPref(preferences, category, 'IN_APP');
            const push = findPref(preferences, category, 'PUSH');
            const email = findPref(preferences, category, 'EMAIL');
            const freq = (push ?? email ?? inApp)?.frequency ?? 'IMMEDIATE';
            return (
              <tr key={category}>
                <td>{category}</td>
                {CHANNELS.map((channel) => {
                  const pref = findPref(preferences, category, channel);
                  const enabled = pref?.isEnabled ?? channel === 'IN_APP';
                  return (
                    <td key={channel}>
                      <label className="notification-preferences__toggle">
                        <input
                          type="checkbox"
                          checked={enabled}
                          aria-label={`${category} ${channel}`}
                          onChange={(e) =>
                            onToggle?.(category, channel, e.target.checked)
                          }
                        />
                        <span>{enabled ? t('notifications.enabled') : t('notifications.disabled')}</span>
                      </label>
                    </td>
                  );
                })}
                <td>
                  <select
                    value={freq}
                    aria-label={`${category} frequency`}
                    onChange={(e) =>
                      onFrequencyChange?.(category, 'PUSH', e.target.value as NotificationFrequency)
                    }
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {t(`notifications.${f.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
