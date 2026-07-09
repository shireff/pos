import React, { useState } from 'react';
import { Modal, Field, useToast } from '../components/ui';
import { Icon } from '../components/Icon';

export interface LoyaltyRedemptionDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  availablePoints: number;
  onConfirm: (points: number) => Promise<void>;
}

export function LoyaltyRedemptionDialog({
  open,
  onClose,
  customerId,
  availablePoints,
  onConfirm,
}: LoyaltyRedemptionDialogProps): React.ReactElement {
  const [points, setPoints] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { push } = useToast();

  const handleConfirm = async () => {
    const parsed = Number(points);
    if (isNaN(parsed) || parsed <= 0) {
      push({ type: 'error', msg: 'Please enter a valid number of points' });
      return;
    }
    if (parsed > availablePoints) {
      push({ type: 'error', msg: 'Not enough loyalty points' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(parsed);
      push({ type: 'success', msg: `Redeemed ${parsed} points` });
      setPoints('');
      onClose();
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const redemptionValue = points ? Math.floor(Number(points) * 1) : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Redeem Loyalty Points"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isSubmitting || !points}
          >
            {isSubmitting ? 'Redeeming...' : 'Confirm Redemption'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
          <span className="stat-label">Available Points</span>
          <span className="stat-value">{availablePoints.toLocaleString()}</span>
        </div>
        <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
          <span className="stat-label">Redemption Rate</span>
          <span className="stat-value">1 point = 1 EGP</span>
        </div>
        <Field label="Points to Redeem" required htmlFor="redeem-points">
          <input
            id="redeem-points"
            className="form-input"
            type="number"
            min={1}
            max={availablePoints}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder={`Max ${availablePoints}`}
          />
        </Field>
        {Number(points) > 0 && (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Redemption value: {redemptionValue.toLocaleString()} EGP
          </div>
        )}
      </div>
    </Modal>
  );
}
