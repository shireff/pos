import React, { useEffect, useState } from 'react';
import { Icon } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchSupplierById,
  clearSupplierDetail,
  recordSupplierPayment,
  applySupplierCreditNote,
  fetchSupplierPerformance,
  type SupplierDetail,
  type LedgerEntry,
  type PriceHistoryEntry,
  type SupplierPerformance,
} from '../../lib/store/suppliersSlice';
import { Modal, Field } from '@packages/ui-components';
import { useToast } from '@packages/ui-components';

type TabKey = 'overview' | 'ledger' | 'price-history' | 'performance' | 'contacts';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'price-history', label: 'Price History' },
  { key: 'performance', label: 'Performance' },
  { key: 'contacts', label: 'Contacts' },
];

export interface SupplierProfilePageProps {
  supplierId: string;
  onBack: () => void;
  onDeactivate: (supplierId: string) => void;
}

export function SupplierProfilePage({
  supplierId,
  onBack,
  onDeactivate,
}: SupplierProfilePageProps): React.ReactElement {
  const dispatch = useAppDispatch();
  const detail = useAppSelector((state: any) => state.suppliers.selectedSupplier as SupplierDetail | null);
  const detailStatus = useAppSelector((state: any) => state.suppliers.detailStatus);
  const performance = useAppSelector((state: any) => state.suppliers.performance as SupplierPerformance | null);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');
  const { push } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCreditNoteOpen, setIsCreditNoteOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  useEffect(() => {
    void dispatch(fetchSupplierById({ supplierId, companyId }));
    void dispatch(fetchSupplierPerformance({ supplierId, companyId }));
    return () => {
      dispatch(clearSupplierDetail());
    };
  }, [dispatch, supplierId, companyId]);

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentAmount) return;
    try {
      await dispatch(recordSupplierPayment({
        supplierId,
        amountPiasters: Number(paymentAmount),
        paymentMethod,
        companyId,
      })).unwrap();
      setPaymentAmount('');
      setPaymentNotes('');
      setIsPaymentOpen(false);
      push({ type: 'success', msg: 'Payment recorded' });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleCreditNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!creditAmount || !creditReason.trim()) return;
    try {
      await dispatch(applySupplierCreditNote({
        supplierId,
        amountPiasters: Number(creditAmount),
        reason: creditReason.trim(),
        companyId,
      })).unwrap();
      setCreditAmount('');
      setCreditReason('');
      setIsCreditNoteOpen(false);
      push({ type: 'success', msg: 'Credit note applied' });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  if (detailStatus === 'loading' && !detail) {
    return <div className="loading">Loading supplier profile…</div>;
  }

  if (!detail) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Supplier not found</p>
        <button type="button" className="btn btn-secondary" onClick={onBack}>Back to list</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
              <Icon name="arrow-left" size={16} />
            </button>
            <h1 className="page-title">{detail.name.ar}</h1>
          </div>
          <p className="page-subtitle">{detail.phone} · {detail.email ?? 'No email'} · {detail.currency}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-primary" onClick={() => setIsPaymentOpen(true)}>
            Record Payment
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setIsCreditNoteOpen(true)}>
            Credit Note
          </button>
          {detail.isActive && (
            <button type="button" className="btn btn-ghost" onClick={() => onDeactivate(detail.id)}>
              Deactivate
            </button>
          )}
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="card" style={{ marginBlockStart: 'var(--space-3)' }}>
          <h2 className="card-title">Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBlockStart: 'var(--space-3)' }}>
            <div>
              <div className="section-label">Balance</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{detail.balancePiasters.toLocaleString()} piasters</div>
            </div>
            <div>
              <div className="section-label">Payment Terms</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{detail.paymentTermsDays} days</div>
            </div>
            <div>
              <div className="section-label">Tax ID</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{detail.taxId ?? 'N/A'}</div>
            </div>
            <div>
              <div className="section-label">Status</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{detail.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
          {detail.address && (
            <div style={{ marginBlockStart: 'var(--space-3)' }}>
              <div className="section-label">Address</div>
              <div>{detail.address}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th className="table-numeric">Amount</th>
                <th>Reference</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(detail.recentLedgerEntries ?? []).map((entry: LedgerEntry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.occurredAt).toLocaleDateString()}</td>
                  <td>{entry.eventType}</td>
                  <td className="table-numeric">{entry.amountPiasters.toLocaleString()}</td>
                  <td>{entry.referenceId ?? '-'}</td>
                  <td>{entry.notes ?? '-'}</td>
                </tr>
              ))}
              {(!detail.recentLedgerEntries || detail.recentLedgerEntries.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No ledger entries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'price-history' && (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th className="table-numeric">Price</th>
                <th>Effective</th>
                <th>PO</th>
              </tr>
            </thead>
            <tbody>
              {(detail.recentPriceHistory ?? []).map((entry: PriceHistoryEntry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.recordedAt).toLocaleDateString()}</td>
                  <td>{entry.productId}</td>
                  <td className="table-numeric">{entry.unitPricePiasters.toLocaleString()}</td>
                  <td>{new Date(entry.effectiveDate).toLocaleDateString()}</td>
                  <td>{entry.purchaseOrderId ?? '-'}</td>
                </tr>
              ))}
              {(!detail.recentPriceHistory || detail.recentPriceHistory.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No price history yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'performance' && (
        <div style={{ marginBlockStart: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="card">
            <h2 className="card-title">On-Time Delivery</h2>
            {performance ? (
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBlockStart: 'var(--space-2)' }}>
                <div>
                  <div className="section-label">Rate</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{performance.onTimeDeliveryRate.rate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="section-label">On Time</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{performance.onTimeDeliveryRate.onTimeCount} / {performance.onTimeDeliveryRate.totalCount}</div>
                </div>
              </div>
            ) : (
              <div className="loading">Loading performance…</div>
            )}
          </div>
          <div className="card">
            <h2 className="card-title">Price Variance</h2>
            {performance ? (
              <div style={{ marginBlockStart: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{performance.priceVariance.toFixed(2)}%</div>
              </div>
            ) : (
              <div className="loading">Loading performance…</div>
            )}
          </div>
          <div className="card">
            <h2 className="card-title">Narrative</h2>
            {performance ? (
              <p style={{ marginBlockStart: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>{performance.narrative}</p>
            ) : (
              <div className="loading">Loading narrative…</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {(detail.contacts ?? []).map((contact: any) => (
                <tr key={contact.name + contact.phone}>
                  <td>{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.email ?? '-'}</td>
                  <td>{contact.role ?? '-'}</td>
                </tr>
              ))}
              {(!detail.contacts || detail.contacts.length === 0) && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No contacts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isPaymentOpen && (
        <Modal open={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Record Payment">
          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Amount (piasters)" required htmlFor="pay-amount">
              <input id="pay-amount" className="form-input" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
            </Field>
            <Field label="Payment Method" required htmlFor="pay-method">
              <input id="pay-method" className="form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required />
            </Field>
            <Field label="Notes" htmlFor="pay-notes">
              <input id="pay-notes" className="form-input" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {isCreditNoteOpen && (
        <Modal open={isCreditNoteOpen} onClose={() => setIsCreditNoteOpen(false)} title="Apply Credit Note">
          <form onSubmit={handleCreditNote} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Amount (piasters)" required htmlFor="credit-amount">
              <input id="credit-amount" className="form-input" type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} required />
            </Field>
            <Field label="Reason" required htmlFor="credit-reason">
              <input id="credit-reason" className="form-input" value={creditReason} onChange={(e) => setCreditReason(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreditNoteOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
