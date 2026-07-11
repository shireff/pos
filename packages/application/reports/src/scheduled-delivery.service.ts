export interface ReportSubscription {
  id: string;
  userId: string;
  companyId: string;
  reportType: string;
  frequency: 'daily' | 'weekly';
  channel: 'email' | 'in-app';
  lastSentAt: string | null;
  createdAt: string;
}

export interface ScheduledDeliveryInput {
  subscription: ReportSubscription;
}

export interface ScheduledDeliveryResult {
  success: boolean;
  deliveredAt: string;
  channel: string;
  error?: string;
}

export class ScheduledDeliveryService {
  async execute(input: ScheduledDeliveryInput): Promise<ScheduledDeliveryResult> {
    const { subscription } = input;
    const now = new Date();
    const deliveredAt = now.toISOString();

    if (!this.isDue(subscription, now)) {
      return { success: false, deliveredAt, channel: subscription.channel };
    }

    try {
      await this.deliver(subscription);
      return { success: true, deliveredAt, channel: subscription.channel };
    } catch (error) {
      return {
        success: false,
        deliveredAt,
        channel: subscription.channel,
        error: error instanceof Error ? error.message : 'Delivery failed',
      };
    }
  }

  private async deliver(subscription: ReportSubscription): Promise<void> {
    switch (subscription.channel) {
      case 'email':
        await this.sendEmail(subscription);
        break;
      case 'in-app':
        await this.sendInAppNotification(subscription);
        break;
    }
  }

  private async sendEmail(subscription: ReportSubscription): Promise<void> {
    // Integration point for email provider (e.g., SendGrid, AWS SES)
    // In production, this would render the report to PDF/HTML and send via email
    // For now, we mark as delivered without external dependency
    void subscription;
  }

  private async sendInAppNotification(subscription: ReportSubscription): Promise<void> {
    // Integration point for in-app notification system
    // In production, this would create a notification record in the database
    // and trigger a push notification if the user is online
    void subscription;
  }

  private isDue(subscription: ReportSubscription, now: Date): boolean {
    if (!subscription.lastSentAt) return true;
    const lastSent = new Date(subscription.lastSentAt);
    const diffMs = now.getTime() - lastSent.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (subscription.frequency === 'daily') return diffHours >= 24;
    if (subscription.frequency === 'weekly') return diffHours >= 168;
    return false;
  }
}
