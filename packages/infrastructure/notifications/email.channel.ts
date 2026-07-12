import type { NotificationChannelPort, ChannelSendInput } from '@packages/application-notifications';
import type { EmailProviderPort, ResolveEmailFn } from './providers';
import { NoopEmailProvider } from './providers';

/**
 * Email channel — sends via configured SMTP or Supabase Edge Function. Includes
 * an unsubscribe link and respects the per-category email preference (the
 * dispatcher already checks the preference before calling this channel).
 */
export class EmailNotificationChannel implements NotificationChannelPort {
  public readonly channel = 'EMAIL' as const;

  constructor(
    private readonly provider: EmailProviderPort = new NoopEmailProvider(),
    private readonly resolveEmail?: ResolveEmailFn,
    private readonly unsubscribeBaseUrl = '',
  ) {}

  public isAvailable(recipientUserId: string): boolean | Promise<boolean> {
    if (!this.resolveEmail) return false;
    return this.resolveEmail(recipientUserId).then((e) => !!e);
  }

  public async send(input: ChannelSendInput): Promise<void> {
    const to = this.resolveEmail ? await this.resolveEmail(input.recipientUserId) : null;
    if (!to) return; // no email address → graceful skip
    await this.provider.send({
      to,
      subject: input.notification.title,
      body: input.notification.body,
      unsubscribeUrl: `${this.unsubscribeBaseUrl}?userId=${encodeURIComponent(input.recipientUserId)}`,
    });
  }
}
