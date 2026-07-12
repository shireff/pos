import React, { useState } from 'react';
import { useT } from '@packages/ui-components';
import { TaxRuleEditorPage } from './TaxRuleEditorPage';
import { PriceChangePage } from './PriceChangePage';

export function PricingPage(): React.ReactElement {
  const [tab, setTab] = useState<'tax' | 'price'>('tax');
  const t = useT();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('pricing.title')}</h1>
          <p className="page-subtitle">{t('pricing.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className={`btn ${tab === 'tax' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('tax')}>{t('pricing.taxRules')}</button>
          <button type="button" className={`btn ${tab === 'price' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('price')}>{t('pricing.priceChanges')}</button>
        </div>
      </div>
      {tab === 'tax' ? <TaxRuleEditorPage /> : <PriceChangePage />}
    </div>
  );
}
