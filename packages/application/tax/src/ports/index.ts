import {
  TaxRule,
  PriceChange,
  PriceChangeStatus,
} from '@packages/domain-tax';

export interface TaxRuleFilter {
  isActive?: boolean;
}

export interface TaxRuleRepository {
  findById(id: string, companyId: string): Promise<TaxRule | null>;
  findByCompany(companyId: string, filter?: TaxRuleFilter): Promise<TaxRule[]>;
  save(taxRule: TaxRule): Promise<void>;
}

export interface PriceChangeRepository {
  findById(id: string, companyId: string): Promise<PriceChange | null>;
  findByProduct(companyId: string, productId: string, status?: PriceChangeStatus): Promise<PriceChange[]>;
  findByCompanyPendingApproval(companyId: string): Promise<PriceChange[]>;
  save(priceChange: PriceChange): Promise<void>;
}
