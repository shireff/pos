import React, { useState } from 'react';
import { TaxRuleEditorPage } from './TaxRuleEditorPage';
import { PriceChangePage } from './PriceChangePage';

export function PricingPage(): React.ReactElement {
  const [tab, setTab] = useState<'tax' | 'price'>('tax');
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pricing</h1>
          <p className="page-subtitle">Manage tax rules and price changes.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className={`btn ${tab === 'tax' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('tax')}>Tax Rules</button>
          <button type="button" className={`btn ${tab === 'price' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('price')}>Price Changes</button>
        </div>
      </div>
      {tab === 'tax' ? <TaxRuleEditorPage /> : <PriceChangePage />}
    </div>
  );
}
