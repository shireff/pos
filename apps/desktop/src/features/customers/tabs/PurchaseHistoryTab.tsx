import React from 'react';

export interface PurchaseHistoryTabProps {
  customerId: string;
}

export function PurchaseHistoryTab({ customerId }: PurchaseHistoryTabProps): React.ReactElement {
  return (
    <div className="empty-state">
      <p className="empty-state-title">Purchase History</p>
      <p>View full purchase history for customer {customerId.slice(0, 8)}… in the Sales module.</p>
    </div>
  );
}
