import { useState } from 'react';
import { useT } from '../i18n';
import { useNotificationsStore, type NotificationView } from '../stores/notifications.store';

export interface NotificationBellProps {
  /** Called when the user clicks a single notification (e.g. to deep-link). */
  onSelect?: (n: NotificationView) => void;
  /** Called when the user marks all as read. */
  onMarkAllRead?: () => void;
  /** Max items shown in the dropdown. */
  max?: number;
  className?: string;
}

/**
 * Header notification bell with an unread-count badge and a dropdown of recent
 * notifications (Notifications.md §1, UI_UX.md §1). Reads from the shared
 * notifications store so the badge updates in real time.
 */
export function NotificationBell({
  onSelect,
  onMarkAllRead,
  max = 8,
  className,
}: NotificationBellProps) {
  const t = useT();
  const { items, unreadCount } = useNotificationsStore();
  const [open, setOpen] = useState(false);

  const recent = items.slice(0, max);

  return (
    <div className={`notification-bell ${className ?? ''}`}>
      <button
        type="button"
        aria-label={t('notifications.bell')}
        className="notification-bell__trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="notification-bell__icon" aria-hidden>
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="notification-bell__badge" data-testid="unread-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell__dropdown" role="menu">
          <div className="notification-bell__header">
            <span>{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-bell__mark-all"
                onClick={() => {
                  onMarkAllRead?.();
                  setOpen(false);
                }}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="notification-bell__empty">{t('notifications.empty')}</div>
          ) : (
            <ul className="notification-bell__list">
              {recent.map((n) => (
                <li
                  key={n.id}
                  className={`notification-bell__item notification-bell__item--${n.priority.toLowerCase()} ${
                    n.isRead ? 'is-read' : 'is-unread'
                  }`}
                  role="menuitem"
                  onClick={() => {
                    onSelect?.(n);
                    setOpen(false);
                  }}
                >
                  <div className="notification-bell__item-title">{n.title}</div>
                  <div className="notification-bell__item-body">{n.body}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
