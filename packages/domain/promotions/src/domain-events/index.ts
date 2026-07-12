import { DomainEventBase } from '@packages/shared-kernel';

export class DiscountRuleCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly discountType: string;

  public constructor(props: { discountId: string; companyId: string; discountType: string }) {
    super(props.discountId, 'Discount');
    this.companyId = props.companyId;
    this.discountType = props.discountType;
  }
}

export class DiscountRuleUpdated extends DomainEventBase {
  public readonly companyId: string;
  public readonly discountType: string;

  public constructor(props: { discountId: string; companyId: string; discountType: string }) {
    super(props.discountId, 'Discount');
    this.companyId = props.companyId;
    this.discountType = props.discountType;
  }
}

export class DiscountRuleDeactivated extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { discountId: string; companyId: string }) {
    super(props.discountId, 'Discount');
    this.companyId = props.companyId;
  }
}

export class CouponCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly code: string;

  public constructor(props: { couponId: string; companyId: string; code: string }) {
    super(props.couponId, 'Coupon');
    this.companyId = props.companyId;
    this.code = props.code;
  }
}

export class CouponValidated extends DomainEventBase {
  public readonly companyId: string;
  public readonly code: string;
  public readonly valid: boolean;
  public readonly discountPiasters: number;

  public constructor(props: { couponId: string; companyId: string; code: string; valid: boolean; discountPiasters: number }) {
    super(props.couponId, 'Coupon');
    this.companyId = props.companyId;
    this.code = props.code;
    this.valid = props.valid;
    this.discountPiasters = props.discountPiasters;
  }
}

/**
 * Emitted when a discount rule is created/updated above the auto-apply threshold
 * and requires approver sign-off (Notifications.md §3 — Discount approval request).
 */
export class DiscountApprovalRequested extends DomainEventBase {
  public readonly companyId: string;
  public readonly discountId: string;
  public readonly requestedByUserId: string;

  public constructor(props: { discountId: string; companyId: string; requestedByUserId: string }) {
    super(props.discountId, 'Discount');
    this.companyId = props.companyId;
    this.discountId = props.discountId;
    this.requestedByUserId = props.requestedByUserId;
  }
}
