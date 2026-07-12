import React, { useState } from 'react';
import { useT } from '@packages/ui-components';
import { DiscountRuleBuilderPage } from './DiscountRuleBuilderPage';
import { CouponManagementPage } from './CouponManagementPage';

export function DiscountsPage(): React.ReactElement {
  const [tab, setTab] = useState<'rules' | 'coupons'>('rules');
  const t = useT();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('discounts.promotions')}</h1>
          <p className="page-subtitle">{t('discounts.manageRulesAndCoupons')}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className={`btn ${tab === 'rules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('rules')}>{t('discounts.discountRules')}</button>
          <button type="button" className={`btn ${tab === 'coupons' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('coupons')}>{t('discounts.coupons')}</button>
        </div>
      </div>
      {tab === 'rules' ? <DiscountRuleBuilderPage /> : <CouponManagementPage />}
    </div>
  );
}
