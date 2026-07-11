import { Result } from '@packages/shared-kernel';
import { TenderType } from '../value-objects';

export interface TenderInput {
  tenderType: TenderType;
  amountPiasters: number;
}

export interface SplitTenderProps {
  tenders: TenderInput[];
  totalAmountPiasters: number;
}

export class SplitTender {
  public readonly tenders: TenderInput[];
  public readonly totalAmountPiasters: number;

  private constructor(props: SplitTenderProps) {
    if (props.tenders.length === 0) {
      throw new Error('SplitTender must contain at least one tender');
    }
    for (const t of props.tenders) {
      if (t.amountPiasters <= 0) {
        throw new Error(`Tender amount must be positive for ${t.tenderType}`);
      }
    }
    const sum = props.tenders.reduce((acc, t) => acc + t.amountPiasters, 0);
    if (sum !== props.totalAmountPiasters) {
      throw new Error(
        `Tender sum (${sum} piasters) must equal total amount (${props.totalAmountPiasters} piasters)`,
      );
    }
    this.tenders = props.tenders;
    this.totalAmountPiasters = props.totalAmountPiasters;
  }

  public static create(props: SplitTenderProps): SplitTender {
    return new SplitTender(props);
  }

  public static reconstitute(props: SplitTenderProps): SplitTender {
    return new SplitTender(props);
  }

  public static validate(
    tenders: TenderInput[],
    totalAmountPiasters: number,
  ): Result<void, string> {
    if (tenders.length === 0) {
      return Result.fail('At least one tender is required');
    }
    const invalid = tenders.find((t) => t.amountPiasters <= 0);
    if (invalid) {
      return Result.fail(`Tender amount must be positive for ${invalid.tenderType}`);
    }
    const sum = tenders.reduce((acc, t) => acc + t.amountPiasters, 0);
    if (sum !== totalAmountPiasters) {
      return Result.fail(
        `Tender sum (${sum} piasters) must equal total amount (${totalAmountPiasters} piasters)`,
      );
    }
    return Result.ok(undefined);
  }
}
