import React, { useEffect, useState } from 'react';
import { CreditEntry } from '../../lib/store/customersSlice';

export interface CreditHistoryTabProps {
  customerId: string;
  companyId: string;
  page: number;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 20;

export function CreditHistoryTab({ customerId, companyId, page, onPageChange }: CreditHistoryTabProps): React.ReactElement {
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
        const response = await fetch(
          `${baseUrl}/api/v1/customers/${customerId}/credit/history?companyId=${companyId}&limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
          {
            headers: { Authorization: `Bearer ${(await import('../../storage/secureStorage')).getAuthSession().then(s => s?.token ?? '')}` },
          },
        );
        const data = await response.json();
        setEntries(data.data ?? []);
        setTotal(data.total ?? 0);
      } catch {
        setEntries([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [customerId, companyId, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading && entries.length === 0) {
    return <div className="loading">Loading credit history…</div>;
  }

  if (entries.length === 0) {
    return <div className="empty-state"><p>No credit entries yet.</p></div>;
  }

  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th>Event</th>
            <th className="table-numeric">Amount (EGP)</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Occurred At</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td><span className="badge badge-active">{entry.eventType}</span></td>
              <td className="table-numeric">{entry.amountPiasters.toLocaleString()}</td>
              <td>{entry.paymentMethod ?? '—'}</td>
              <td>{entry.referenceNumber ?? '—'}</td>
              <td>{new Date(entry.occurredAt).toLocaleString('en-CA')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <span className="pagination-info">Page {page} of {totalPages} ({total} entries)</span>
        <div className="pagination-controls">
          <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Prev</button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
