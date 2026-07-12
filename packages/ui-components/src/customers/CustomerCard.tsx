import React from 'react';
import { useT } from '../i18n';

export interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    loyaltyTierId: string;
    loyaltyBalance: number;
    creditBalance: number;
    creditLimitPiasters: number;
  };
  onClick?: () => void;
}

export function CustomerCard({ customer, onClick }: CustomerCardProps): React.ReactElement {
  const t = useT();
  return (
    <div
      className="card"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: 'var(--space-3)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-md)' }}>{customer.name}</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
            {customer.phone}
          </div>
        </div>
        <LoyaltyTierBadge tier={customer.loyaltyTierId} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
        <div>
          <span className="stat-label">{t('customers.points')}</span>
          <span className="stat-value" style={{ marginRight: 'var(--space-2)' }}>{customer.loyaltyBalance.toLocaleString()}</span>
        </div>
        <div>
          <span className="stat-label">{t('customers.credit')}</span>
          <span className="stat-value" style={{ marginRight: 'var(--space-2)' }}>
            {customer.creditBalance.toLocaleString()} EGP
          </span>
        </div>
        <div>
          <span className="stat-label">{t('customers.limit')}</span>
          <span className="stat-value">{customer.creditLimitPiasters.toLocaleString()} EGP</span>
        </div>
      </div>
    </div>
  );
}

function LoyaltyTierBadge({ tier }: { tier: string }): React.ReactElement {
  const colors: Record<string, string> = {
    bronze: 'badge-bronze',
    silver: 'badge-silver',
    gold: 'badge-gold',
    platinum: 'badge-platinum',
  };
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  return <span className={`badge ${colors[tier] ?? 'badge-active'}`}>{label}</span>;
}
