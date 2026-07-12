// Channel contract is owned by the application layer (ports). This module
// re-exports it so infrastructure code and consumers import a single source.
export type {
  NotificationChannelPort,
  ChannelSendInput,
} from '@packages/application-notifications';
export type { Notification } from '@packages/domain-notifications';
