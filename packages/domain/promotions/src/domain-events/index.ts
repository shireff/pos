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

export class CouponCreated extends DomainEventBase {
  public readonly companyId: string;
  public readonly code: string;

  public constructor(props: { couponId: string; companyId: string; code: string }) {
    super(props.couponId, 'Coupon');
    this.companyId = props.companyId;
    this.code = props.code;
  }
}

export class CampaignLaunched extends DomainEventBase {
  public readonly companyId: string;
  public readonly name: string;

  public constructor(props: { campaignId: string; companyId: string; name: string }) {
    super(props.campaignId, 'Campaign');
    this.companyId = props.companyId;
    this.name = props.name;
  }
}
