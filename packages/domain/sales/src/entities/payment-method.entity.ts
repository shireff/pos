import { Identifier } from '@packages/shared-kernel';
import { TenderType } from '../value-objects';

export interface PaymentMethodProps {
  id: string;
  companyId: string;
  tenderType: TenderType;
  isEnabled: boolean;
  displayNameAr: string;
  displayNameEn: string;
  configuration: Record<string, unknown> | null;
}

export class PaymentMethod {
  public readonly id: string;
  public readonly companyId: string;
  public readonly tenderType: TenderType;
  public isEnabled: boolean;
  public readonly displayNameAr: string;
  public readonly displayNameEn: string;
  public configuration: Record<string, unknown> | null;

  private constructor(props: PaymentMethodProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.tenderType = props.tenderType;
    this.isEnabled = props.isEnabled;
    this.displayNameAr = props.displayNameAr;
    this.displayNameEn = props.displayNameEn;
    this.configuration = props.configuration;
  }

  public static create(props: Omit<PaymentMethodProps, 'id'>): PaymentMethod {
    return new PaymentMethod({ id: Identifier.generate(), ...props });
  }

  public static reconstitute(props: PaymentMethodProps): PaymentMethod {
    return new PaymentMethod(props);
  }
}
