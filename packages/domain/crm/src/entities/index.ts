import { Identifier } from '@packages/shared-kernel';
import { CreditEntryType, LoyaltyEventType, MembershipTier } from '../value-objects';

// ─── LoyaltyPointEvent (Class A — append-only) ───────────────────────────────

export interface LoyaltyPointEventProps {
  id: string;
  customerId: string;
  pointsDelta: number; // positive = accrual, negative = redemption/reversal
  eventType: LoyaltyEventType;
  referenceOrderId: string | null;
  occurredAt: string;
}

export class LoyaltyPointEvent {
  public readonly id: string;
  public readonly customerId: string;
  public readonly pointsDelta: number;
  public readonly eventType: LoyaltyEventType;
  public readonly referenceOrderId: string | null;
  public readonly occurredAt: string;

  private constructor(props: LoyaltyPointEventProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.pointsDelta = props.pointsDelta;
    this.eventType = props.eventType;
    this.referenceOrderId = props.referenceOrderId;
    this.occurredAt = props.occurredAt;
  }

  public static record(
    props: Omit<LoyaltyPointEventProps, 'id' | 'occurredAt'>,
  ): LoyaltyPointEvent {
    return new LoyaltyPointEvent({
      id: Identifier.generate(),
      occurredAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: LoyaltyPointEventProps): LoyaltyPointEvent {
    return new LoyaltyPointEvent(props);
  }
}

// ─── CreditLedgerEntry (Class A — append-only) ───────────────────────────────

export interface CreditLedgerEntryProps {
  id: string;
  customerId: string;
  amountPiasters: number;
  type: CreditEntryType;
  dueDate: string | null;
  orderId: string | null;
  occurredAt: string;
}

export class CreditLedgerEntry {
  public readonly id: string;
  public readonly customerId: string;
  public readonly amountPiasters: number;
  public readonly type: CreditEntryType;
  public readonly dueDate: string | null;
  public readonly orderId: string | null;
  public readonly occurredAt: string;

  private constructor(props: CreditLedgerEntryProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.amountPiasters = props.amountPiasters;
    this.type = props.type;
    this.dueDate = props.dueDate;
    this.orderId = props.orderId;
    this.occurredAt = props.occurredAt;
  }

  public static record(
    props: Omit<CreditLedgerEntryProps, 'id' | 'occurredAt'>,
  ): CreditLedgerEntry {
    return new CreditLedgerEntry({
      id: Identifier.generate(),
      occurredAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: CreditLedgerEntryProps): CreditLedgerEntry {
    return new CreditLedgerEntry(props);
  }
}

// ─── LoyaltyAccount ──────────────────────────────────────────────────────────

export interface LoyaltyAccountProps {
  customerId: string;
  membershipTier: MembershipTier;
}

export class LoyaltyAccount {
  public readonly customerId: string;
  private _membershipTier: MembershipTier;
  private _events: LoyaltyPointEvent[] = [];

  private constructor(props: LoyaltyAccountProps) {
    this.customerId = props.customerId;
    this._membershipTier = props.membershipTier;
  }

  public static create(customerId: string): LoyaltyAccount {
    return new LoyaltyAccount({ customerId, membershipTier: 'bronze' });
  }

  public static reconstitute(
    props: LoyaltyAccountProps,
    events: LoyaltyPointEvent[],
  ): LoyaltyAccount {
    const acct = new LoyaltyAccount(props);
    acct._events = events;
    return acct;
  }

  public get membershipTier(): MembershipTier {
    return this._membershipTier;
  }
  public get events(): readonly LoyaltyPointEvent[] {
    return this._events;
  }

  /** Points balance is the sum of all event deltas — never a mutable field (BR-CUS-003). */
  public get pointsBalance(): number {
    return this._events.reduce((sum, e) => sum + e.pointsDelta, 0);
  }

  public accruePoints(points: number, orderId: string): LoyaltyPointEvent {
    if (points <= 0) throw new Error('Accrual points must be positive');
    const event = LoyaltyPointEvent.record({
      customerId: this.customerId,
      pointsDelta: points,
      eventType: 'accrual',
      referenceOrderId: orderId,
    });
    this._events.push(event);
    return event;
  }

  public redeemPoints(points: number, orderId: string): LoyaltyPointEvent {
    if (points <= 0) throw new Error('Redemption points must be positive');
    if (this.pointsBalance < points) throw new Error('Insufficient loyalty points');
    const event = LoyaltyPointEvent.record({
      customerId: this.customerId,
      pointsDelta: -points,
      eventType: 'redemption',
      referenceOrderId: orderId,
    });
    this._events.push(event);
    return event;
  }

  public reversePoints(points: number, orderId: string): LoyaltyPointEvent {
    const event = LoyaltyPointEvent.record({
      customerId: this.customerId,
      pointsDelta: -points,
      eventType: 'reversal',
      referenceOrderId: orderId,
    });
    this._events.push(event);
    return event;
  }

  public upgradeTier(tier: MembershipTier): void {
    this._membershipTier = tier;
  }
}
