import React, { useState } from 'react';
import { Modal, Field } from '../components/ui';
import { useT } from '../i18n';
import type { TenderType } from '@packages/domain-sales';

export interface RefundPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  tenders: Array<{ tenderType: TenderType; amountPiasters: number }>;
  onRefund: (tenders: Array<{ tenderType: TenderType; amountPiasters: number }>) => void;
  submitting?: boolean;
}

function formatEgp(piasters: number): string {
  return (piasters / 100).toFixed(2);
}

export function RefundPaymentDialog({
  open,
  onClose,
  tenders,
  onRefund,
  submitting = false,
}: RefundPaymentDialogProps): React.ReactElement {
  const t = useT();
  const [amounts, setAmounts] = useState<Record<string, number>>(
    () => Object.fromEntries(tenders.map((t) => [t.tenderType, t.amountPiasters])),
  );

  const handleSubmit = () => {
    const refundTenders = tenders
      .map((t) => ({
        tenderType: t.tenderType,
        amountPiasters: amounts[t.tenderType] ?? 0,
      }))
      .filter((t) => t.amountPiasters > 0);
    if (refundTenders.length === 0) return;
    onRefund(refundTenders);
  };

  const totalRefund = tenders.reduce((s, t) => s + (amounts[t.tenderType] ?? 0), 0);

  return (
    <Modal open={open} onClose={onClose} title={t('payments.refund')} size="md" footer={
      <>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={totalRefund <= 0 || submitting}
        >
          {submitting ? t('common.processing') : t('payments.refund')}
        </button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="section-label">{t('payments.originalTenders')}</div>
        {tenders.map((tender) => (
          <div key={tender.tenderType} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>{tender.tenderType.replace('_', ' ')}</span>
              <span className="num">{formatEgp(tender.amountPiasters)} EGP</span>
            </div>
            <Field label={t('payments.refundAmount')}>
              <input
                className="form-input num"
                type="number"
                step="0.01"
                max={formatEgp(tender.amountPiasters)}
                defaultValue={formatEgp(tender.amountPiasters)}
                onBlur={(e) => {
                  const raw = Number(e.target.value);
                  const val = Math.round(raw * 100);
                  const max = tender.amountPiasters;
                  const clamped = Number.isFinite(val) ? Math.max(0, Math.min(val, max)) : 0;
                  setAmounts((prev) => ({ ...prev, [tender.tenderType]: clamped }));
                }}
                disabled={submitting}
              />
            </Field>
          </div>
        ))}
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
          <span>{t('payments.totalRefund')}</span>
          <span className="num">{formatEgp(totalRefund)} EGP</span>
        </div>
      </div>
    </Modal>
  );
}
