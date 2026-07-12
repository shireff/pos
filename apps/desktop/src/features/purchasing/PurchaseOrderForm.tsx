import React, { useState } from 'react';
import { useT, Icon } from '@packages/ui-components';
import { useAppDispatch } from '../../lib/store/hooks';
import {
  createPurchaseOrder,
  type PurchaseOrder,
} from '../../lib/store/purchasingSlice';

interface DraftLine {
  productId: string;
  variantId: string;
  unitId: string;
  orderedQuantity: string;
  unitPricePiasters: string;
}

const EMPTY_LINE: DraftLine = {
  productId: '',
  variantId: '',
  unitId: '',
  orderedQuantity: '1',
  unitPricePiasters: '0',
};

export function PurchaseOrderForm({
  companyId,
  branchId,
  onCreated,
}: {
  companyId: string;
  branchId: string;
  onCreated: (po: PurchaseOrder) => void;
}): React.ReactElement {
  const t = useT();
  const dispatch = useAppDispatch();
  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const submit = async () => {
    setError(null);
    const parsed: Array<{
      productId: string;
      variantId: string | null;
      unitId: string;
      orderedQuantity: number;
      unitPricePiasters: number;
    }> = [];
    for (const l of lines) {
      const qty = Number(l.orderedQuantity);
      const price = Number(l.unitPricePiasters);
      if (!l.productId || !l.unitId) {
        setError(t('purchasing.errLineNeedsProductUnit'));
        return;
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        setError(t('purchasing.errQtyPositive'));
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        setError(t('purchasing.errPriceNegative'));
        return;
      }
      parsed.push({
        productId: l.productId,
        variantId: l.variantId || null,
        unitId: l.unitId,
        orderedQuantity: qty,
        unitPricePiasters: Math.round(price),
      });
    }
    if (!supplierId.trim()) {
      setError(t('purchasing.errSupplierRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const po = await dispatch(
        createPurchaseOrder({
          companyId,
          branchId,
          supplierId: supplierId.trim(),
          expectedDeliveryDate: expectedDeliveryDate || new Date().toISOString(),
          notes: notes || null,
          lines: parsed,
        }),
      ).unwrap();
      onCreated(po as unknown as PurchaseOrder);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('purchasing.errCreateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.orderedQuantity) || 0) * (Number(l.unitPricePiasters) || 0),
    0,
  );

  return (
    <div className="po-form">
      <div className="form-field">
        <label className="form-label" htmlFor="po-supplier">{t('purchasing.supplierId')}</label>
        <input
          id="po-supplier"
          className="form-input"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          placeholder={t('purchasing.supplierPlaceholder')}
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="po-delivery">{t('purchasing.expectedDelivery')}</label>
        <input
          id="po-delivery"
          className="form-input"
          type="date"
          value={expectedDeliveryDate ? expectedDeliveryDate.slice(0, 10) : ''}
          onChange={(e) => setExpectedDeliveryDate(new Date(e.target.value).toISOString())}
        />
      </div>

      <div className="po-lines">
        <div className="po-lines__head">
          <span>{t('purchasing.product')}</span>
          <span>{t('purchasing.unit')}</span>
          <span>{t('purchasing.qty')}</span>
          <span>{t('purchasing.unitPricePt')}</span>
          <span />
        </div>
        {lines.map((l, idx) => (
          <div className="po-lines__row" key={idx}>
            <input
              className="form-input"
              value={l.productId}
              onChange={(e) => updateLine(idx, { productId: e.target.value })}
              placeholder={t('purchasing.productPlaceholder')}
            />
            <input
              className="form-input"
              value={l.unitId}
              onChange={(e) => updateLine(idx, { unitId: e.target.value })}
              placeholder={t('purchasing.unitPlaceholder')}
            />
            <input
              className="form-input num"
              value={l.orderedQuantity}
              onChange={(e) => updateLine(idx, { orderedQuantity: e.target.value })}
              inputMode="numeric"
            />
            <input
              className="form-input num"
              value={l.unitPricePiasters}
              onChange={(e) => updateLine(idx, { unitPricePiasters: e.target.value })}
              inputMode="numeric"
            />
             <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(idx)} aria-label={t('purchasing.removeLine')}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
        <Icon name="plus" size={14} /> {t('purchasing.addLine')}
       </button>

       <div className="form-field">
         <label className="form-label" htmlFor="po-notes">{t('common.notes')}</label>
        <textarea
          id="po-notes"
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="po-form__footer">
         <span className="po-form__total">{t('purchasing.total')}: {(total / 100).toFixed(2)} EGP</span>
         <button className="btn btn-primary" onClick={submit} disabled={submitting}>
           {submitting ? t('purchasing.saving') : t('purchasing.createPo')}
         </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
