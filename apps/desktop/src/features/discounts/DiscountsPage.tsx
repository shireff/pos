import React, { useState } from 'react';
import { DiscountRuleBuilderPage } from './DiscountRuleBuilderPage';
import { CouponManagementPage } from './CouponManagementPage';

export function DiscountsPage(): React.ReactElement {
  const [tab, setTab] = useState<'rules' | 'coupons'>('rules');
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Promotions</h1>
          <p className="page-subtitle">Manage discount rules and coupons.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className={`btn ${tab === 'rules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('rules')}>Discount Rules</button>
          <button type="button" className={`btn ${tab === 'coupons' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('coupons')}>Coupons</button>
        </div>
      </div>
      {tab === 'rules' ? <DiscountRuleBuilderPage /> : <CouponManagementPage />}
    </div>
  );
}
