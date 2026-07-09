import React from 'react';

export interface LoyaltyTierBadgeProps {
  tier: string;
}

export function LoyaltyTierBadge({ tier }: LoyaltyTierBadgeProps): React.ReactElement {
  const colors: Record<string, string> = {
    bronze: 'badge-bronze',
    silver: 'badge-silver',
    gold: 'badge-gold',
    platinum: 'badge-platinum',
  };
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  return <span className={`badge ${colors[tier] ?? 'badge-active'}`}>{label}</span>;
}
