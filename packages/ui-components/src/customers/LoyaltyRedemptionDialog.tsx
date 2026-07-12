import React, { useState } from 'react';
import { Modal, Field, useToast } from '../components/ui';
import { useT } from '../i18n';

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
  const t = useT();
  const [points, setPoints] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { push } = useToast();

  const handleConfirm = async () => {
    const parsed = Number(points);
    if (isNaN(parsed) || parsed <= 0) {
      push({ type: 'error', msg: t('customers.enterValidPoints') });
      return;
    }
    if (parsed > availablePoints) {
      push({ type: 'error', msg: t('customers.notEnoughPoints') });
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(parsed);
      push({ type: 'success', msg: t('customers.redeemedPoints', { count: parsed }) });
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
      title={t('customers.redeemLoyaltyPoints')}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isSubmitting || !points}
          >
            {isSubmitting ? t('customers.redeeming') : t('customers.confirmRedemption')}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
          <span className="stat-label">{t('customers.availablePoints')}</span>
          <span className="stat-value">{availablePoints.toLocaleString()}</span>
        </div>
        <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
          <span className="stat-label">{t('customers.redemptionRate')}</span>
          <span className="stat-value">{t('customers.pointEquals')}</span>
        </div>
        <Field label={t('customers.pointsToRedeem')} required htmlFor="redeem-points">
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
            {t('customers.redemptionValue', { count: redemptionValue.toLocaleString() })}
          </div>
        )}
      </div>
    </Modal>
  );
}
