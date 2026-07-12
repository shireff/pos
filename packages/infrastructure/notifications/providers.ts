/** Push provider abstraction — implemented per-platform (Capacitor on Android, Tauri tray on Desktop). */
export interface PushMessage {
  title: string;
  body: string;
  actionUrl?: string | null;
  data?: Record<string, unknown>;
}

export interface PushProviderPort {
  /** Whether the recipient has a registered push token / permission granted. */
  hasToken(recipientUserId: string): Promise<boolean> | boolean;
  send(recipientUserId: string, message: PushMessage): Promise<void>;
}

/** Email provider abstraction — SMTP or Supabase Edge Function. */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  unsubscribeUrl?: string;
}

/** Resolves a user id to an email address (or null when unknown). */
export type ResolveEmailFn = (recipientUserId: string) => Promise<string | null>;

export interface EmailProviderPort {
  send(message: EmailMessage): Promise<void>;
}

/** Realtime signaler — notifies a connected client that a new in-app notification exists. */
export interface RealtimeSignalerPort {
  signal(recipientUserId: string, notificationId: string): Promise<void> | void;
}

/** Default no-op push provider — used when no platform push integration is wired. */
export class NoopPushProvider implements PushProviderPort {
  public hasToken(): boolean {
    return false;
  }
  public async send(): Promise<void> {
    // graceful no-op when push is unavailable / permission not granted
  }
}

/** Default no-op email provider. */
export class NoopEmailProvider implements EmailProviderPort {
  public async send(): Promise<void> {
    // graceful no-op when SMTP/Edge not configured
  }
}

/** Default no-op realtime signaler. */
export class NoopRealtimeSignaler implements RealtimeSignalerPort {
  public signal(): void {
    // no-op
  }
}
