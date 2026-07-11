import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchSuppliers, createSupplier, selectSupplier, deactivateSupplier } from '../../lib/store/suppliersSlice';
import { Modal, Field } from '@packages/ui-components';
import { useToast } from '@packages/ui-components';
import { SupplierProfilePage } from './SupplierProfilePage';

const PAGE_SIZE = 50;

export function SupplierListPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { suppliers, status, error } = useAppSelector((s: any) => s.suppliers);
  const companyId = useAppSelector((s: any) => s.auth.user?.companyId ?? 'company-1');
  const { push } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchSuppliers({ companyId }));
  }, [dispatch, companyId]);

  const filteredSuppliers = suppliers.filter((s: any) => {
    const q = search.toLowerCase();
    return (
      s.name.ar.toLowerCase().includes(q) ||
      (s.name.en ?? '').toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filteredSuppliers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNameAr.trim() || !newPhone.trim()) return;
    try {
      await dispatch(createSupplier({
        name: { ar: newNameAr.trim(), en: newNameEn.trim() || undefined },
        phone: newPhone.trim(),
        companyId,
      })).unwrap();
      setNewNameAr('');
      setNewNameEn('');
      setNewPhone('');
      setIsCreateOpen(false);
      push({ type: 'success', msg: 'Supplier created successfully' });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleSelect = (supplierId: string) => {
    setSelectedId(supplierId);
    dispatch(selectSupplier(null));
  };

  const handleBack = () => {
    setSelectedId(null);
  };

  const handleDeactivate = async (supplierId: string) => {
    try {
      await dispatch(deactivateSupplier({ supplierId, companyId })).unwrap();
      push({ type: 'success', msg: 'Supplier deactivated' });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  if (selectedId) {
    return <SupplierProfilePage supplierId={selectedId} onBack={handleBack} onDeactivate={handleDeactivate} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage supplier profiles, ledger, and performance.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          Add Supplier
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or phone"
          aria-label="Search suppliers"
        />
      </div>

      {isCreateOpen && (
        <div className="card" style={{ marginBlockStart: 'var(--space-3)' }}>
          <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Supplier</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Name (Arabic)" required htmlFor="supp-name-ar">
              <input id="supp-name-ar" className="form-input" value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} required />
            </Field>
            <Field label="Name (English)" htmlFor="supp-name-en">
              <input id="supp-name-en" className="form-input" value={newNameEn} onChange={(e) => setNewNameEn(e.target.value)} />
            </Field>
            <Field label="Phone" required htmlFor="supp-phone">
              <input id="supp-phone" className="form-input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {status === 'loading' && suppliers.length === 0 ? (
        <div className="loading">Loading suppliers…</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No suppliers found</p>
          <p>Try a different filter or add a new supplier.</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th className="table-numeric">Balance</th>
                <th className="table-numeric">On-Time Rate</th>
                <th className="table-numeric">Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((supplier: any) => (
                <tr
                  key={supplier.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelect(supplier.id)}
                >
                  <td>{supplier.name.ar} {supplier.name.en ? `(${supplier.name.en})` : ''}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{supplier.phone}</td>
                  <td className="table-numeric">{supplier.balancePiasters.toLocaleString()}</td>
                  <td className="table-numeric">{supplier.onTimeRate.toFixed(1)}%</td>
                  <td className="table-numeric">{supplier.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredSuppliers.length} items)
            </span>
            <div className="pagination-controls">
              <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
