import React from 'react';
import { Modal, useToast } from '../components/ui';
import { useT } from '../i18n';

export interface DigitalReceiptLine {
  name: string;
  qty: number;
  unitPricePiasters: number;
  lineTotalPiasters: number;
}

export interface DigitalReceiptModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  companyName: string;
  branchName: string;
  cashierId: string;
  lines: DigitalReceiptLine[];
  subtotalPiasters: number;
  discountPiasters?: number;
  taxPiasters?: number;
  grandTotalPiasters: number;
}

function formatEgp(piasters: number): string {
  return (piasters / 100).toFixed(2);
}

/**
 * DigitalReceiptModal is the screen fallback shown when a physical receipt
 * printer is unavailable or rejects a job (Hardware.md §2). The sale has
 * already completed; this surface only displays the receipt, optionally
 * allowing the cashier to copy it. No peripheral is required.
 */
export function DigitalReceiptModal({
  open,
  onClose,
  orderId,
  companyName,
  branchName,
  cashierId,
  lines,
  subtotalPiasters,
  discountPiasters = 0,
  taxPiasters = 0,
  grandTotalPiasters,
}: DigitalReceiptModalProps): React.ReactElement {
  const t = useT();
  const { push } = useToast();

  const handleCopy = async () => {
    const text = [
      companyName,
      branchName,
      `${t('pos.receipt.order')}: ${orderId}`,
      ...lines.map((l) => `  ${l.qty} x ${formatEgp(l.unitPricePiasters)} = ${formatEgp(l.lineTotalPiasters)}`),
      `${t('pos.receipt.total')}: ${formatEgp(grandTotalPiasters)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      push({ type: 'success', msg: t('pos.receipt.copy') });
    } catch {
      push({ type: 'error', msg: t('toast.error') });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('pos.receipt.title')}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleCopy}>
            {t('pos.receipt.copy')}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t('pos.receipt.close')}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <p className="section-label">{t('pos.receipt.printerUnavailable')}</p>
        <div className="card" style={{ padding: 'var(--space-3)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{companyName}</strong>
          </div>
          <div className="section-label">{branchName}</div>
          <div className="section-label">
            {t('pos.receipt.order')}: {orderId}
          </div>
          <div className="section-label">
            {t('pos.receipt.cashier')}: {cashierId}
          </div>
          <hr style={{ border: 0, borderTop: '1px dashed var(--color-border)', margin: 'var(--space-2) 0' }} />
          <ul style={{ margin: 0, paddingInlineStart: 'var(--space-4)' }}>
            {lines.map((l, i) => (
              <li key={i}>
                {l.name} — {l.qty} x {formatEgp(l.unitPricePiasters)} = {formatEgp(l.lineTotalPiasters)}
              </li>
            ))}
          </ul>
          <hr style={{ border: 0, borderTop: '1px dashed var(--color-border)', margin: 'var(--space-2) 0' }} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{t('pos.receipt.subtotal')}</span>
            <span className="num">{formatEgp(subtotalPiasters)} EGP</span>
          </div>
          {discountPiasters > 0 && (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>{t('pos.receipt.discount')}</span>
              <span className="num">−{formatEgp(discountPiasters)} EGP</span>
            </div>
          )}
          {taxPiasters > 0 && (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>{t('pos.receipt.tax')}</span>
              <span className="num">{formatEgp(taxPiasters)} EGP</span>
            </div>
          )}
          <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
            <span>{t('pos.receipt.total')}</span>
            <span className="num">{formatEgp(grandTotalPiasters)} EGP</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
