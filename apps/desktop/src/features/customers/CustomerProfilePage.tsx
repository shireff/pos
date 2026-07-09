import React, { useEffect, useState } from 'react';
import { Icon } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchCustomerById,
  clearCustomerDetail,
  redeemLoyalty,
  CustomerDetail,
} from '../../lib/store/customersSlice';
import { OverviewTab } from './tabs/OverviewTab';
import { LoyaltyHistoryTab } from './tabs/LoyaltyHistoryTab';
import { CreditHistoryTab } from './tabs/CreditHistoryTab';
import { PurchaseHistoryTab } from './tabs/PurchaseHistoryTab';
import { LoyaltyRedemptionDialog } from '@packages/ui-components';
import { useToast } from '@packages/ui-components';

type TabKey = 'overview' | 'loyalty-history' | 'credit-history' | 'purchases';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'loyalty-history', label: 'Loyalty History' },
  { key: 'credit-history', label: 'Credit History' },
  { key: 'purchases', label: 'Purchase History' },
];

export interface CustomerProfilePageProps {
  customerId: string;
  onBack: () => void;
  onRedeem: (customerId: string) => void;
}

export function CustomerProfilePage({
  customerId,
  onBack,
  onRedeem,
}: CustomerProfilePageProps): React.ReactElement {
  const dispatch = useAppDispatch();
  const detail = useAppSelector((state: any) => state.customers.selectedCustomer as CustomerDetail | null);
  const detailStatus = useAppSelector((state: any) => state.customers.detailStatus);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');
  const { push } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loyaltyPage, setLoyaltyPage] = useState(1);
  const [creditPage, setCreditPage] = useState(1);

  useEffect(() => {
    void dispatch(fetchCustomerById({ customerId, companyId }));
    return () => {
      dispatch(clearCustomerDetail());
    };
  }, [dispatch, customerId, companyId]);

  if (detailStatus === 'loading' && !detail) {
    return <div className="loading">Loading customer profile…</div>;
  }

  if (!detail) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Customer not found</p>
        <button type="button" className="btn btn-secondary" onClick={onBack}>Back to list</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
              <Icon name="arrow-left" size={16} />
            </button>
            <h1 className="page-title">{detail.name}</h1>
          </div>
          <p className="page-subtitle">{detail.phone} · {detail.email ?? 'No email'}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-primary" onClick={() => onRedeem(detail.id)}>
            Redeem Points
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab detail={detail} />}
      {activeTab === 'loyalty-history' && (
        <LoyaltyHistoryTab customerId={detail.id} companyId={companyId} page={loyaltyPage} onPageChange={setLoyaltyPage} />
      )}
      {activeTab === 'credit-history' && (
        <CreditHistoryTab customerId={detail.id} companyId={companyId} page={creditPage} onPageChange={setCreditPage} />
      )}
      {activeTab === 'purchases' && <PurchaseHistoryTab customerId={detail.id} />}
    </div>
  );
}
