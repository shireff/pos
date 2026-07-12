import React, { useEffect, useState } from 'react';
import { useT, NotificationList, type NotificationView } from '@packages/ui-components';
import { notificationsApi } from '../../lib/api/notifications';

export function NotificationsPage(): React.ReactElement {
  const t = useT();
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      await notificationsApi.load();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleSelect = (n: NotificationView) => {
    if (n.actionUrl) {
      window.location.href = n.actionUrl;
    }
  };

  const handleMarkRead = (id: string) => {
    void notificationsApi.markRead(id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notifications.title')}</h1>
          <p className="page-subtitle">{t('notifications.empty')}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void notificationsApi.markAllRead()}>
          {t('notifications.markAllRead')}
        </button>
      </div>
      {loading ? (
        <div className="spinner-wrap">
          <span className="spinner" />
        </div>
      ) : (
        <NotificationList onSelect={handleSelect} onMarkRead={handleMarkRead} />
      )}
    </div>
  );
}
