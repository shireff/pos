import React, { useState } from 'react';
import { useT, Icon } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  uploadInvoiceOcr,
  recordSupplierInvoice,
  clearOcrResult,
  type OcrInvoiceResult,
} from '../../lib/store/purchasingSlice';

/**
 * OCR upload (BR-SUP-003 / BR-SUP-004): the invoice image is uploaded, the
 * stub returns deterministic extracted fields which are shown as an EDITABLE
 * pre-filled form. The data is NEVER auto-committed — the user reviews and
 * corrects it, then explicitly records it as a supplier invoice. Every manual
 * correction is captured for the AI feedback loop (Phase 15 / ai_insight_feedback).
 */
export function OcrUpload({
  purchaseOrderId,
  companyId: _companyId,
}: {
  purchaseOrderId: string;
  companyId: string;
}): React.ReactElement {
  const t = useT();
  const dispatch = useAppDispatch();
  const supplierId = useAppSelector((s) => s.purchasing.currentPurchaseOrder?.supplierId) ?? '';

  const [fileReference, setFileReference] = useState('');
  const [editable, setEditable] = useState<OcrInvoiceResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const extract = async () => {
    if (!fileReference.trim()) {
      setMessage(t('purchasing.chooseInvoice'));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const extracted = await dispatch(
        uploadInvoiceOcr({ id: purchaseOrderId, fileReference: fileReference.trim() }),
      ).unwrap();
      setEditable(extracted);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('purchasing.ocrFailed'));
    } finally {
      setBusy(false);
    }
  };

  const applyToInvoice = async () => {
    if (!editable) return;
    setBusy(true);
    setMessage(null);
    try {
      await dispatch(
        recordSupplierInvoice({
          id: purchaseOrderId,
          supplierId: supplierId || 'ocr-supplier',
          invoiceNumber: editable.invoiceNumber,
          invoiceDate: editable.invoiceDate,
          totalAmountPiasters: Math.round(editable.totalAmountPiasters),
          taxAmountPiasters: 0,
        }),
      ).unwrap();
      setMessage(t('purchasing.recordedFromOcr'));
      setEditable(null);
      dispatch(clearOcrResult());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('purchasing.recordFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ocr-upload">
      <div className="ocr-upload__row">
        <input
          className="form-input"
          value={fileReference}
          onChange={(e) => setFileReference(e.target.value)}
          placeholder={t('purchasing.invoicePlaceholder')}
          aria-label={t('purchasing.invoiceFile')}
        />
        <button className="btn btn-secondary btn-sm" onClick={extract} disabled={busy}>
          <Icon name="scan" size={14} />           {busy ? t('purchasing.extracting') : t('purchasing.uploadExtract')}
        </button>
      </div>

      {editable && (
        <div className="ocr-panel">
          <p className="section-label">{t('purchasing.reviewExtracted')}</p>
          <div className="form-field">
            <label className="form-label">{t('purchasing.invoiceNumber')}</label>
            <input className="form-input" value={editable.invoiceNumber} onChange={(e) => setEditable({ ...editable, invoiceNumber: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">{t('purchasing.invoiceDate')}</label>
            <input className="form-input" value={editable.invoiceDate} onChange={(e) => setEditable({ ...editable, invoiceDate: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">{t('purchasing.totalAmountPiasters')}</label>
            <input className="form-input num" value={editable.totalAmountPiasters} onChange={(e) => setEditable({ ...editable, totalAmountPiasters: Number(e.target.value) })} inputMode="numeric" />
          </div>
          <ul className="ocr-lines">
            {editable.lineItems.map((li, i) => (
              <li key={i}>{li.productName} × {li.quantity} @ {(li.unitPricePiasters / 100).toFixed(2)} EGP</li>
            ))}
          </ul>
          <p className="field-hint">{t('purchasing.confidence')}: {(editable.confidence * 100).toFixed(0)}%</p>
          <button className="btn btn-primary btn-sm" onClick={applyToInvoice} disabled={busy}>
            {t('purchasing.recordSupplierInvoice')}
          </button>
        </div>
      )}

      {message && <div className="info-banner">{message}</div>}
    </div>
  );
}
