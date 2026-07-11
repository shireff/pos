import React, { useState, useMemo } from 'react';
import { Modal } from '../components/ui';
import { useT } from '../i18n';
import type { TenderType } from '@packages/domain-sales';

export interface SplitTenderInput {
  tenderType: TenderType;
  amountPiasters: number;
}

export interface PaymentPanelProps {
  open: boolean;
  onClose: () => void;
  grandTotalPiasters: number;
  onSubmit: (tenders: SplitTenderInput[]) => void;
  submitting?: boolean;
}

const TENDER_TYPES: TenderType[] = [
  'cash',
  'card',
  'vodafone_cash',
  'orange_cash',
  'etisalat_cash',
  'we_pay',
  'instapay',
  'bank_transfer',
  'customer_credit',
  'store_credit',
];

function formatEgp(piasters: number): string {
  return (piasters / 100).toFixed(2);
}

export function PaymentPanel({
  open,
  onClose,
  grandTotalPiasters,
  onSubmit,
  submitting = false,
}: PaymentPanelProps): React.ReactElement {
  const t = useT();
  const [tenders, setTenders] = useState<SplitTenderInput[]>([]);
  const [selectedType, setSelectedType] = useState<TenderType>('cash');

  const paidPiasters = useMemo(
    () => tenders.reduce((s, t) => s + t.amountPiasters, 0),
    [tenders],
  );
  const changePiasters = paidPiasters - grandTotalPiasters;
  const remaining = grandTotalPiasters - paidPiasters;
  const isValid = tenders.length > 0 && paidPiasters === grandTotalPiasters;

  const quickAdd = (type: TenderType) => {
    setSelectedType(type);
    const amount = remaining > 0 ? remaining : 0;
    if (amount <= 0 && remaining > 0) return;
    setTenders((prev) => [...prev, { tenderType: type, amountPiasters: amount > 0 ? amount : 0 }]);
  };

  const updateTenderAmount = (index: number, amountPiasters: number) => {
    setTenders((prev) =>
      prev.map((t, i) => (i === index ? { ...t, amountPiasters } : t)),
    );
  };

  const removeTender = (index: number) => {
    setTenders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(tenders);
  };

  return (
    <Modal open={open} onClose={onClose} title={t('payments.title')} size="lg" footer={
      <>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
        >
          {submitting ? t('common.processing') : t('payments.confirm')}
        </button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>{t('payments.total')}</span>
          <span className="num">{formatEgp(grandTotalPiasters)} EGP</span>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>{t('payments.remaining')}</span>
          <span className="num">{formatEgp(Math.max(0, remaining))} EGP</span>
        </div>

        <div>
          <div className="section-label" style={{ marginBlockEnd: 'var(--space-2)' }}>
            {t('payments.tenderType')}
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {TENDER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`btn btn-sm ${selectedType === type ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => quickAdd(type)}
                disabled={submitting || remaining <= 0}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {tenders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div className="section-label">{t('payments.splitTender')}</div>
            {tenders.map((tender, idx) => (
              <div key={idx} className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ width: 130 }} className="section-label">{tender.tenderType.replace('_', ' ')}</span>
                <input
                  className="form-input num"
                  type="number"
                  step="0.01"
                  defaultValue={formatEgp(tender.amountPiasters)}
                  onBlur={(e) => {
                    const val = Math.round(Number(e.target.value) * 100);
                    if (Number.isFinite(val) && val > 0) {
                      updateTenderAmount(idx, val);
                    }
                  }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeTender(idx)}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>{t('payments.paid')}</span>
          <span className="num">{formatEgp(paidPiasters)} EGP</span>
        </div>
        {changePiasters > 0 && (
          <div className="row" style={{ justifyContent: 'space-between', color: 'var(--color-success)' }}>
            <span>{t('payments.change')}</span>
            <span className="num">{formatEgp(changePiasters)} EGP</span>
          </div>
        )}
        {paidPiasters > grandTotalPiasters && (
          <div className="error-banner" role="alert">
            {t('payments.overpaid')}
          </div>
        )}
      </div>
    </Modal>
  );
}
