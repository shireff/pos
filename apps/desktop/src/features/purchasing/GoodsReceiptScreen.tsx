import React, { useState } from 'react';
import { useT, Icon, WarehouseSelector } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { receivePurchaseOrder, type PurchaseOrder } from '../../lib/store/purchasingSlice';
import { fetchWarehouses } from '../../lib/store/inventorySlice';
import { useEffect } from 'react';

const DISCREPANCY_TYPES = ['quantity_shortage', 'quality_rejection', 'wrong_item'] as const;

export function GoodsReceiptScreen({
  purchaseOrder,
  onDone,
}: {
  purchaseOrder: PurchaseOrder;
  onDone: () => void;
}): React.ReactElement {
  const t = useT();
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector((s) => s.inventory.warehouses);
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<Record<string, { qty: string; flag: string; note: string }>>(() =>
    Object.fromEntries(
      purchaseOrder.lines.map((l) => [l.id, { qty: String(l.orderedQuantity), flag: '', note: '' }]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const update = (lineId: string, patch: Partial<{ qty: string; flag: string; note: string }>) =>
    setEntries((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));

  const submit = async () => {
    setError(null);
    if (!warehouseId) {
      setError('Select a warehouse first.');
      return;
    }
    const lines = purchaseOrder.lines.map((l) => {
      const e = entries[l.id];
      const qty = Number(e.qty);
      if (!Number.isInteger(qty) || qty < 0) {
        throw new Error('Received quantity must be a non-negative whole number.');
      }
      const flag = e.flag || (qty < l.orderedQuantity ? 'quantity_shortage' : null);
      return {
        lineId: l.id,
        warehouseId,
        receivedQuantity: qty,
        discrepancyType: flag || null,
        discrepancyNotes: e.note || null,
      };
    });
    setSubmitting(true);
    try {
      await dispatch(
        receivePurchaseOrder({ id: purchaseOrder.id, notes: notes || null, lines }),
      ).unwrap();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to receive goods');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="receipt-screen">
      <WarehouseSelector
        warehouses={warehouses}
        value={warehouseId}
        onChange={setWarehouseId}
        label="Receiving warehouse"
        placeholder="Select warehouse"
      />

      <div className="receipt-lines">
        {purchaseOrder.lines.map((l) => {
          const e = entries[l.id];
          return (
            <div className="receipt-line" key={l.id}>
              <div className="receipt-line__head">
                <span>{l.productId}</span>
                <span className="num">ordered {l.orderedQuantity}</span>
              </div>
              <div className="receipt-line__controls">
                <input
                  className="form-input num"
                  value={e.qty}
                  onChange={(ev) => update(l.id, { qty: ev.target.value })}
                  inputMode="numeric"
                  aria-label="Received quantity"
                />
                <label className="receipt-flag">
                  <input
                    type="checkbox"
                    checked={Boolean(e.flag)}
                    onChange={(ev) => update(l.id, { flag: ev.target.checked ? 'quantity_shortage' : '' })}
                  />
                  Discrepancy
                </label>
              </div>
              {e.flag && (
                <select
                  className="form-input"
                  value={e.flag}
                  onChange={(ev) => update(l.id, { flag: ev.target.value })}
                >
                  {DISCREPANCY_TYPES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
              <input
                className="form-input"
                value={e.note}
                onChange={(ev) => update(l.id, { note: ev.target.value })}
                placeholder="Discrepancy notes"
              />
            </div>
          );
        })}
      </div>

      <div className="form-field">
        <label className="form-label">Receipt notes</label>
        <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
        {submitting ? 'Saving…' : (<><Icon name="check" size={16} /> Confirm receipt</>)}
      </button>
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
