import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { useNotificationsStore, type NotificationView } from '../stores/notifications.store';

export interface NotificationListProps {
  onSelect?: (n: NotificationView) => void;
  onMarkRead?: (id: string) => void;
  className?: string;
}

/**
 * Full-page notification history with a read/unread filter and "mark read"
 * affordance (Notifications.md UI, UI_UX.md §1).
 */
export function NotificationList({ onSelect, onMarkRead, className }: NotificationListProps) {
  const t = useT();
  const { items } = useNotificationsStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visible = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return filter === 'unread' ? sorted.filter((i) => !i.isRead) : sorted;
  }, [items, filter]);

  return (
    <div className={`notification-list ${className ?? ''}`}>
      <div className="notification-list__filters">
        <button
          type="button"
          className={filter === 'all' ? 'is-active' : ''}
          onClick={() => setFilter('all')}
        >
          {t('notifications.title')}
        </button>
        <button
          type="button"
          className={filter === 'unread' ? 'is-active' : ''}
          onClick={() => setFilter('unread')}
        >
          {t('notifications.unread')}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="notification-list__empty">{t('notifications.empty')}</div>
      ) : (
        <ul className="notification-list__items">
          {visible.map((n) => (
            <li
              key={n.id}
              className={`notification-list__item notification-list__item--${n.priority.toLowerCase()} ${
                n.isRead ? 'is-read' : 'is-unread'
              }`}
              onClick={() => onSelect?.(n)}
            >
              <div className="notification-list__item-main">
                <div className="notification-list__item-title">{n.title}</div>
                <div className="notification-list__item-body">{n.body}</div>
              </div>
              {!n.isRead && (
                <button
                  type="button"
                  className="notification-list__mark-read"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead?.(n.id);
                  }}
                >
                  ✓
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
