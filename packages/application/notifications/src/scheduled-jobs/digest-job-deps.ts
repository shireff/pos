import type { Clock } from '../ports';
import type { DigestRepositoryPort, NotificationRepositoryPort } from '../ports';

/** Shared dependencies for the hourly/daily digest jobs. */
export interface DigestJobDeps {
  notificationRepo: NotificationRepositoryPort;
  digestRepo: DigestRepositoryPort;
  clock?: Clock;
}
